// import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
// import React from 'react'
// import theme from '../constants/theme'

// const Loading = ({size="large", color=theme.colors.primary}) => {
//   return (
//     <View style={{justifyContent: 'center', alignItems: 'center'}}>
//       <ActivityIndicator size={size} color={color} />
//     </View>
//   )
// }

// export default Loading

// const styles = StyleSheet.create({})


import { View, StyleSheet } from 'react-native';
import React from 'react';
import { DotIndicator } from 'react-native-indicators'; // Import DotIndicator from react-native-indicators
import theme from '../constants/theme';

const Loading = ({ size = "large", color = theme.colors.primary }) => {
  return (
    <View style={styles.container}>
      <DotIndicator size={size === "large" ? 12 : 8} color={color} /> {/* Dotted round loader */}
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
