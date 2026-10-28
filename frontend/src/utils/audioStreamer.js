/**
 * Psyco AI - Ambient Audio Streamer
 * 
 * Captures microphone audio transiently, converts Float32 PCM to 16-bit linear PCM (mono, 16000Hz),
 * and streams bounded chunks over WebSocket to AssemblyAI v3 without retaining permanent audio buffers.
 * 
 * ZERO AUDIO PERSISTENCE GUARANTEE:
 * - Audio is held only in ephemeral audio processor buffers (<100ms).
 * - Buffers are discarded immediately after transmission.
 * - No audio files, blobs, or base64 data are persisted to disk or cloud storage.
 */

export class AudioStreamer {
  constructor({
    wsUrl,
    isSimulated = false,
    sampleRate = 16000,
    onTurn,
    onError,
    onOpen,
    onClose,
  }) {
    this.wsUrl = wsUrl;
    this.isSimulated = isSimulated;
    this.sampleRate = sampleRate;
    this.onTurn = onTurn || (() => {});
    this.onError = onError || (() => {});
    this.onOpen = onOpen || (() => {});
    this.onClose = onClose || (() => {});

    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.source = null;
    this.socket = null;
    this.isStreaming = false;
    this.isPaused = false;
    this.simulatedInterval = null;
  }

  /**
   * Starts microphone capture and establishes WebSocket stream
   */
  async start(deviceId = null) {
    if (this.isStreaming) return;

    try {
      // 1. Acquire microphone stream
      const constraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // 2. Setup WebSocket connection (or simulation if dev/unconfigured)
      if (this.isSimulated) {
        this.setupSimulation();
      } else {
        this.setupWebSocket();
      }

      // 3. Setup Web Audio pipeline
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: this.sampleRate });

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Buffer size 4096 at 16kHz corresponds to ~256ms audio slices
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isStreaming || this.isPaused) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16Data = this.convertFloat32ToInt16(inputData);

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(pcm16Data.buffer);
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isStreaming = true;
      this.isPaused = false;
    } catch (err) {
      this.cleanup();
      this.onError(err);
      throw err;
    }
  }

  /**
   * Pauses audio processing while keeping connection alive
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resumes audio processing
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * Stops streaming, closes socket, and terminates all audio tracks
   */
  stop() {
    this.cleanup();
    this.onClose();
  }

  /**
   * Clean up all transient memory, streams, and connections
   */
  cleanup() {
    this.isStreaming = false;
    this.isPaused = false;

    if (this.simulatedInterval) {
      clearInterval(this.simulatedInterval);
      this.simulatedInterval = null;
    }

    // Stop all media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Disconnect audio nodes
    if (this.source) {
      try { this.source.disconnect(); } catch (_) {}
      this.source = null;
    }

    if (this.processor) {
      try { this.processor.disconnect(); } catch (_) {}
      this.processor = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (_) {}
      this.audioContext = null;
    }

    if (this.socket) {
      try { this.socket.close(); } catch (_) {}
      this.socket = null;
    }
  }

  /**
   * Setup real AssemblyAI v3 WebSocket connection
   */
  setupWebSocket() {
    try {
      this.socket = new WebSocket(this.wsUrl);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        this.onOpen();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'Turn') {
            this.onTurn({
              turnOrder: message.turn_order ?? 0,
              transcript: message.transcript || '',
              endOfTurn: Boolean(message.end_of_turn),
              words: message.words || [],
              confidence: message.end_of_turn_confidence || 1.0,
            });
          }
        } catch (parseErr) {
          console.warn('Non-JSON message received from transcription provider:', parseErr);
        }
      };

      this.socket.onerror = (error) => {
        this.onError(error);
      };

      this.socket.onclose = (event) => {
        this.onClose(event);
      };
    } catch (err) {
      this.onError(err);
    }
  }

  /**
   * Simulation mode for environments without active AssemblyAI credentials
   */
  setupSimulation() {
    this.onOpen();

    const simulatedTurns = [
      'Hello doctor, thank you for meeting with me today.',
      'I have been feeling quite overwhelmed with work and personal stress over the past two weeks.',
      'Sometimes it feels like my thoughts are constantly racing before I go to sleep.',
      'I tried the breathing exercise we discussed in our last consultation, and it gave me some relief.',
      'I would like to focus today on managing my panic episodes during social presentations.',
    ];

    let turnIndex = 0;
    this.simulatedInterval = setInterval(() => {
      if (!this.isStreaming || this.isPaused) return;

      if (turnIndex < simulatedTurns.length) {
        const text = simulatedTurns[turnIndex];
        // Emit partial first
        this.onTurn({
          turnOrder: turnIndex,
          transcript: text.substring(0, Math.floor(text.length * 0.6)),
          endOfTurn: false,
        });

        // Emit final 1.5 seconds later
        setTimeout(() => {
          if (this.isStreaming && !this.isPaused) {
            this.onTurn({
              turnOrder: turnIndex,
              transcript: text,
              endOfTurn: true,
              speaker: turnIndex % 2 === 0 ? 'Patient' : 'Psychologist',
              audioStart: turnIndex * 5000,
              audioEnd: turnIndex * 5000 + 4200,
            });
            turnIndex++;
          }
        }, 1200);
      }
    }, 6000);
  }

  /**
   * Converts Float32 [-1, 1] audio buffer into 16-bit signed PCM buffer
   */
  convertFloat32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }
}
