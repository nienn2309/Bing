import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import {POI, RouteCoordinate} from '../Type';
import {styles} from '../styles';
import {useLocation} from '../hooks/useLocation';
import {fetchPOIs, getFastestRoute} from '../services/api';
import {FloorplanOverlay} from './FloorplanOverlay';

const MapScreen = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const location = useLocation();

  useEffect(() => {
    const loadPOIs = async () => {
      const poisData = await fetchPOIs(); 
      setPois(poisData);
    };
    loadPOIs();
  }, []);

  const handleGetRoute = async (poi: POI) => {
    const route = await getFastestRoute(location, poi);
    setRouteCoordinates(route);
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
        
        {/* User location marker with heading indicator */}
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          rotation={location.heading}
          anchor={{x: 0.5, y: 0.5}}
        >
          <View style={styles.userMarker}>
            {/* styles.ts */}
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
    </View>
  );
};

export default MapScreen;