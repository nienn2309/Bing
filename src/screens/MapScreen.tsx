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

  // Fetch POIs on mount
  useEffect(() => {
    const loadPOIs = async () => {
      const poisData = await fetchPOIs();
      console.log('Fetched POIs:', poisData);
      setPois(poisData);
    };
    loadPOIs();
  }, []);

  // Calculate navigation instructions whenever the location or route changes
  useEffect(() => {
    if (routeCoordinates.length > 0) {
      // Calculate current segment based on user progress along the route
      const newSegment = NavigationGuide.getUserProgress({
        location: location,
        route: routeCoordinates,
      });
      console.log('Calculated current segment:', newSegment);
      setCurrentSegment(newSegment);
  
      // Get the next navigation instruction based on new segment
      const instruction = NavigationGuide.getNextInstruction({
        location: location,
        route: routeCoordinates,
        currentSegment: newSegment,
      });
      console.log('Navigation instruction:', instruction);
      setNavigationInstruction(instruction);
      
      // Calculate and set distance to next point if applicable
      if (newSegment < routeCoordinates.length - 1) {
        const nextPoint = routeCoordinates[newSegment + 1];
        const distanceToNext = NavigationGuide.calculateDistance({
          location: location,
          destination: nextPoint,
        });
        console.log('Distance to next point:', distanceToNext);
        setDistance(distanceToNext);
      }
    }
  }, [location, routeCoordinates]);

  // Reset navigation state when a new route is selected and fetch route
  const handleGetRoute = async (poi: POI) => {
    console.log(`Fetching route for POI: ${poi.name} (puid: ${poi.puid})`);
    // Reset the navigation state so stale values don't carry over.
    setCurrentSegment(0);
    setNavigationInstruction(null);
    setDistance(null);
    setRouteCoordinates([]); // Clear previous route coordinates

    const route = await getFastestRoute(location, poi);
    console.log('New route coordinates:', route);
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
