import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const lightGreenColor = 'rgb(230, 241, 230)'; // Light green with transparency

  return (
    <PlatformPressable
      {...props}
      style={[
        props.style,
        isPressed && { backgroundColor: lightGreenColor }
      ]}
      onPressIn={(ev) => {
        setIsPressed(true);
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        props.onPressIn?.(ev);
      }}
      onPressOut={(ev) => {
        setIsPressed(false);
        props.onPressOut?.(ev);
      }}
    />
  );
}