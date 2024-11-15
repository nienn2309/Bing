import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';

interface POI {
  coordinates_lat: string;
  coordinates_lon: string;
  description: string;
  floor_name: string;
  floor_number: string;
  image: string;
  is_building_entrance: string;
  is_door: string;
  is_published: string;
  name: string;
  pois_type: string;
  puid: string;
}

const MapScreen = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  
  const CURRENT_LOCATION = {
    latitude: 21.043941,
    longitude: 105.917325,
  };

  useEffect(() => {
    const fetchPOIs = async () => {
      try {
        const response = await fetch(
          'https://ap.cs.ucy.ac.cy:44/api/mapping/pois/floor/all',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              buid: 'building_678938f8-3452-4e9e-95e7-7f356ee8931c_1731591381115',
              floor_number: '0',
            }),
          },
        );
        const data = await response.json();
        if (data.pois && Array.isArray(data.pois)) {
          setPois(data.pois);
        } else {
          console.error('Invalid POIs data format:', data);
        }
      } catch (error) {
        console.error('Error fetching POIs:', error);
        Alert.alert('Error', 'Failed to load POIs');
      }
    };

    fetchPOIs();
  }, []);

  const getFastestRoute = async (poi: POI) => {
    try {
      const response = await axios.post(
        'https://ap.cs.ucy.ac.cy:44/api/navigation/route/coordinates',
        {
          coordinates_lon: CURRENT_LOCATION.longitude.toString(),
          coordinates_lat: CURRENT_LOCATION.latitude.toString(),
          floor_number: poi.floor_number,
          pois_to: poi.puid,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data && response.data.pois) {
        const routeCoords = response.data.pois.map((point: any) => ({
          latitude: parseFloat(point.lat),
          longitude: parseFloat(point.lon),
        }));

        const fullRoute = [
          CURRENT_LOCATION,
          ...routeCoords,
        ];

        setRouteCoordinates(fullRoute);
      } else {
        console.error('Invalid route data format:', response.data);
        Alert.alert('Error', 'Failed to get route data');
      }
    } catch (error) {
      console.error('Error getting route:', error);
      Alert.alert('Error', 'Failed to calculate route');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: CURRENT_LOCATION.latitude,
          longitude: CURRENT_LOCATION.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }}
      >

        <Marker
          coordinate={CURRENT_LOCATION}
          pinColor="blue"
          title="Current Location"
        />

        {pois.map((poi, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: parseFloat(poi.coordinates_lat),
              longitude: parseFloat(poi.coordinates_lon),
            }}
            onPress={() => getFastestRoute(poi)}
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
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapScreen;