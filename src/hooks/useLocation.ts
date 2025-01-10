import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, NativeEventEmitter, NativeModules } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { LocationState } from '../Type';
import CompassHeading from 'react-native-compass-heading';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationState>({
    latitude: 21.043869,
    longitude: 105.91725,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
    heading: 0,
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
        const { latitude, longitude, heading } = position.coords;
        setLocation(prevLocation => ({
          ...prevLocation,
          latitude,
          longitude,
          heading: heading || prevLocation.heading,
        }));
      },
      () => console.log('Location permission denied'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  useEffect(() => {
    requestLocationPermission();
    
    // Watch position changes
    const watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude, heading } = position.coords;
        setLocation(prevLocation => ({
          ...prevLocation,
          latitude,
          longitude,
          heading: heading || prevLocation.heading,
        }));
      },
      () => console.log('Location permission denied'),
      { enableHighAccuracy: true, distanceFilter: 10 },
    );

    // Set up compass heading updates: Update every 3 degrees of rotation 
    const degree_update_rate = 5;

    // Start compass updates
    CompassHeading.start(degree_update_rate, ({ heading }: { heading: number }) => {
      setLocation(prevLocation => ({
        ...prevLocation,
        heading,
      }));
    });

    // Cleanup
    return () => {
      Geolocation.clearWatch(watchId);
      CompassHeading.stop();
    };
  }, []);

  return location;
};