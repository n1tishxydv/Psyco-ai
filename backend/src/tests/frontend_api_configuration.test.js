import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isLoopbackUrl,
  resolveApiConfiguration,
} from '../../../frontend/src/services/apiClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

test('Frontend API Configuration & Loopback Protection Test Suite', async (suite) => {
  await suite.test('isLoopbackUrl correctly identifies loopback and non-loopback addresses', () => {
    // Loopback addresses must return true
    assert.equal(isLoopbackUrl('http://localhost:5000/api/v1'), true);
    assert.equal(isLoopbackUrl('http://localhost:5173'), true);
    assert.equal(isLoopbackUrl('https://localhost'), true);
    assert.equal(isLoopbackUrl('localhost:5000'), true);
    assert.equal(isLoopbackUrl('http://127.0.0.1:5000/api/v1'), true);
    assert.equal(isLoopbackUrl('http://127.0.0.1'), true);
    assert.equal(isLoopbackUrl('http://0.0.0.0:5000'), true);
    assert.equal(isLoopbackUrl('http://[::1]:5000'), true);
    assert.equal(isLoopbackUrl('http://app.localhost:5000'), true);

    // Valid external/cloud endpoints must return false
    assert.equal(isLoopbackUrl('https://psyco-ai-backend.onrender.com/api/v1'), false);
    assert.equal(isLoopbackUrl('https://api.psyco-ai.com/api/v1'), false);
    assert.equal(isLoopbackUrl('https://psyco-ai-staging.web.app'), false);

    // Empty or invalid input must return false safely
    assert.equal(isLoopbackUrl(''), false);
    assert.equal(isLoopbackUrl(null), false);
    assert.equal(isLoopbackUrl(undefined), false);
  });

  await suite.test('resolveApiConfiguration behavior in local development (isDev = true)', () => {
    // Default development fallback when VITE_API_BASE_URL is unset
    const defaultConfig = resolveApiConfiguration({
      rawUrl: '',
      isDev: true,
      defaultDevUrl: 'http://localhost:5000/api/v1',
    });
    assert.equal(defaultConfig.isConfigured, true);
    assert.equal(defaultConfig.baseUrl, 'http://localhost:5000/api/v1');
    assert.equal(defaultConfig.status, 'configured');

    // Custom development URL provided
    const customDevConfig = resolveApiConfiguration({
      rawUrl: 'http://localhost:5001/api/v1/',
      isDev: true,
    });
    assert.equal(customDevConfig.isConfigured, true);
    assert.equal(customDevConfig.baseUrl, 'http://localhost:5001/api/v1');
  });

  await suite.test('resolveApiConfiguration behavior in deployed builds (isDev = false)', () => {
    // 1. Missing or empty VITE_API_BASE_URL must NOT fall back to localhost
    const emptyDeployedConfig = resolveApiConfiguration({ rawUrl: '', isDev: false });
    assert.equal(emptyDeployedConfig.isConfigured, false);
    assert.equal(emptyDeployedConfig.baseUrl, null);
    assert.equal(emptyDeployedConfig.status, 'unconfigured');

    // 2. Localhost URL in deployed build must be strictly rejected
    const localhostDeployedConfig = resolveApiConfiguration({
      rawUrl: 'http://localhost:5000/api/v1',
      isDev: false,
    });
    assert.equal(localhostDeployedConfig.isConfigured, false);
    assert.equal(localhostDeployedConfig.baseUrl, null);
    assert.equal(localhostDeployedConfig.status, 'rejected_loopback');
    assert.ok(localhostDeployedConfig.message.includes('loopback'));

    // 3. 127.0.0.1 in deployed build must be strictly rejected
    const loopbackIpConfig = resolveApiConfiguration({
      rawUrl: 'http://127.0.0.1:5000/api/v1',
      isDev: false,
    });
    assert.equal(loopbackIpConfig.isConfigured, false);
    assert.equal(loopbackIpConfig.baseUrl, null);
    assert.equal(loopbackIpConfig.status, 'rejected_loopback');

    // 4. Valid remote backend URL must be accepted and normalized
    const validRemoteConfig = resolveApiConfiguration({
      rawUrl: 'https://psyco-ai-staging-backend.onrender.com/api/v1/',
      isDev: false,
    });
    assert.equal(validRemoteConfig.isConfigured, true);
    assert.equal(validRemoteConfig.baseUrl, 'https://psyco-ai-staging-backend.onrender.com/api/v1');
    assert.equal(validRemoteConfig.status, 'configured');
  });

  await suite.test('frontend/.env.staging does not expose loopback or localhost URL', () => {
    const stagingEnvPath = path.join(projectRoot, 'frontend', '.env.staging');
    assert.ok(fs.existsSync(stagingEnvPath), 'frontend/.env.staging must exist');

    const content = fs.readFileSync(stagingEnvPath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('VITE_API_BASE_URL=')) {
        const val = trimmed.substring('VITE_API_BASE_URL='.length).trim();
        assert.ok(
          !isLoopbackUrl(val),
          `VITE_API_BASE_URL in frontend/.env.staging must not be a loopback URL (got: ${val})`
        );
      }
    }
  });

  await suite.test('Production dist bundle does not contain localhost:5000 fallback', () => {
    const distAssetsDir = path.join(projectRoot, 'frontend', 'dist', 'assets');
    if (!fs.existsSync(distAssetsDir)) {
      // Build hasn't been run yet in this environment
      return;
    }

    const files = fs.readdirSync(distAssetsDir);
    const jsFiles = files.filter((f) => f.endsWith('.js'));
    assert.ok(jsFiles.length > 0, 'At least one compiled JS bundle should exist');

    for (const file of jsFiles) {
      const filePath = path.join(distAssetsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      assert.equal(
        content.includes('localhost:5000'),
        false,
        `Compiled JS asset ${file} must not contain "localhost:5000"`
      );
    }
  });
});
