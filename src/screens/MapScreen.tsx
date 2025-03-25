import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { POI, RouteCoordinate } from '../Type';
import { styles } from '../styles';
import { useLocation } from '../hooks/useLocation';
import { fetchPOIs, getFastestRoute } from '../services/api';
import { FloorplanOverlay } from './FloorplanOverlay';
import { NavigationInstruction, NavigationGuide } from '../services/NavigationGuide';
import TextToSpeechService from '../services/TextToSpeech';
import Svg, { Ellipse } from 'react-native-svg';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import OpenCamera from '../objDetection/OpenCamera';

function MapScreen ({ route, navigation }) {
  const { poi } = route.params || {};
  const [pois, setPois] = useState<POI[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const { location, isLocationUpdated, setLocation, setIsLocationUpdated } = useLocation();
  const [currentSegment, setCurrentSegment] = useState(0);
  const [navigationInstruction, setNavigationInstruction] = useState<NavigationInstruction | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const mapRef = useRef(null); 
  const lastInstructionRef = useRef<string>('');

  useEffect(() => {
    if (isLocationUpdated && location && mapRef.current) {
      console.log("📍 Auto-centering to:", location);
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0015,
        longitudeDelta: 0.0015,
      });
    }
  }, [location, isLocationUpdated]); // ✅ Triggers whenever location updates

  useEffect(() => {
    const tts = TextToSpeechService.getInstance();
    tts.initialize();

    // Set timeout to navigate to camera after 5 seconds
    // const cameraTimeout = setTimeout(() => {
    //   navigation.navigate('OpenCamera');
    // }, 5000);

    // // Cleanup function to clear timeout
    // return () => {
    //   tts.cleanup();
    //   clearTimeout(cameraTimeout);
    // };
  }, []);

  useEffect(() => {
    const loadPOIs = async () => {
      const poisData = await fetchPOIs();
      setPois(poisData);
    };
    loadPOIs();
  }, []);

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
        lastInstructionRef.current = instruction.message; // ✅ Store last spoken message
      }
      
      setNavigationInstruction(instruction);
    }
  }, [location, routeCoordinates, isLocationUpdated]);   

  useEffect(() => {
    if (isLocationUpdated && location && poi) {
      handleGetRoute(poi);
    }
  }, [location, poi]); // Removed isLocationUpdated to prevent blocking updates  

  const handleGetRoute = async (poi: POI) => {
    const route = await getFastestRoute(location, poi);
    setRouteCoordinates(route);
    TextToSpeechService.getInstance().speak(`Route to ${poi.name} calculated. Starting navigation.`, true);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        ref={mapRef} // ✅ Assign the reference to the MapView
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        followsUserLocation={true}
        showsCompass={true}
        userLocationAnnotationTitle="You are here"
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
        
        {/* {isLocationUpdated && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            rotation={location.heading}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userHeadingMarker}>
              <Svg height={20} width={20}>
                <Ellipse cx="10" cy="10" rx="10" ry="10" fill="red" stroke="#fff" strokeWidth="2" />
              </Svg>
            </View>
          </Marker>
        )} */}

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
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }} 
        />
      </MapView>

      {navigationInstruction && (
        <View style={[styles.instructionContainer]}>
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