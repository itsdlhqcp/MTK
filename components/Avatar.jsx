// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import { hp } from '../helpers/common' 
// import  theme  from '../constants/theme'
// import { Image } from 'expo-image'
// import { getImageSrc } from '../services/imageService'

// const Avatar = ({
//     uri, 
//     size=hp(4.5), 
//     rounded=theme.radius.md,
//     style
// }) => {
//   return (
//     <Image
//     source={getImageSrc(uri)}
//     transition={100}
//     style={[styles.avatar, {height: size, width: size, borderRadius: rounded}, style]}
//     />
//   )
// }

// export default Avatar

// const styles = StyleSheet.create({
//     avatar: {
//         borderCurve: 'continuous', 
//         borderColor: theme.colors.text, 
//         borderWidth: 1
//     }
// })

import { StyleSheet, Text, View, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { hp } from '../helpers/common';
import theme from '../constants/theme';
import { Image } from 'expo-image';
import { getImageSrc } from '../services/imageService';

// Custom Fire Emoji Component with Animation
const AnimatedFireEmoji = ({ size }) => {
  // Create animated values for the sparks
  const spark1Opacity = useRef(new Animated.Value(0)).current;
  const spark1Position = useRef(new Animated.Value(0)).current;
  const spark2Opacity = useRef(new Animated.Value(0)).current;
  const spark2Position = useRef(new Animated.Value(0)).current;
  const spark3Opacity = useRef(new Animated.Value(0)).current;
  const spark3Position = useRef(new Animated.Value(0)).current;

  // Animation function
  const animateSparks = () => {
    // Reset values
    spark1Opacity.setValue(0);
    spark1Position.setValue(0);
    spark2Opacity.setValue(0);
    spark2Position.setValue(0);
    spark3Opacity.setValue(0);
    spark3Position.setValue(0);

    // Create animation sequence
    Animated.stagger(150, [
      // Spark 1 animation
      Animated.parallel([
        Animated.timing(spark1Opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(spark1Position, {
            toValue: -size/2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(spark1Opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Spark 2 animation
      Animated.parallel([
        Animated.timing(spark2Opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(spark2Position, {
            toValue: -size/2,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(spark2Opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Spark 3 animation
      Animated.parallel([
        Animated.timing(spark3Opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(spark3Position, {
            toValue: -size/2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(spark3Opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      // Restart animation after completion
      setTimeout(animateSparks, 1000);
    });
  };

  // Start animation on component mount
  useEffect(() => {
    animateSparks();
  }, []);

  return (
    <View style={{ position: 'relative', width: size, height: size }}>
      {/* Main Fire Emoji */}
      <Text style={{ fontSize: size/1.5 }}>🔥</Text>
      
      {/* Animated Sparks */}
      <Animated.Text 
        style={[
          styles.spark, 
          { 
            fontSize: size/3, 
            opacity: spark1Opacity,
            transform: [{ translateY: spark1Position }, { translateX: -size/8 }] 
          }
        ]}
      >
        ✨
      </Animated.Text>
      
      <Animated.Text 
        style={[
          styles.spark, 
          { 
            fontSize: size/3.5, 
            opacity: spark2Opacity,
            transform: [{ translateY: spark2Position }, { translateX: size/8 }] 
          }
        ]}
      >
        ✨
      </Animated.Text>
      
      <Animated.Text 
        style={[
          styles.spark, 
          { 
            fontSize: size/4, 
            opacity: spark3Opacity,
            transform: [{ translateY: spark3Position }] 
          }
        ]}
      >
        ✨
      </Animated.Text>
    </View>
  );
};

const Avatar = ({
  uri,
  size = hp(4.5),
  rounded = theme.radius.md,
  style,
  onPress,
  addings // Emoji string
}) => {
  // Check if addings is the fire emoji
  const isFireEmoji = addings === '🔥';

  return (
    <View style={{ position: 'relative' }}>
      <Image
        source={getImageSrc(uri)}
        transition={100}
        style={[styles.avatar, { height: size, width: size, borderRadius: rounded }, style]}
        onPress={onPress}
      />
      
      {/* Render regular emoji or animated fire emoji based on the value */}
      {addings && (
        <View style={[styles.emojiContainer, { right: -size/4, top: -size/4 }]}>
          {isFireEmoji ? (
            <AnimatedFireEmoji size={size/2} />
          ) : (
            <Text style={{ fontSize: size/2.5 }}>{addings}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    borderCurve: 'continuous',
    borderColor: theme.colors.text,
    borderWidth: 1
  },
  emojiContainer: {
    position: 'absolute',
   
    padding: 2,
    borderRadius: 50,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible'
  },
  spark: {
    position: 'absolute',
    top: 0,
    left: '50%',
  }
});

// import { StyleSheet, Text, View } from 'react-native';
// import React from 'react';
// import { hp } from '../helpers/common';
// import theme from '../constants/theme';
// import { Image } from 'expo-image';
// import { getImageSrc } from '../services/imageService';

// const Avatar = ({
//   uri,
//   size = hp(4.5),
//   rounded = theme.radius.md,
//   style,
//   onPress,
//   addings // Add this new prop to receive the emoji
// }) => {
//   return (
//     <View style={{ position: 'relative' }}>
//       <Image
//         source={getImageSrc(uri)}
//         transition={100}
//         style={[styles.avatar, { height: size, width: size, borderRadius: rounded }, style]}
//         onPress={onPress}
//       />
      
//       {/* Render emoji if available */}
//       {addings && (
//         <View style={[styles.emojiContainer, { right: -size/4, top: -size/4 }]}>
//           <Text style={{ fontSize: size/2.5 }}>{addings}</Text>
//         </View>
//       )}
//     </View>
//   );
// };

// export default Avatar;

// const styles = StyleSheet.create({
//   avatar: {
//     borderCurve: 'continuous',
//     borderColor: theme.colors.text,
//     borderWidth: 1
//   },
//   emojiContainer: {
//     position: 'absolute',
   
//     padding: 2,
//     borderRadius: 50,
//     zIndex: 1,
  
   
//     alignItems: 'center',
//     justifyContent: 'center'
//   }
// });