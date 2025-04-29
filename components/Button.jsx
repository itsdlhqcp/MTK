import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import theme from '@/constants/theme';
import { hp } from '@/helpers/common';
import {
  BallIndicator,
  BarIndicator,
  DotIndicator,
  MaterialIndicator,
  PacmanIndicator,
  PulseIndicator,
  SkypeIndicator,
  UIActivityIndicator,
  WaveIndicator,
} from 'react-native-indicators';

const Button = ({
  buttonStyle,
  textStyle,
  title = '',
  onPress = () => {},
  loading = false,
  loaderType,
  hasShadow = true,
}) => {
  const shadowStyle = {
    shadowColor: theme.colors.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  };

  // Map loader types to components
  const loaderComponents = {
    BallIndicator,
    BarIndicator,
    DotIndicator,
    MaterialIndicator,
    PacmanIndicator,
    PulseIndicator,
    SkypeIndicator,
    UIActivityIndicator,
    WaveIndicator
  };

  // Default to BarIndicator if loaderType is invalid
  const LoaderComponent = loaderComponents[loaderType] || BarIndicator;

  return (
    <Pressable
      onPress={loading ? null : onPress}
      style={[styles.button, buttonStyle, hasShadow && shadowStyle]}
    >
      {loading ? (
        <View style={styles.loaderContainer}>
          <LoaderComponent color="white" size={hp(3)} />
        </View>
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    height: hp(6.4),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.xl,
  },
  text: {
    fontSize: hp(2.5),
    color: 'white',
    fontWeight: theme.fonts.bold,
  },
  loaderContainer: {
    height: hp(4),
    justifyContent: 'center',
    alignItems: 'center',
  }
});