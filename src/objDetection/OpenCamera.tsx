import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

function OpenCamera({  }) {
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  
  const device = useCameraDevice('back'); // Might return undefined if no back camera exists

  useEffect(() => {
    const requestPermissions = async () => {
      await requestCameraPermission();
      await requestMicrophonePermission();
      setPermissionsChecked(true);
    };

    if (!hasCameraPermission || !hasMicrophonePermission) {
      requestPermissions();
    } else {
      setPermissionsChecked(true);
    }
  }, [hasCameraPermission, hasMicrophonePermission]);

  if (!permissionsChecked) {
    return (
      <View style={styles.container}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <View style={styles.container}>
        <Text>Camera & Microphone permissions are required.</Text>
        <Button
          title="Grant Permissions"
          onPress={async () => {
            await requestCameraPermission();
            await requestMicrophonePermission();
            setPermissionsChecked(true);
          }}
        />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>No Camera Device Found</Text>
      </View>
    );
  }

  return (
    <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OpenCamera;
