import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Animated, 
  Easing 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SpeechToText from '../services/SpeechToText';
import { fetchPOIs } from '../services/api';

function HomeScreen({ navigation }) {
  const speechRef = useRef(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [matchedPOI, setMatchedPOI] = useState(null);
  const [pois, setPOIs] = useState([]);
  const [isListening, setIsListening] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

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

  const startListeningAnimation = () => {
    setIsListening(true);

    // Scale effect when pressing
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Soundwave effect loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopListeningAnimation = () => {
    setIsListening(false);
    waveAnim.setValue(0);
  };

  const handlePress = async () => {
    startListeningAnimation();
    speechRef.current?.startRecognition();
    
    setTimeout(() => {
      const spokenText = speechRef.current?.recognizedText || '';
      setRecognizedText(spokenText);
      stopListeningAnimation();
    }, 3000); // Wait for speech processing
  };

  const handlePOIMatch = (spokenText) => {
    if (pois.length > 0) {
      const bestMatch = findBestMatch(spokenText, pois);
      if (bestMatch) {
        bestMatch.description = bestMatch.description || "";
        console.log('Best Match:', bestMatch);
        setMatchedPOI(bestMatch);

        // Transition effect to MapScreen
        setTimeout(() => {
          navigation.navigate('MapScreen', { poi: bestMatch });
        }, 1000);
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
        score += 2;
      }
      
      if (lowerPOIName.startsWith(lowerSpoken) || lowerSpoken.startsWith(lowerPOIName)) {
        score += 1;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = poi;
      }
    });

    console.log('Final selected POI:', bestMatch || null);
    return bestMatch || null;
  };

  return (
    <LinearGradient colors={['#1E1E2D', '#252542']} style={styles.container}>
      <SpeechToText ref={speechRef} />

      {/* Circular Button with Animation */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View 
          style={[
            styles.speakButton,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Animated.View 
            style={[
              styles.waveEffect,
              {
                opacity: waveAnim,
                transform: [{ scale: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }]
              }
            ]}
          />
          <Text style={styles.buttonText}>{isListening ? 'Listening...' : 'Speak'}</Text>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.resultText}>Recognized: {recognizedText}</Text>
      {matchedPOI && (
        <Text style={styles.resultText}>Matched POI: {matchedPOI.name}</Text>
      )}
    </LinearGradient>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B6B', // Modern red-pink color
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    position: 'relative',
    zIndex: 2,
    elevation: 5, // Shadow effect for Android
    shadowColor: '#FF6B6B', // Shadow for iOS
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  waveEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 107, 107, 0.4)',
    zIndex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    zIndex: 3,
  },
  resultText: {
    color: '#FFF',
    fontSize: 20,
    marginTop: 20,
    textAlign: 'center',
  },
});