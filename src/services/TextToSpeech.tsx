import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Tts from 'react-native-tts';

// Function to initialize Text-to-Speech (TTS) settings and listeners
const initializeTtsListeners = async () => {
  Tts.getInitStatus().then(
    () => {
      console.log('ALL OK TTS ✅'); // TTS is initialized successfully
    },
    (err) => {
      if (err.code === 'no_engine') {
        console.log('NO ENGINE TTS ✅');
        Tts.requestInstallEngine();
      }
    }
  );

  Tts.setDefaultRate(0.3, true);
  Tts.setIgnoreSilentSwitch('ignore');
  Tts.setDefaultPitch(0.7);

  Tts.addEventListener('tts-start', (event) => {
    console.log('TTS Started: ', event);
  });

  Tts.addEventListener('tts-finish', (event) => {
    console.log('TTS finished: ', event);
  });

  Tts.addEventListener('tts-cancel', (event) => {
    console.log('TTS Cancel: ', event);
  });
};

// Function to play a message using TTS
const playTTS = async (message: string) => {
  Tts.getInitStatus().then(
    () => {
      console.log('ALL OK TTS ✅');
    },
    (err) => {
      if (err.code === 'no_engine') {
        console.log('NO ENGINE TTS ✅');
        Tts.requestInstallEngine();
      }
    }
  );

  Tts.speak(message);
};

const TextToSpeech = () => {
  useEffect(() => {
    initializeTtsListeners();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => playTTS('Hello World! This is text to speech implementation, Keep Coding!!!')}>
        <Text style={styles.ButtonText}>Click Me to Speak</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TextToSpeech;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'blue',
  },
});
