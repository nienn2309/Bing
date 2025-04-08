import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headingContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  headingText: {
    color: '#fff',
    fontSize: 16,
  },
  // userHeadingMarker: {
  //   width: 0,
  //   height: 0,
  //   backgroundColor: 'transparent',
  //   borderStyle: 'solid',
  //   borderLeftWidth: 20,
  //   borderRightWidth: 20,
  //   borderBottomWidth: 20,
  //   borderLeftColor: 'transparent',
  //   borderRightColor: 'transparent',
  //   borderBottomColor: '#2C7FDE',
  //   transform: [{rotate: '0deg'}]
  // },
  instructionContainer: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: '#89CFF0', // Baby blue
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    flexDirection: 'row', // Align arrow and text horizontally
    alignItems: 'center', // Center vertically
    justifyContent: 'space-between', // Space out arrow and text
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left', // Changed from center to align with arrow
    color: '#1A3C5A',
    letterSpacing: 0.5,
    flex: 1, // Allow text to take remaining space
    marginRight: 10, // Space between text and arrow
  },
  directionArrow: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningOverlay: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    zIndex: 1000,
  },
  warningText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },  
  distanceContainer: {
    position: 'absolute',
    bottom: 15, // Moved closer to bottom edge
    left: 15, // Moved closer to left edge
    right: 15, // Ensures it stretches but stays edged
    backgroundColor: '#89CFF0', // Baby blue background
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6, // Slightly less than instruction for hierarchy
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)', // Subtle white border
    // Adding a slight gradient effect (optional)
    // background: 'linear-gradient(135deg, #89CFF0, #A1D6E2)',
  },
  distanceText: {
    fontSize: 16,
    color: '#1A3C5A', // Darker blue-gray for contrast
    fontWeight: '500', // Medium bold for clarity
    textAlign: 'center',
    letterSpacing: 0.3, // Slight spacing for modern feel
  },
  headingIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // New style for bearing information
  bearingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },

  markerContainer: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 5,
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  markerText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});