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
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.ease),
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
    }, 3000);
  };

  const handlePOIMatch = (spokenText) => {
    if (pois.length > 0) {
      const bestMatch = findBestMatch(spokenText, pois);
      if (bestMatch) {
        bestMatch.description = bestMatch.description || "";
        console.log('Best Match:', bestMatch);
        setMatchedPOI(bestMatch);
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
    <LinearGradient 
      colors={['#1A1A2E', '#16213E', '#0F3460']} // Modern gradient with depth
      style={styles.container}
    >
      <SpeechToText ref={speechRef} />

      {/* Header Text */}
      <Text style={styles.headerText}>Explore with Your Voice</Text>

      {/* Glassmorphism Button */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
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
                transform: [{ scale: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }]
              }
            ]}
          />
          <Text style={styles.buttonText}>
            {isListening ? 'Listening...' : 'Tap to Speak'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Result Display */}
      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>
          {recognizedText ? `Heard: "${recognizedText}"` : 'Say something...'}
        </Text>
        {matchedPOI && (
          <Text style={styles.matchedText}>Found: {matchedPOI.name}</Text>
        )}
      </View>
    </LinearGradient>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'System', // Use a modern sans-serif font if available
  },
  speakButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glassmorphism effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    backdropFilter: 'blur(10px)', // Note: Not natively supported, simulated with transparency
  },
  waveEffect: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(88, 101, 242, 0.3)', // Subtle blue wave
    zIndex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    zIndex: 3,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultText: {
    color: '#E0E0E0',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '400',
  },
  matchedText: {
    color: '#58D68D', // Modern green for success
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
});