// hooks/useLocation.ts
import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { LocationState } from '../Type';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationState>({
    latitude: 21.043869,
    longitude: 105.91725,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  });

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
      getLocation();
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getLocation();
        } else {
          console.log('Location permission denied');
        }
      } catch {
        console.log('Location permission denied');
      }
    }
  };

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation(prevLocation => ({
          ...prevLocation,
          latitude,
          longitude,
        }));
      },
      () => console.log('Location permission denied'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  useEffect(() => {
    requestLocationPermission();
    const watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        
        setLocation(prevLocation => ({
          ...prevLocation,
          latitude,
          longitude,
        }));
      },
      () => console.log('Location permission denied'),
      { enableHighAccuracy: true, distanceFilter: 10 },
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);

  return location;
};