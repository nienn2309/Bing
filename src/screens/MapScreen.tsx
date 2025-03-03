import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { POI, RouteCoordinate } from '../Type';
import { styles } from '../styles';
import { useLocation } from '../hooks/useLocation';
import { fetchPOIs, getFastestRoute } from '../services/api';
import { FloorplanOverlay } from './FloorplanOverlay';
import { NavigationInstruction, NavigationGuide } from '../services/NavigationGuide';
import TextToSpeechService from '../services/TextToSpeech';
import Svg, { Ellipse } from 'react-native-svg';
//import BLEScanner from '../BLE';

const MapScreen = ({ route }) => {
  const { poi } = route.params || {}; // Get POI from navigation
  const [pois, setPois] = useState<POI[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const location = useLocation();
  const [currentSegment, setCurrentSegment] = useState(0);
  const [navigationInstruction, setNavigationInstruction] = useState<NavigationInstruction | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const tts = TextToSpeechService.getInstance();
    tts.initialize();
    return () => tts.cleanup();
  }, []);

  useEffect(() => {
    const loadPOIs = async () => {
      const poisData = await fetchPOIs();
      setPois(poisData);
    };
    loadPOIs();

    if (location && routeCoordinates.length > 0) {
      const newSegment = NavigationGuide.getUserProgress({ location, route: routeCoordinates });
      setCurrentSegment(newSegment);
      
      const instruction = NavigationGuide.getNextInstruction({ location, route: routeCoordinates, currentSegment: newSegment });
      setNavigationInstruction(instruction);
      
      if (instruction) {
        TextToSpeechService.getInstance().speak(instruction.message);
      }
      
      if (newSegment < routeCoordinates.length - 1) {
        const nextPoint = routeCoordinates[newSegment + 1];
        const distanceToNext = NavigationGuide.calculatePointDistance(location, nextPoint);
        setDistance(distanceToNext);
      } else {
        setDistance(null);
        setNavigationInstruction(null);
      }
    }
  }, [location, routeCoordinates]);

  useEffect(() => {
    if (location && poi) {
      handleGetRoute(poi);
    }
  }, [location, poi]);

  const handleGetRoute = async (poi: POI) => {
    const route = await getFastestRoute(location, poi);
    setRouteCoordinates(route);
    TextToSpeechService.getInstance().speak(`Route to ${poi.name} calculated. Starting navigation.`, true);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsCompass={true}
        userLocationAnnotationTitle="You are here"
        followsUserLocation={true}
        initialRegion={{
          latitude: poi ? parseFloat(poi.coordinates_lat) : location.latitude,
          longitude: poi ? parseFloat(poi.coordinates_lon) : location.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }}>
        
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          rotation={location.heading}
          anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.userHeadingMarker}>
            <Svg height={20} width={20}>
              <Ellipse cx="10" cy="10" rx="10" ry="10" fill="blue" stroke="#fff" strokeWidth="2" />
            </Svg>
          </View>
        </Marker>

        {pois
          .filter(poi => poi.description !== 'Connector')
          .map((poi, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: parseFloat(poi.coordinates_lat),
                longitude: parseFloat(poi.coordinates_lon),
              }}
              onPress={() => handleGetRoute(poi)}>
              <View style={styles.markerContainer}>
                <Text style={styles.markerText}>{poi.name}</Text>
              </View>
            </Marker>
          ))}
        
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
