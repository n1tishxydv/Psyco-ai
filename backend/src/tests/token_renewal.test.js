import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apiRequest,
  setRuntimeApiBaseUrl,
  setTokenRefresher,
  resetTokenRefresher,
  setSessionExpiredHandler,
  resetSessionExpiredHandler,
  setCurrentUserGetter,
  resetCurrentUserGetter,
} from '../../../frontend/src/services/apiClient.js';

setRuntimeApiBaseUrl('https://api.psyco-ai.com/api/v1');

// Polyfill window, localStorage, and CustomEvent for Node test environment if needed
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    location: { pathname: '/patient/dashboard', search: '' },
    dispatchEvent: () => true,
  };
}

const mockStorage = new Map();
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: (k) => (mockStorage.has(k) ? mockStorage.get(k) : null),
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
    clear: () => mockStorage.clear(),
  };
}

test('Firebase Token Re-authentication & Renewal Architecture Test Suite', async (suite) => {
  const originalFetch = globalThis.fetch;

  suite.beforeEach(() => {
    mockStorage.clear();
    resetTokenRefresher();
    resetSessionExpiredHandler();
    resetCurrentUserGetter();
  });

  suite.afterEach(() => {
    globalThis.fetch = originalFetch;
    mockStorage.clear();
    resetTokenRefresher();
    resetSessionExpiredHandler();
    resetCurrentUserGetter();
  });

  await suite.test('1. Valid token: Outgoing request attaches token and completes without retry', async () => {
    mockStorage.set('psyco_token', 'valid_token_123');
    let fetchCount = 0;
    let authHeaderReceived = null;

    globalThis.fetch = async (url, options) => {
      fetchCount++;
      authHeaderReceived = options.headers?.Authorization;
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { user: 'verified' } }),
      };
    };

    const res = await apiRequest('/profile/me');
    assert.equal(fetchCount, 1, 'Request must execute exactly once');
    assert.equal(authHeaderReceived, 'Bearer valid_token_123');
    assert.deepEqual(res.data, { user: 'verified' });
  });

  await suite.test('2. Expired token triggers token renewal mechanism', async () => {
    mockStorage.set('psyco_token', 'expired_token_abc');
    let refreshTriggered = false;

    setTokenRefresher(async () => {
      refreshTriggered = true;
      return 'renewed_token_def';
    });

    globalThis.fetch = async (url, options) => {
      if (options.headers?.Authorization === 'Bearer expired_token_abc') {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: { code: 'TOKEN_EXPIRED', message: 'Firebase token expired' } }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { status: 'renewed' } }),
      };
    };

    const res = await apiRequest('/profile/me');
    assert.equal(refreshTriggered, true, 'Token refresh must be triggered on 401');
    assert.deepEqual(res.data, { status: 'renewed' });
  });

  await suite.test('3. Successful token renewal retries original request with new token', async () => {
    mockStorage.set('psyco_token', 'expired_token');
    const observedHeaders = [];

    setTokenRefresher(async () => {
      return 'fresh_valid_token_999';
    });

    globalThis.fetch = async (url, options) => {
      observedHeaders.push(options.headers?.Authorization);
      if (options.headers?.Authorization === 'Bearer expired_token') {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'Token expired' } }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { message: 'Retried successfully' } }),
      };
    };

    const res = await apiRequest('/appointments');
    assert.equal(observedHeaders.length, 2, 'Must have 1 initial call and 1 retry call');
    assert.equal(observedHeaders[0], 'Bearer expired_token');
    assert.equal(observedHeaders[1], 'Bearer fresh_valid_token_999');
    assert.equal(mockStorage.get('psyco_token'), 'fresh_valid_token_999', 'Storage must be updated with renewed token');
    assert.deepEqual(res.data, { message: 'Retried successfully' });
  });

  await suite.test('4. Failed token renewal triggers session expiration and does not retry', async () => {
    mockStorage.set('psyco_token', 'expired_token');
    let sessionExpiredCalled = false;
    let expiredReason = null;
    let fetchCount = 0;

    setSessionExpiredHandler(({ reason }) => {
      sessionExpiredCalled = true;
      expiredReason = reason;
    });

    setTokenRefresher(async () => {
      throw new Error('Refresh token revoked or network unavailable');
    });

    globalThis.fetch = async () => {
      fetchCount++;
      return {
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } }),
      };
    };

    await assert.rejects(
      async () => {
        await apiRequest('/profile/me');
      },
      (err) => {
        assert.equal(err.status, 401);
        return true;
      }
    );

    assert.equal(fetchCount, 1, 'Failed refresh must NOT retry original request');
    assert.equal(sessionExpiredCalled, true, 'Session expiration handler must be called');
    assert.equal(expiredReason, 'REFRESH_FAILED');
    assert.equal(localStorage.getItem('psyco_token'), null, 'Stored token must be cleared');
  });

  await suite.test('5. Concurrent failed requests share a single token renewal operation', async () => {
    mockStorage.set('psyco_token', 'stale_token');
    let refreshCalls = 0;

    setTokenRefresher(async () => {
      refreshCalls++;
      // Simulate asynchronous network latency for token renewal
      await new Promise((resolve) => setTimeout(resolve, 50));
      return 'shared_fresh_token_456';
    });

    globalThis.fetch = async (url, options) => {
      if (options.headers?.Authorization === 'Bearer stale_token') {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: { code: 'TOKEN_EXPIRED' } }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, url, token: options.headers?.Authorization }),
      };
    };

    // Fire 5 concurrent requests simultaneously
    const requests = [
      apiRequest('/appointments'),
      apiRequest('/profile/me'),
      apiRequest('/patients'),
      apiRequest('/settings'),
      apiRequest('/notes'),
    ];

    const results = await Promise.all(requests);

    assert.equal(refreshCalls, 1, 'Token refresh must execute EXACTLY ONCE for concurrent requests');
    assert.equal(results.length, 5);
    for (const res of results) {
      assert.equal(res.token, 'Bearer shared_fresh_token_456');
    }
  });

  await suite.test('6. Logged-out user: Refresh fails cleanly and triggers session expired', async () => {
    mockStorage.clear();
    let sessionExpiredHandled = false;

    // Simulate logged out Firebase state (currentUser returns null)
    setCurrentUserGetter(() => null);

    setSessionExpiredHandler(() => {
      sessionExpiredHandled = true;
    });

    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'No auth' } }),
      };
    };

    await assert.rejects(
      async () => {
        await apiRequest('/profile/me');
      },
      (err) => {
        assert.equal(err.status, 401);
        return true;
      }
    );

    assert.equal(sessionExpiredHandled, true, 'Session expiration must be invoked when user is logged out');
  });

  await suite.test('7. HTTP 403 Forbidden is NOT retried under any circumstances', async () => {
    mockStorage.set('psyco_token', 'valid_patient_token');
    let refreshCount = 0;
    let fetchCount = 0;

    setTokenRefresher(async () => {
      refreshCount++;
      return 'new_token';
    });

    globalThis.fetch = async () => {
      fetchCount++;
      return {
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            code: 'ADMIN_CLINICAL_ACCESS_PROHIBITED',
            message: 'Clinical charts are restricted from administrative accounts',
          },
        }),
      };
    };

    await assert.rejects(
      async () => {
        await apiRequest('/clinical/patients/pat_1/chart');
      },
      (err) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');
        return true;
      }
    );

    assert.equal(fetchCount, 1, 'HTTP 403 must NOT be retried');
    assert.equal(refreshCount, 0, 'Token refresh must NOT be attempted for HTTP 403');
  });

  await suite.test('8. Prevention of infinite retry loops: Retries at most once', async () => {
    mockStorage.set('psyco_token', 'token_1');
    let fetchCount = 0;
    let refreshCount = 0;

    setTokenRefresher(async () => {
      refreshCount++;
      return 'token_2';
    });

    // Server continues returning 401 even after token refresh
    globalThis.fetch = async () => {
      fetchCount++;
      return {
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'INVALID_TOKEN', message: 'Still invalid' } }),
      };
    };

    await assert.rejects(
      async () => {
        await apiRequest('/profile/me');
      },
      (err) => {
        assert.equal(err.status, 401);
        return true;
      }
    );

    assert.equal(fetchCount, 2, 'Request must be attempted at most twice (1 initial + 1 retry)');
    assert.equal(refreshCount, 1, 'Token must be refreshed at most once');
  });
});
