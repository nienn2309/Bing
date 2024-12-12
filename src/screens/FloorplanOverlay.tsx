import React, { useEffect } from 'react';
import MapView, { Overlay } from 'react-native-maps';

// Image path
const FloorplanImage = require('../images/floorplan.jpg');

// Center coordinates of the building
const FLOORPLAN_CENTER = {
  latitude: 21.043872057346032,
  longitude: 105.91723186401022,
};

// Deltas to determine the size of the overlay rectangle
const FLOORPLAN_DELTA = {
  latitudeDelta: 0.00015, 
  longitudeDelta: 0.00035, 
};

// Floorplan rotation in degrees clockwise
const FLOORPLAN_ROTATION = -25; 

// Calculate bounds dynamically based on the center and deltas
const FLOORPLAN_BOUNDS = {
  southWest: {
    latitude: FLOORPLAN_CENTER.latitude - FLOORPLAN_DELTA.latitudeDelta / 2,
    longitude: FLOORPLAN_CENTER.longitude - FLOORPLAN_DELTA.longitudeDelta / 2,
  },
  northEast: {
    latitude: FLOORPLAN_CENTER.latitude + FLOORPLAN_DELTA.latitudeDelta / 2,
    longitude: FLOORPLAN_CENTER.longitude + FLOORPLAN_DELTA.longitudeDelta / 2,
  },
};

interface FloorplanOverlayProps {
  currentRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export const FloorplanOverlay: React.FC<FloorplanOverlayProps> = ({ currentRegion }) => {
  useEffect(() => {
    console.log('Current Region:', currentRegion);
    console.log('Floorplan Bounds:', FLOORPLAN_BOUNDS);
    console.log('Floorplan Rotation:', FLOORPLAN_ROTATION);
  }, [currentRegion]);

  return (
    <Overlay
      image={FloorplanImage} // Provide the image for the overlay
      bounds={[
        [FLOORPLAN_BOUNDS.southWest.latitude, FLOORPLAN_BOUNDS.southWest.longitude],
        [FLOORPLAN_BOUNDS.northEast.latitude, FLOORPLAN_BOUNDS.northEast.longitude],
      ]}
      opacity={1.0} // Set opacity as needed
      bearing={FLOORPLAN_ROTATION} // Rotation in degrees clockwise
    />
  );
};
