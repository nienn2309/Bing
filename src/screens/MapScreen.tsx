import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Camera } from 'react-native-maps';
import { POI, RouteCoordinate } from '../Type';
import { styles } from '../styles';
import { useLocation } from '../hooks/useLocation';
import { fetchPOIs, getFastestRoute } from '../services/api';
import { FloorplanOverlay } from './FloorplanOverlay';
import { NavigationInstruction, NavigationGuide } from '../services/NavigationGuide';
import TextToSpeechService from '../services/TextToSpeech';
import { useNavigation, useRoute } from '@react-navigation/native';

function MapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { poi } = route?.params || {}; // ✅ Handle undefined params

  const [pois, setPois] = useState<POI[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const { location, isLocationUpdated, setLocation, setIsLocationUpdated } = useLocation();
  const [currentSegment, setCurrentSegment] = useState(0);
  const [navigationInstruction, setNavigationInstruction] = useState<NavigationInstruction | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const mapRef = useRef(null);
  const lastInstructionRef = useRef<string>('');

  // ✅ Auto-center map on location update with camera settings to maintain tilt
  useEffect(() => {
    if (isLocationUpdated && location && mapRef.current) {
      console.log("📍 Auto-centering to:", location);
      
      // Use animateCamera instead of animateToRegion to maintain tilt perspective
      mapRef.current.animateCamera({
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        pitch: 35, // Set a consistent tilted view of 40 degrees (between 30-45)
        heading: location.heading || 0,
        zoom: 20,
        altitude: 300, // Adding altitude for better perspective
      }, { duration: 500 });
    }
  }, [location, isLocationUpdated]);

  // ✅ Initialize Text-to-Speech
  useEffect(() => {
    const tts = TextToSpeechService.getInstance();
    tts.initialize();
  }, []);

  // ✅ Fetch POIs once
  useEffect(() => {
    const loadPOIs = async () => {
      const poisData = await fetchPOIs();
      setPois(poisData);
    };
    loadPOIs();
  }, []);

  // ✅ Update navigation instructions based on progress
  useEffect(() => {
    if (isLocationUpdated && location && routeCoordinates.length > 0) {
      console.log("Using Built-in Location for Navigation:", location);

      const newSegment = NavigationGuide.getUserProgress({
        location,
        route: routeCoordinates
      });

      setCurrentSegment(newSegment);

      const instruction = NavigationGuide.getNextInstruction({
        location,
        route: routeCoordinates,
        currentSegment: newSegment
      });

      if (instruction && instruction.message !== lastInstructionRef.current) {
        TextToSpeechService.getInstance().speak(instruction.message);
        lastInstructionRef.current = instruction.message;
      }

      setNavigationInstruction(instruction);
    }
  }, [location, routeCoordinates, isLocationUpdated]);

  // ✅ Prevent infinite loops when fetching routes
  useEffect(() => {
    if (!poi || !isLocationUpdated || !location) return;
    if (routeCoordinates.length > 0) {
      console.log("✅ Route already exists, skipping re-fetch.");
      return; // 🚀 Prevents re-fetching the same route
    }
    handleGetRoute(poi);
  }, [poi]); // ✅ Now only runs when `poi` changes

  const handleGetRoute = async (poi: POI) => {
    if (!location) {
      console.log("⚠️ Cannot fetch route: Location is undefined.");
      return;
    }
    console.log("🚀 Fetching route to:", poi.name);
    const route = await getFastestRoute(location, poi);
    setRouteCoordinates(route);
    TextToSpeechService.getInstance().speak(`Route to ${poi.name} calculated. Starting navigation.`, true);
  };

  // Initial camera setup with tilted perspective
  const initialCamera: Camera = {
    center: {
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
    },
    pitch: 35, // Setting a 40-degree tilt (between 30-45 degrees)
    heading: location?.heading || 0,
    zoom: 20,
    altitude: 300, // Adding altitude for better perspective
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        followsUserLocation={false} // Changed to false to prevent auto-resets to top-down view
        showsCompass={true}
        userLocationAnnotationTitle="You are here"
        pitchEnabled={true} // Enable pitch control
        rotateEnabled={true} // Enable rotation
        camera={initialCamera} // Use camera prop instead of region for 3D perspective
        onUserLocationChange={(event) => {
          const coordinate = event.nativeEvent.coordinate;
          if (coordinate) {
            const { latitude, longitude, heading } = coordinate;
            console.log("📍 Built-in location updated:", latitude, longitude, heading);

            setLocation({
              latitude,
              longitude,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
              heading: heading || 0,
            });
            setIsLocationUpdated(true);
          }
        }}
      >
        {pois
          .filter(poi => poi.description !== 'Connector')
          .map((poi, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: parseFloat(poi.coordinates_lat),
                longitude: parseFloat(poi.coordinates_lon),
              }}
              onPress={() => {
                if (!isLocationUpdated) {
                  Alert.alert("Location not available", "Retrying location fetch...");
                  return;
                }
                handleGetRoute(poi);
              }}
            >
              <View style={styles.markerContainer}>
                <Text style={styles.markerText}>{poi.name}</Text>
              </View>
            </Marker>
          ))
        }

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#FF0000"
            strokeWidth={3}
            lineDashPattern={[1]}
          />
        )}

        <FloorplanOverlay 
          currentRegion={{
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }} 
        />
      </MapView>

      {navigationInstruction && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>{navigationInstruction.message}</Text>
        </View>   
      )}

      {distance !== null && (
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>
            Distance to next point: {Math.round(distance)} meters
          </Text>
        </View>
      )}
    </View>
  );
};

export default MapScreen;