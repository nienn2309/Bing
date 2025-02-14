// src/services/TextToSpeechService.ts
import Tts from 'react-native-tts';

class TextToSpeechService {
  private static instance: TextToSpeechService;
  private isInitialized: boolean = false;
  private lastSpokenText: string = '';

  private constructor() {}

  public static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Tts.getInitStatus();
      
      // Configure TTS settings
      Tts.setDefaultRate(0.3);
      Tts.setIgnoreSilentSwitch('ignore');
      Tts.setDefaultPitch(0.7);

      // Set up event listeners
      Tts.addEventListener('tts-start', (event) => {
        console.log('TTS Started:', event);
      });

      Tts.addEventListener('tts-finish', (event) => {
        console.log('TTS Finished:', event);
      });

      Tts.addEventListener('tts-cancel', (event) => {
        console.log('TTS Cancelled:', event);
      });

      this.isInitialized = true;
      console.log('TTS initialized successfully');
    } catch (err) {
      if ((err as any).code === 'no_engine') {
        console.log('No TTS engine found');
        Tts.requestInstallEngine();
      }
      console.error('TTS initialization failed:', err);
      throw err;
    }
  }

  public async speak(text: string, force: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Only speak if the text is different from the last spoken text or if force is true
      if (force || text !== this.lastSpokenText) {
        await Tts.stop(); // Stop any ongoing speech
        await Tts.speak(text);
        this.lastSpokenText = text;
      }
    } catch (error) {
      console.error('Error speaking text:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await Tts.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
      throw error;
    }
  }

  public cleanup(): void {
    Tts.removeAllListeners('tts-start');
    Tts.removeAllListeners('tts-finish');
    Tts.removeAllListeners('tts-cancel');
    this.isInitialized = false;
  }

  // Additional utility methods
  public async setRate(rate: number): Promise<void> {
    await Tts.setDefaultRate(rate);
  }

  public async setPitch(pitch: number): Promise<void> {
    await Tts.setDefaultPitch(pitch);
  }
}

export default TextToSpeechService;