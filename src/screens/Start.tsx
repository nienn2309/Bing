import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import SpeechToText from '../services/SpeechToText';
import { fetchPOIs } from '../services/api';

function HomeScreen({ navigation }) {
  const speechRef = useRef(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [matchedPOI, setMatchedPOI] = useState(null);
  const [pois, setPOIs] = useState([]);

  useEffect(() => {
    const loadPOIs = async () => {
      console.log('Fetching POIs...');
      const fetchedPOIs = await fetchPOIs();
      console.log('Fetched POIs:', fetchedPOIs);
      setPOIs(fetchedPOIs);
    };
    loadPOIs();
  }, []);

  useEffect(() => {
    if (recognizedText) {
      handlePOIMatch(recognizedText);
    }
  }, [recognizedText]);

  const handlePress = async () => {
    speechRef.current?.startRecognition();
    setTimeout(() => {
      const spokenText = speechRef.current?.recognizedText || '';
      setRecognizedText(spokenText);
    }, 3000); // Wait for speech processing
  };

  const handlePOIMatch = (spokenText) => {
    if (pois.length > 0) {
      const bestMatch = findBestMatch(spokenText, pois);
      if (bestMatch) {
        bestMatch.description = bestMatch.description || ""; // Ensure description exists
        console.log('Best Match:', bestMatch);
        setMatchedPOI(bestMatch);
        navigation.navigate('MapScreen', { poi: bestMatch });
      } else {
        console.log('No suitable POI found');
        Alert.alert('No POIs Found', 'Could not find a suitable POI.');
      }
    } else {
      console.log('No POIs found');
      Alert.alert('No POIs Found', 'Could not find any POIs.');
    }
  };

  const findBestMatch = (spokenText, pois) => {
    const lowerSpoken = spokenText.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    pois.forEach(poi => {
      const lowerPOIName = poi.name.toLowerCase();
      let score = 0;
      
      if (lowerPOIName.includes(lowerSpoken) || lowerSpoken.includes(lowerPOIName)) {
        score += 2; // Strong match for partial inclusion
      }
      
      if (lowerPOIName.startsWith(lowerSpoken) || lowerSpoken.startsWith(lowerPOIName)) {
        score += 1; // Bonus for prefix matching
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = poi;
      }
    });

    console.log('Final selected POI:', bestMatch || null);
    return bestMatch || null; // Return null if no match is found
  };

  return (
    <View style={styles.container}>
      <SpeechToText ref={speechRef} />

      <TouchableOpacity onPress={handlePress} style={styles.speakButton}>
        <Text style={styles.buttonText}>Press to Speak</Text>
      </TouchableOpacity>

      <Text style={styles.resultText}>Recognized: {recognizedText}</Text>
      {matchedPOI && (
        <Text style={styles.resultText}>Matched POI: {matchedPOI.name}</Text>
      )}
    </View>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  speakButton: {
    backgroundColor: '#555',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultText: {
    color: '#fff',
    fontSize: 22,
    marginTop: 20,
  },
});
