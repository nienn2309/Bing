import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import ObjectDetection from './src/objDetection/OpenCamera';
import GestureRecognizer from 'react-native-swipe-gestures';
import { useRoute } from '@react-navigation/native';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MapScreen" component={MapWithSwipe} />
        <Stack.Screen name="ObjectDetection" component={ObjectDetectionWithSwipe} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MapWithSwipe({ navigation, route }) {
  const routeParams = useRoute()?.params || {}; // ✅ Fix: Ensures params are safely accessed

  return (
    <GestureRecognizer
      onSwipeLeft={() => navigation.navigate('ObjectDetection')}
      style={{ flex: 1 }}
    >
      <MapScreen navigation={navigation} route={{ params: routeParams }} />
    </GestureRecognizer>
  );
}

function ObjectDetectionWithSwipe({ navigation }) {
  return (
    <GestureRecognizer
      onSwipeLeft={() => navigation.navigate('MapScreen')}
      style={{ flex: 1 }}
    >
      <ObjectDetection navigation={navigation} />
    </GestureRecognizer>
  );
}
