import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Camera } from 'react-native-maps';
import { POI, RouteCoordinate } from '../Type';
import { styles } from '../styles';
import Svg, { Polygon } from 'react-native-svg';
import { useLocation } from '../hooks/useLocation';
import { fetchPOIs, getFastestRoute } from '../services/api';
import { FloorplanOverlay } from './FloorplanOverlay';
import { NavigationInstruction, NavigationGuide } from '../services/NavigationGuide';
import TextToSpeechService from '../services/TextToSpeech';
import { useNavigation, useRoute } from '@react-navigation/native';
import ObjectDetection from '../objDetection/OpenCamera';

function MapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { poi } = route?.params || {};
  const [obstacleDetected, setObstacleDetected] = useState(false);
  const [pois, setPois] = useState<POI[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const { location, isLocationUpdated, setLocation, setIsLocationUpdated } = useLocation();
  const [currentSegment, setCurrentSegment] = useState(0);
  const [navigationInstruction, setNavigationInstruction] = useState<NavigationInstruction | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const mapRef = useRef(null);
  const lastInstructionRef = useRef<string>('');

  // Auto-center camera when location updates
  useEffect(() => {
    if (isLocationUpdated && location && mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        pitch: 60,
        heading: location.heading || 30,
        zoom: 50,
        altitude: 300,
      }, { duration: 500 });
    }
  }, [location, isLocationUpdated]);

  // Init TTS
  useEffect(() => {
    const tts = TextToSpeechService.getInstance();
    tts.initialize();
  }, []);

  // Load POIs
  useEffect(() => {
    const loadPOIs = async () => {
      const poisData = await fetchPOIs();
      setPois(poisData);
    };
    loadPOIs();
  }, []);

  // Navigation instruction updates
  useEffect(() => {
    if (isLocationUpdated && location && routeCoordinates.length > 0) {
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

      setDistance(instruction.distance);
      setNavigationInstruction(instruction);
    }
  }, [location, routeCoordinates, isLocationUpdated]);

  // Get route once when POI changes
  useEffect(() => {
    if (!poi || !isLocationUpdated || !location) return;
    if (routeCoordinates.length > 0) return;

    handleGetRoute(poi);
  }, [poi]);

  // Simulate user movement along route
  useEffect(() => {
    if (routeCoordinates.length === 0) return;

    console.log("🧭 Starting simulated navigation...");
    let index = 0;

    const intervalId = setInterval(() => {
      if (index >= routeCoordinates.length) {
        clearInterval(intervalId);
        console.log("✅ Finished simulating navigation.");
        return;
      }

      const nextCoord = routeCoordinates[index];
      setLocation({
        latitude: nextCoord.latitude,
        longitude: nextCoord.longitude,
        heading: 0,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      });
      setIsLocationUpdated(true);

      console.log("📍 Simulated location set to:", nextCoord);
      index++;
    }, 4000); // Move every 1 second

    return () => clearInterval(intervalId);
  }, [routeCoordinates]);

  const handleGetRoute = async (poi: POI) => {
    if (!location) return;
    const route = await getFastestRoute(location, poi);
    setRouteCoordinates(route);
    TextToSpeechService.getInstance().speak(`Route to ${poi.name} calculated. Starting navigation.`, true);
  };

  // Function to determine arrow rotation based on instruction
  const getArrowRotation = (instruction: NavigationInstruction, userHeading: number) => {
    if (!instruction || !instruction.requiredBearing) return 0;

    const headingDiff = NavigationGuide.getHeadingDifference(userHeading, instruction.requiredBearing);
    const turnDirection = NavigationGuide.getTurnDirection(headingDiff); // Reuse logic from NavigationGuide

    switch (turnDirection) {
      case 'straight':
        return 0; // Arrow points straight
      case 'right':
        return 90; // Arrow points right
      case 'left':
        return -90; // Arrow points left
      default:
        return 0; // Fallback to straight
    }
  };

  const initialCamera: Camera = {
    center: {
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
    },
    pitch: 50,
    heading: location?.heading || 30,
    zoom: 50,
    altitude: 300,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        followsUserLocation={false}
        showsCompass={true} 
        userLocationAnnotationTitle="You are here"
        pitchEnabled={true}
        rotateEnabled={true}
        camera={initialCamera}
        onUserLocationChange={(event) => {
           // Disabled to avoid override during simulation
             const coordinate = event.nativeEvent.coordinate;
              if (coordinate) {
               const { latitude, longitude, heading } = coordinate;
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

        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Simulated Location"
            pinColor="blue"
          />
        )} 

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
          {navigationInstruction.requiredBearing !== undefined && (
            <View style={styles.directionArrow}>
              <Svg height="30" width="30">
                <Polygon
                  points="15,5 25,25 15,20 5,25" // Upward arrow
                  fill="#1A3C5A"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  rotation={getArrowRotation(navigationInstruction, location.heading)} // Relative rotation
                  origin="15,15" // Center of rotation
                />
              </Svg>
            </View>
          )}
        </View>
      )}

      {distance !== null && (
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>
            Distance to next point: {Math.round(distance)} meters
          </Text>
        </View>
      )}
      {obstacleDetected && (
        <View style={styles.warningOverlay}>
          <Text style={styles.warningText}>Please stop for now...</Text>
        </View>
      )}

      <ObjectDetection onObstacleChange={setObstacleDetected}/>
    </View>
  );
}

export default MapScreen;