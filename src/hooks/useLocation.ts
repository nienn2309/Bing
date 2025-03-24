import { useState, useEffect } from 'react';
import { PermissionsAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { LocationState } from '../Type';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLocationUpdated, setIsLocationUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocationPermission = async () => {
    try {
      console.log("🔍 Requesting location permissions...");
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      ]);

      if (granted["android.permission.ACCESS_FINE_LOCATION"] === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("✅ Location permission granted");
        setHasLocationPermission(true);
        setIsLocationUpdated(true);
        startContinuousLocationUpdates(); // Start fetching location continuously
      } else {
        console.log("❌ Location permission denied");
        setErrorMessage("Location permission denied. Please enable it in settings.");
        Alert.alert("Permission Denied", "Location permission denied. Please enable it in settings.");
      }
    } catch (err) {
      console.log("⚠️ Error requesting location permission:", err);
      setErrorMessage("Error requesting location permissions.");
      Alert.alert("Error", "Error requesting location permissions.");
    }
  };

  const getLocation = () => {
    console.log("📍 Getting current position...");
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords;

        console.log(`📌 Updated location: ${latitude}, ${longitude}, heading: ${heading}`);
        setLocation({
          latitude,
          longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
          heading: heading || 0,
        });
        setIsLocationUpdated(true);
      },
      (error) => {
        console.log(`⚠️ Error getting position: ${error.code} - ${error.message}`);
        setErrorMessage("Unable to get location. Ensure GPS is enabled.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  };

  const startContinuousLocationUpdates = () => {
    // Fetch location every 5 seconds
    getLocation();
    const intervalId = setInterval(getLocation, 5000); 

    console.log("🔄 Setting up location watch...");
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords;
        setLocation({
          latitude,
          longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
          heading: heading || 0,
        });
        setIsLocationUpdated(true);
      },
      (error) => {
        console.log(`⚠️ Error watching position: ${error.code} - ${error.message}`);
      },
      { enableHighAccuracy: false, distanceFilter: 1 }
    );

    return () => {
      clearInterval(intervalId);
      Geolocation.clearWatch(watchId);
    };
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  return { 
    location: location ?? { 
      latitude: 0, 
      longitude: 0, 
      latitudeDelta: 0.001, 
      longitudeDelta: 0.001, 
      heading: 0 
    }, isLocationUpdated, errorMessage 
  };
};
