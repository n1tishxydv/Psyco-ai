import config from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

class AssemblyAIAdapter {
  constructor() {
    this.name = 'AssemblyAI Streaming v3 (Ambient Transcription)';
    this.baseUrl = 'https://streaming.assemblyai.com/v3';
    this.wsUrl = 'wss://streaming.assemblyai.com/v3/ws';
  }

  isConfigured() {
    return Boolean(config.integrations.assemblyai.apiKey && !config.integrations.assemblyai.apiKey.includes('placeholder'));
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      service: this.name,
      configured,
      status: configured ? 'CONFIGURED' : 'UNCONFIGURED',
      endpoint: this.wsUrl,
      targetPhase: 'Phase 5 (Session Transcription & Transcript Management)',
      zeroAudioPersistenceEnforced: true,
      audioFormat: 'PCM16 Mono 16000Hz',
      message: configured
        ? 'AssemblyAI v3 streaming transcription configured.'
        : 'AssemblyAI API key is not configured. Streaming will operate in simulation/offline mode for testing.',
    };
  }

  /**
   * Generates a short-lived temporary authentication token for client WebSocket connection
   * @param {number} expiresInSeconds - Redemption window (1 to 600s, default 60)
   * @returns {Promise<{ token: string, wsUrl: string, expiresInSeconds: number }>}
   */
  async createStreamingToken(expiresInSeconds = 60) {
    if (!this.isConfigured()) {
      logger.info('AssemblyAI API key not set; generating simulated ephemeral token for dev/testing');
      const mockToken = `mock_aai_token_${crypto.randomBytes(16).toString('hex')}`;
      return {
        token: mockToken,
        wsUrl: `${this.wsUrl}?token=${mockToken}&sample_rate=16000`,
        expiresInSeconds,
        isSimulated: true,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/token?expires_in_seconds=${expiresInSeconds}`, {
        method: 'GET',
        headers: {
          Authorization: config.integrations.assemblyai.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`AssemblyAI token generation failed with status ${response.status}: ${errorText}`);
        const err = new Error(`AssemblyAI token generation failed: ${response.statusText}`);
        err.status = 502;
        throw err;
      }

      const data = await response.json();
      return {
        token: data.token,
        wsUrl: `${this.wsUrl}?token=${data.token}&sample_rate=16000`,
        expiresInSeconds,
        isSimulated: false,
      };
    } catch (err) {
      if (err.status) throw err;
      logger.error(`Exception requesting AssemblyAI token: ${err.message}`);
      const error = new Error(`Failed to contact AssemblyAI streaming service: ${err.message}`);
      error.status = 502;
      throw error;
    }
  }
}

export const assemblyaiAdapter = new AssemblyAIAdapter();
