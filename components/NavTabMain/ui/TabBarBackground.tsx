// This is a shim for web and Android where the tab bar is generally opaque.
// export default undefined;

// export function useBottomTabOverflow() {
//   return 0;
// }

import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function TabBarBackground() {
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }]}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}

// export function useBottomTabOverflow() {
//   const { bottom } = useSafeAreaInsets();
//   // Ensure this returns an appropriate value for your tab height
//   return 49 - bottom; // Standard tab bar height is usually 49
// }

// import { View, StyleSheet } from 'react-native';

// export default function TabBarBackground() {
//   return (
//     <View
//       style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }]}
//     />
//   );
// }
