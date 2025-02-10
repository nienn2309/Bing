import axios from 'axios';
import { POI, LocationState, RouteCoordinate } from '../Type';
import { Alert } from 'react-native';

const API_BASE_URL = 'https://ap.cs.ucy.ac.cy:44/api';

export const fetchPOIs = async (): Promise<POI[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/mapping/pois/floor/all`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buid: 'building_7bf70569-257e-412d-a4be-9d1d85296a14_1731512504566',
          floor_number: '0',
        }),
      },
    );
    const data = await response.json();
    if (data.pois && Array.isArray(data.pois)) {
      console.log('POIs API response:', data);
      return data.pois;
    }
    throw new Error('Invalid POIs data format');
  } catch (error) {
    console.error('Error fetching POIs:', error);
    Alert.alert('Error', 'Failed to load POIs');
    return [];
  }
};

export const getFastestRoute = async (
  location: LocationState,
  poi: POI
): Promise<RouteCoordinate[]> => {
  try {
    // Append a timestamp to avoid potential caching issues
    const response = await axios.post(
      `${API_BASE_URL}/navigation/route/coordinates?nocache=${Date.now()}`,
      {
        coordinates_lon: location.longitude.toString(),
        coordinates_lat: location.latitude.toString(),
        floor_number: poi.floor_number,
        pois_to: poi.puid,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    
    console.log('Route API raw response:', response.data);
    
    if (response.data && response.data.pois) {
      const routeCoords = response.data.pois.map((point: any) => ({
        latitude: parseFloat(point.lat),
        longitude: parseFloat(point.lon),
      }));

      // Prepend the current location to the route if needed
      return [
        location,
        ...routeCoords,
      ];
    }
    throw new Error('Invalid route data format');
  } catch (error) {
    console.error('Error getting route:', error);
    Alert.alert('Error', 'Failed to calculate route');
    return [];
  }
};
