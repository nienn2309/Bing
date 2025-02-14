// App.tsx
import React from 'react';
import MapScreen from './src/screens/MapScreen';
import TextToSpeech from './src/services/TextToSpeech';
import SpeechToText from './src/services/SpeechToText';

const App = () => {
  // return <SpeechToText />;
  // return <TextToSpeech />;
  return <MapScreen />;
};

export default App; 