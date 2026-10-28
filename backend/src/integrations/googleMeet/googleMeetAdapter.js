import config from '../../config/index.js';
import { googleCalendarAdapter } from '../googleCalendar/googleCalendarAdapter.js';
import { logger } from '../../utils/logger.js';

class GoogleMeetAdapter {
  constructor() {
    this.name = 'Google Meet API v2 (Conference Records & Transcripts)';
    this.baseUrl = 'https://meet.googleapis.com/v2';
  }

  isConfigured() {
    return Boolean(config.integrations.google.isConfigured);
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      service: this.name,
      configured,
      status: configured ? 'CONFIGURED' : 'UNCONFIGURED',
      targetPhase: 'Phase 5 (Session Transcription & Meet Import)',
      supportedFeatures: ['conferenceRecords', 'transcripts', 'transcriptEntries'],
      message: configured
        ? 'Google Meet API v2 integration configured.'
        : 'Google OAuth credentials not configured in backend/.env. Online Meet transcript imports will require connection.',
    };
  }

  /**
   * Cleans meeting code from various URL formats (e.g., https://meet.google.com/abc-mnop-xyz -> abc-mnop-xyz)
   */
  extractMeetingCode(meetUrlOrCode) {
    if (!meetUrlOrCode) return null;
    const trimmed = meetUrlOrCode.trim();
    const match = trimmed.match(/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
    return match ? match[1].toLowerCase() : trimmed;
  }

  /**
   * Discovers conference records for a given meeting code
   * @param {string} psychologistId
   * @param {string} meetingCode
   */
  async discoverConferenceRecord(psychologistId, meetingCode) {
    const accessToken = await googleCalendarAdapter.getValidAccessToken(psychologistId);
    if (!accessToken) {
      return {
        success: false,
        status: 'OAUTH_REQUIRED',
        message: 'Google Calendar / Meet OAuth connection is required to import Meet transcripts.',
      };
    }

    const cleanCode = this.extractMeetingCode(meetingCode);
    if (!cleanCode) {
      return {
        success: false,
        status: 'INVALID_MEETING_CODE',
        message: 'A valid Google Meet code (e.g. abc-mnop-xyz) is required.',
      };
    }

    try {
      const filter = encodeURIComponent(`space.meeting_code="${cleanCode}"`);
      const url = `${this.baseUrl}/conferenceRecords?filter=${filter}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        logger.warn(`Google Meet conferenceRecords query returned ${res.status}: ${JSON.stringify(errorData)}`);
        return {
          success: false,
          status: 'API_ERROR',
          statusCode: res.status,
          message: errorData.error?.message || `Google Meet API error (${res.status})`,
        };
      }

      const data = await res.json();
      const records = data.conferenceRecords || [];

      if (records.length === 0) {
        return {
          success: false,
          status: 'RECORD_NOT_FOUND',
          message: `No conference record found for meeting code: ${cleanCode}. Note that records may take several minutes to generate after a call ends.`,
        };
      }

      // Return most recent conference record
      const sorted = records.sort((a, b) => (b.startTime || '').localeCompare(a.startTime || ''));
      return {
        success: true,
        status: 'RECORD_FOUND',
        conferenceRecord: sorted[0],
      };
    } catch (err) {
      logger.error(`Exception discovering conference record: ${err.message}`);
      return {
        success: false,
        status: 'NETWORK_ERROR',
        message: err.message,
      };
    }
  }

  /**
   * Lists transcript resources for a conference record
   * @param {string} psychologistId
   * @param {string} conferenceRecordName - format: conferenceRecords/{conferenceRecord}
   */
  async listTranscripts(psychologistId, conferenceRecordName) {
    const accessToken = await googleCalendarAdapter.getValidAccessToken(psychologistId);
    if (!accessToken) {
      return { success: false, status: 'OAUTH_REQUIRED', message: 'OAuth access required.' };
    }

    try {
      const url = `${this.baseUrl}/${conferenceRecordName}/transcripts`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          status: 'API_ERROR',
          message: errorData.error?.message || `Failed to list transcripts (${res.status})`,
        };
      }

      const data = await res.json();
      const transcripts = data.transcripts || [];

      if (transcripts.length === 0) {
        return {
          success: false,
          status: 'TRANSCRIPT_NOT_FOUND',
          message: 'No transcript artifacts found for this conference. Ensure Google Meet transcription was active during the session.',
        };
      }

      return {
        success: true,
        status: 'TRANSCRIPTS_FOUND',
        transcripts,
      };
    } catch (err) {
      logger.error(`Exception listing Meet transcripts: ${err.message}`);
      return { success: false, status: 'NETWORK_ERROR', message: err.message };
    }
  }

  /**
   * Retrieves all transcript entries for a transcript resource, with pagination
   * @param {string} psychologistId
   * @param {string} transcriptName - format: conferenceRecords/{conferenceRecord}/transcripts/{transcript}
   */
  async fetchTranscriptEntries(psychologistId, transcriptName) {
    const accessToken = await googleCalendarAdapter.getValidAccessToken(psychologistId);
    if (!accessToken) {
      return { success: false, status: 'OAUTH_REQUIRED', message: 'OAuth access required.' };
    }

    const allEntries = [];
    let pageToken = null;
    let pageCount = 0;
    const maxPages = 20; // safety ceiling (up to 2,000 entries)

    try {
      do {
        pageCount++;
        const params = new URLSearchParams({ pageSize: '100' });
        if (pageToken) params.append('pageToken', pageToken);

        const url = `${this.baseUrl}/${transcriptName}/entries?${params.toString()}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          logger.warn(`Failed fetching transcript entries page ${pageCount}: ${res.status}`);
          if (allEntries.length > 0) {
            // Partial retrieval
            break;
          }
          return {
            success: false,
            status: 'API_ERROR',
            message: errData.error?.message || `Failed to fetch transcript entries (${res.status})`,
          };
        }

        const data = await res.json();
        const entries = data.transcriptEntries || [];
        allEntries.push(...entries);
        pageToken = data.nextPageToken || null;
      } while (pageToken && pageCount < maxPages);

      return {
        success: true,
        status: 'ENTRIES_RETRIEVED',
        entries: allEntries,
        isTruncated: Boolean(pageToken),
      };
    } catch (err) {
      logger.error(`Exception fetching transcript entries: ${err.message}`);
      return { success: false, status: 'NETWORK_ERROR', message: err.message };
    }
  }
}

export const googleMeetAdapter = new GoogleMeetAdapter();
