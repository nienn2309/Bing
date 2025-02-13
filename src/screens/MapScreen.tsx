import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import {POI, RouteCoordinate} from '../Type';
import {styles} from '../styles';
import {useLocation} from '../hooks/useLocation';
import {fetchPOIs, getFastestRoute} from '../services/api';
import {FloorplanOverlay} from './FloorplanOverlay';
import {NavigationInstruction, NavigationGuide} from '../services/NavigationGuide';

const MapScreen = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const location = useLocation(); // Get real-time location and heading
  const [currentSegment, setCurrentSegment] = useState(0);
  const [navigationInstruction, setNavigationInstruction] = useState<NavigationInstruction | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  

  useEffect(() => {
    const loadPOIs = async () => {
      const poisData = await fetchPOIs(); 
      setPois(poisData);
    };
    loadPOIs();
  
    // Only proceed if both location and routeCoordinates are available
    if (location && routeCoordinates.length > 0) {
      // Update current segment based on user's location
      const newSegment = NavigationGuide.getUserProgress({
        location: location,
        route: routeCoordinates
      });
      setCurrentSegment(newSegment);
  
      // Get next instruction using real-time location and heading
      const instruction = NavigationGuide.getNextInstruction({
        location: location,
        route: routeCoordinates,
        currentSegment: newSegment
      });
      setNavigationInstruction(instruction);
      
      // Calculate and set distance to next point
      if (newSegment < routeCoordinates.length - 1) {
        const nextPoint = routeCoordinates[newSegment + 1];
        const distanceToNext = NavigationGuide.calculateDistance({
          location: location,
          destination: nextPoint
        });
        setDistance(distanceToNext);
      } else {
        // Reset distance when route is completed
        setDistance(null);
        setNavigationInstruction(null);
      }
    }
  }, [location, routeCoordinates]); // Dependency on location ensures real-time updates // Dependency on location ensures real-time updates

  const handleGetRoute = async (poi: POI) => {
    const route = await getFastestRoute(location, poi);
    setRouteCoordinates(route);
  };

  const NavigationInstructions: React.FC<{
    instruction: NavigationInstruction | null;
  }> = ({ instruction }) => {
    if (!instruction) return null;
  
    return (
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          {instruction.message}
        </Text>
      </View>
    );
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
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }}>
        
        {/* User location marker with real-time heading indicator */}
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          rotation={location.heading}
          anchor={{x: 0.5, y: 0.5}}
        >
          <View style={styles.userHeadingMarker} /> {/* styles.ts */}
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
              onPress={() => handleGetRoute(poi)}
              title={poi.name}
            />
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
        <NavigationInstructions instruction={navigationInstruction} />   
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