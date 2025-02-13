import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import Voice, { SpeechRecognizedEvent, SpeechResultsEvent, SpeechErrorEvent } from '@react-native-community/voice';

const SpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  const startRecognition = async () => {
    try {
      console.log('Starting voice recognition...');
      await Voice.start('en-US');
      setIsListening(true);
      setRecognizedText('');
      console.log('Voice recognition started');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  }

  const stopRecognition = async () => {
    try {
      console.log('Stopping voice recognition...');
      await Voice.stop();
      setIsListening(false);
      console.log('Voice recognition stopped');
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  Voice.onSpeechResults = (event) => {
    console.log('Speech results event:', event);
    const { value } = event;
    if (value) {
      setRecognizedText(value[0]);
      console.log('Recognized text:', value[0]);
      stopRecognition();
    }
  };

  Voice.onSpeechError = (event) => {
    console.error('Speech error event:', event);
  };

  Voice.onSpeechRecognized = (event) => {
    console.log('Speech recognized event:', event);
  };

  return (
    <View style={{flex: 1, padding: 20}}>
      <Button
        title={isListening ? 'Stop listening' : 'Start listening'}
        onPress={isListening ? stopRecognition : startRecognition}
      />
      <Text>Recognized text: {recognizedText}</Text>
    </View>
  );
};

export default SpeechToText;