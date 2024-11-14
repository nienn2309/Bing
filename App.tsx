import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AzureMap, AzureMarker } from 'react-native-azure-map';

const App = () => {
  const apiKey = "1cHyVP1rgiLssWS8u9dLTS5bnUE54BXuA0HahDkQORQEWT4yEXOzJQQJ99AKACYeBjFmWKYdAAAgAZMPfO0M";

  return (
    <View style={styles.container}>
      <AzureMap
        apiKey={apiKey}
        latitude={34.46667}
        longitude={31.5}
        zoom={10}
        style={styles.map}
      >
      </AzureMap>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default App;
