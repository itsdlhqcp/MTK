import { View, StyleSheet } from 'react-native';
import React from 'react';
import { BallIndicator, BarIndicator, DotIndicator, SkypeIndicator } from 'react-native-indicators'; // Import DotIndicator from react-native-indicators
import theme from '../constants/theme';

const DotLoader = ({ size = "large", color = "#FFA500" }) => {
  return (
    <View style={styles.container}>
      <SkypeIndicator  size={size === "small" ? 18 : 26} color={color} /> 
    </View>
  );
};

export default DotLoader;

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
});