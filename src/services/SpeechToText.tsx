import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Voice from '@react-native-community/voice';

const SpeechToText = forwardRef((_, ref) => {
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startRecognition = async () => {
    try {
      console.log('Starting voice recognition...');
      await Voice.start('en-US');
      setIsListening(true);
      setRecognizedText('');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  };

  Voice.onSpeechResults = (event) => {
    if (event.value) {
      setRecognizedText(event.value[0]); // Set recognized text
      stopRecognition(); // Stop listening after speech is detected
    }
  };

  const stopRecognition = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    startRecognition,
    recognizedText, // Expose recognized text to HomeScreen
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}></Text>
    </View>
  );
});

export default SpeechToText;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});