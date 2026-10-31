/**
 * Psyco AI — AI Sandbox & Vendor Privacy Safeguards Configuration
 * Phase 6.3
 * 
 * Enforces server-side feature flags and fail-closed validation to guarantee
 * that external AI (Google Gemini) and speech (AssemblyAI) vendor APIs are NOT
 * invoked in clinical workflows until enterprise privacy terms are executed.
 */

/**
 * Validates the AI Sandbox and vendor privacy configuration.
 * Fails closed (throws an Error) if any inconsistent or unsafe settings are detected.
 * 
 * @param {object} config - Configuration object to validate
 * @returns {boolean} true if configuration is consistent and safe
 * @throws {Error} if configuration fails validation
 */
export function validateAiSandboxConfig(config) {
  const {
    geminiProvider = 'mock',
    geminiClinicalLiveEnabled = false,
    assemblyaiLiveEnabled = false,
    sandboxMode = true,
  } = config || {};

  // Rule 1: geminiProvider must be strictly 'mock' or 'live'
  if (geminiProvider !== 'mock' && geminiProvider !== 'live') {
    throw new Error(
      `[FAIL-CLOSED CONFIG ERROR] Invalid GEMINI_PROVIDER '${geminiProvider}'. Permitted values: 'mock' | 'live'.`
    );
  }

  // Rule 2: In Sandbox Mode, live external vendor calls are strictly prohibited
  if (sandboxMode === true) {
    if (geminiProvider !== 'mock') {
      throw new Error(
        `[FAIL-CLOSED SECURITY VIOLATION] GEMINI_PROVIDER must be 'mock' when AI_SANDBOX_MODE is true. (Found: '${geminiProvider}')`
      );
    }
    if (geminiClinicalLiveEnabled === true) {
      throw new Error(
        '[FAIL-CLOSED SECURITY VIOLATION] GEMINI_CLINICAL_LIVE_ENABLED must be false when AI_SANDBOX_MODE is true.'
      );
    }
    if (assemblyaiLiveEnabled === true) {
      throw new Error(
        '[FAIL-CLOSED SECURITY VIOLATION] ASSEMBLYAI_LIVE_ENABLED must be false when AI_SANDBOX_MODE is true.'
      );
    }
  }

  // Rule 3: If provider is 'mock', live calls must be disabled
  if (geminiProvider === 'mock' && geminiClinicalLiveEnabled === true) {
    throw new Error(
      '[FAIL-CLOSED CONFIG ERROR] Inconsistent configuration: GEMINI_CLINICAL_LIVE_ENABLED cannot be true when GEMINI_PROVIDER is mock.'
    );
  }

  // Rule 4: If provider is 'live', sandbox mode must be explicitly false and live enabled must be true
  if (geminiProvider === 'live') {
    if (geminiClinicalLiveEnabled !== true) {
      throw new Error(
        '[FAIL-CLOSED CONFIG ERROR] Inconsistent configuration: GEMINI_CLINICAL_LIVE_ENABLED must be true when GEMINI_PROVIDER is live.'
      );
    }
    if (sandboxMode === true) {
      throw new Error(
        '[FAIL-CLOSED SECURITY VIOLATION] AI_SANDBOX_MODE must be false to enable live Gemini provider.'
      );
    }
  }

  return true;
}

/**
 * Resolves AI Sandbox configuration from environment variables with safe defaults.
 * Default behavior is 100% sandboxed / mock / fail-safe.
 */
export function resolveAiSandboxConfig(env = process.env) {
  const geminiProvider = (env.GEMINI_PROVIDER || 'mock').toLowerCase().trim();
  const geminiClinicalLiveEnabled = env.GEMINI_CLINICAL_LIVE_ENABLED === 'true';
  const assemblyaiLiveEnabled = env.ASSEMBLYAI_LIVE_ENABLED === 'true';
  const sandboxMode = env.AI_SANDBOX_MODE !== 'false'; // Default to true

  const resolved = {
    geminiProvider,
    geminiClinicalLiveEnabled,
    assemblyaiLiveEnabled,
    sandboxMode,
  };

  // Enforce fail-closed validation at resolution time
  validateAiSandboxConfig(resolved);

  return resolved;
}
