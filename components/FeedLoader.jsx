import { View, StyleSheet } from 'react-native';
import React from 'react';
import { BallIndicator, BarIndicator, DotIndicator, SkypeIndicator, WaveIndicator } from 'react-native-indicators'; // Import DotIndicator from react-native-indicators
import theme from '../constants/theme';

const FeedLoader = ({ size = "large", color = "#FFA500" }) => {
  return (
    <View style={styles.container}>
      <BallIndicator size={size === "small" ? 18 : 32} color={color} /> 
    </View>
  );
};

export default FeedLoader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
});