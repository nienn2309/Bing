// src/components/ObjectDetectionView.tsx

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import TextToSpeechService from '../services/TextToSpeech';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ObjectDetection({ onObstacleChange }) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef(null);
  const ws = useRef(null);
  const [detections, setDetections] = useState([]);
  const tts = TextToSpeechService.getInstance();
  const [obstacleDetected, setObstacleDetected] = useState(false);
  const obstacleTimeout = useRef(null);

  const centerRegion = {
    left: screenWidth * 0.4,
    top: screenHeight * 0.4,
    right: screenWidth * 0.6,
    bottom: screenHeight * 0.6,
  };

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  useEffect(() => {
    ws.current = new WebSocket('ws://192.168.55.111:8000/detect-websocket');

    ws.current.onopen = () => console.log('WebSocket connected');
    ws.current.onmessage = (e) => {
      try {
        const json = JSON.parse(e.data);
        setDetections(json.detections || []);
      } catch (err) {
        console.error('Failed to parse detection JSON:', err);
      }
    };
    ws.current.onerror = (e) => console.error(e.message);
    ws.current.onclose = () => console.log('WebSocket closed');

    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(captureAndSend, 100);
    return () => clearInterval(intervalId);
  }, []);

  const captureAndSend = async () => {
    if (cameraRef.current && ws.current.readyState === WebSocket.OPEN) {
      const photo = await cameraRef.current.takePhoto({ quality: 50, skipMetadata: true });
      const response = await fetch(`file://${photo.path}`);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        ws.current.send(base64data);
      };
      reader.readAsDataURL(blob);
    }
  };

  useEffect(() => {
    let obstacleInCenter = false;

    detections.forEach((d) => {
      const [x1, y1, x2, y2] = d.bounding_box;
      const left = x1 * screenWidth;
      const top = y1 * screenHeight;
      const right = x2 * screenWidth;
      const bottom = y2 * screenHeight;

      if (
        left < centerRegion.right &&
        right > centerRegion.left &&
        top < centerRegion.bottom &&
        bottom > centerRegion.top
      ) {
        obstacleInCenter = true;
      }
    });

    if (obstacleInCenter) {
      if (!obstacleDetected) {
        setObstacleDetected(true);
        onObstacleChange?.(true);
        tts.stop();
        tts.speak('Obstacle detected on the road. Please wait');
        if (obstacleTimeout.current) {
          clearTimeout(obstacleTimeout.current);
          obstacleTimeout.current = null;
        }
      }
    } else {
      if (obstacleDetected && !obstacleTimeout.current) {
        obstacleTimeout.current = setTimeout(() => {
          setObstacleDetected(false);
          onObstacleChange?.(false);
          tts.stop();
          tts.speak('You can continue to go now', true);
        }, 5000);
      }
    }
  }, [detections]);

  if (!hasPermission || !device) return null;

  return (
    <View style={styles.cameraWrapper}>
      <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={true} photo={true} />
      {detections.map((d, i) => {
        const [x1, y1, x2, y2] = d.bounding_box;
        const left = x1 * screenWidth;
        const top = y1 * screenHeight;
        const boxWidth = (x2 - x1) * screenWidth;
        const boxHeight = (y2 - y1) * screenHeight;

        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              width: boxWidth,
              height: boxHeight,
              borderColor: 'lime',
              borderWidth: 2,
            }}
          >
            <Text style={{ color: 'white', backgroundColor: 'black', fontSize: 10 }}>
              {d.class_name} ({Math.round(d.confidence * 100)}%)
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cameraWrapper: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    width: 160,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'white',
    zIndex: 10,
  },
});