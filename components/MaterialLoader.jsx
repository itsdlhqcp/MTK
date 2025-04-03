
import { View, StyleSheet } from 'react-native';
import React from 'react';
import { BarIndicator } from 'react-native-indicators'; // Import DotIndicator from react-native-indicators
import theme from '../constants/theme';

const MLoading = ({ size = "large", color = "#FFA500" }) => {
  return (
    <View style={styles.container}>
      <BarIndicator size={size === "large" ? 38 : 34} color={color} /> {/* Dotted round loader */}
    </View>
  );
};

export default MLoading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
