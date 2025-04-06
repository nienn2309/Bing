import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// Create a singleton BLE manager
const bleManager = new BleManager();

// Known beacon positions (you'll need to configure these with your actual beacon locations)
const BEACONS = [
  { id: 'ESP32_BLE_1', latitude: 21.043769, longitude: 105.91715, txPower: -59 }, // Example beacon 1
  { id: 'ESP32_BLE_2', latitude: 21.043969, longitude: 105.91735, txPower: -59 }, // Example beacon 2
  { id: 'ESP32_BLE_3', latitude: 21.043869, longitude: 105.91755, txPower: -59 }, // Example beacon 3
];

export const useBLELocation = () => {
  const [location, setLocation] = useState({
    latitude: 21.043869,
    longitude: 105.91725,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  });
  
  const [beaconDistances, setBeaconDistances] = useState({});

  // Calculate distance based on RSSI
  const calculateDistance = (rssi, txPower) => {
    if (rssi === 0) {
      return -1.0; // If we cannot determine accuracy, return -1
    }
    
    const ratio = rssi * 1.0 / txPower;
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      return (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
    }
  };

  // Perform trilateration to determine position
  const calculatePosition = (distances) => {
    // Need at least 3 beacons for trilateration
    if (Object.keys(distances).length < 3) {
      return null;
    }

    // Simple weighted average approach (a more sophisticated trilateration algorithm would be better)
    let totalLat = 0;
    let totalLon = 0;
    let totalWeight = 0;

    Object.keys(distances).forEach(beaconId => {
      const beacon = BEACONS.find(b => b.id === beaconId);
      if (beacon) {
        // Closer beacons have higher weight
        const distance = distances[beaconId];
        const weight = 1 / (distance * distance);
        
        totalLat += beacon.latitude * weight;
        totalLon += beacon.longitude * weight;
        totalWeight += weight;
      }
    });

    if (totalWeight > 0) {
      return {
        latitude: totalLat / totalWeight,
        longitude: totalLon / totalWeight
      };
    }
    
    return null;
  };

  const requestBLEPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const bluetoothScanPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: 'Bluetooth Scanning Permission',
            message: 'This app needs to scan for Bluetooth devices.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        
        const bluetoothConnectPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: 'Bluetooth Connection Permission',
            message: 'This app needs to connect to Bluetooth devices.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        
        const locationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for BLE scanning.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        return (
          bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
          bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
          locationPermission === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn('Failed to request permissions', err);
        return false;
      }
    } else {
      // iOS permissions will be requested automatically when starting the scan
      return true;
    }
  };

  useEffect(() => {
    const startBLEScanning = async () => {
      const permissionsGranted = await requestBLEPermissions();
      
      if (!permissionsGranted) {
        console.log('BLE permissions not granted');
        return;
      }

      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('BLE scan error:', error);
          return;
        }

        if (device && device.name) {
          // Check if this is one of our beacons
          const beacon = BEACONS.find(b => device.name === b.id);
          
          if (beacon && device.rssi) {
            // Calculate distance based on RSSI
            const distance = calculateDistance(device.rssi, beacon.txPower);
            
            // Update the distances
            setBeaconDistances(prev => ({
              ...prev,
              [beacon.id]: distance
            }));
          }
        }
      });
    };

    startBLEScanning();

    // Clean up the scanner when the component unmounts
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  // Update location whenever beacon distances change
  useEffect(() => {
    const newPosition = calculatePosition(beaconDistances);
    
    if (newPosition) {
      setLocation(prevLocation => ({
        ...prevLocation,
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
      }));
    }
  }, [beaconDistances]);

  return location;
};