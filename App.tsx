import React from 'react';
import { NavigationContainer, StackRouter } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/Start';
import MapScreen from './src/screens/MapScreen';
import OpenCamera from './src/objDetection/OpenCamera';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="OpenCamera" component={OpenCamera} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}