// import { View, StyleSheet, Text, ActivityIndicator } from 'react-native'
// import React from 'react'
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { DotIndicator } from 'react-native-indicators'; 

// const index = () => {
   
// return (
//      <ScreenWrapper bg="black">
//      {/* <ScreenWrapper > */}
//        <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
//       {/* </View> <View style={{flex:1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black'}}> */}
//        <DotIndicator size={12} color="green" />  
//       </View>
//     </ScreenWrapper>
//   )
// }

// export default index


// import { View, StatusBar } from 'react-native';
// import React from 'react';
// import { DotIndicator } from 'react-native-indicators'; 
// // import 'expo-dev-client';

// const Index = () => {
//   return (
//     <>
//       <StatusBar barStyle="dark-content" backgroundColor="black" />
//        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
//          <DotIndicator size={12} color="green" />
//       </View>
//     </>
//   );
// };

// export default Index;


// import { View, StatusBar, Text, StyleSheet } from 'react-native';
// import React, { useEffect, useState } from 'react';
// import { DotIndicator } from 'react-native-indicators'; 
// import { NetworkUtils } from '../utils/network';
// import Icon from '../assets/icons';
// import { hp, wp } from '../helpers/common';
// // import 'expo-dev-client';

// const Index = () => {
//   const [isConnected, setIsConnected] = useState(true);
  
//   useEffect(() => {
//     // Check network status on mount
//     const checkNetworkStatus = async () => {
//       const connected = await NetworkUtils.isConnected();
//       setIsConnected(connected);
//     };
    
//     checkNetworkStatus();
    
//     // Set up network listener
//     const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
//       setIsConnected(connected);
//     });
    
//     return () => unsubscribe();
//   }, []);

//   return (
//     <>
//       <StatusBar barStyle="dark-content" backgroundColor="black" />
//       <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
//         {isConnected ? (
//           <DotIndicator size={15} color="red" count={3} />
//         ) : (
//           <View style={styles.offlineContainer}>
//             <Icon
//               name="noicon"
//               size={hp(10.5)} 
//               color="white" 
//             />
//             <Text style={styles.offlineText}>You're offline</Text>
//             <Text style={styles.offlineSubText}>
//               Connect to the internet to continue
//             </Text>
//           </View>
//         )}
//       </View>
      
//       {/* Offline Mode Indicator */}
//       {!isConnected && (
//         <View style={styles.offlineBar}>
//           <Text style={styles.offlineBarText}>Offline Mode - Network Unavailable</Text>
//         </View>
//       )}
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   offlineContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   offlineText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: hp(1),
//   },
//   offlineSubText: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     paddingHorizontal: wp(10),
//   },
//   offlineBar: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     padding: hp(1),
//     backgroundColor: '#e53935', 
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   offlineBarText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     fontSize: hp(1.4),
//   }
// });

// export default Index;




// import { View, StatusBar, Text, StyleSheet, Animated, Easing } from 'react-native';
// import React, { useEffect, useState, useRef } from 'react';
// import { NetworkUtils } from '../utils/network';
// import Icon from '../assets/icons';
// import { hp, wp } from '../helpers/common';
// import theme from '@/constants/theme';

// // Custom Dot Indicator Component
// const CustomDotIndicator = ({ count = 3 }) => {
//   // Create animated values for each dot
//   const animatedValues = useRef(
//     Array(count).fill().map(() => new Animated.Value(0))
//   ).current;
  
//   useEffect(() => {
//     // Function to animate a single dot
//     const animateDot = (index, delay) => {
//       Animated.sequence([
//         // Wait for delay
//         Animated.delay(delay),
//         // Scale up and opacity change
//         Animated.timing(animatedValues[index], {
//           toValue: 1,
//           duration: 400,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         }),
//         // Scale down and opacity change
//         Animated.timing(animatedValues[index], {
//           toValue: 0,
//           duration: 400,
//           easing: Easing.in(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         // Loop the animation
//         animateDot(index, 600);
//       });
//     };

//     // Start animation for each dot with different delays
//     animatedValues.forEach((_, index) => {
//       animateDot(index, index * 300);
//     });

//     return () => {
//       // Cleanup animations if needed
//       animatedValues.forEach(value => value.stopAnimation());
//     };
//   }, []);

//   return (
//     <View style={styles.dotContainer}>
//       {animatedValues.map((value, index) => {
//         // Alternate colors between red and blue
//         const dotColor = index % 2 === 0 ? theme.colors.red : theme.colors.blue;
        
//         // Animation transformations
//         const scale = value.interpolate({
//           inputRange: [0, 1],
//           outputRange: [0.7, 1.2],
//         });
        
//         const opacity = value.interpolate({
//           inputRange: [0, 0.5, 1],
//           outputRange: [0.5, 1, 0.5],
//         });

//         return (
//           <Animated.View
//             key={index}
//             style={[
//               styles.dot,
//               { backgroundColor: dotColor },
//               {
//                 transform: [{ scale }],
//                 opacity,
//               },
//             ]}
//           />
//         );
//       })}
//     </View>
//   );
// };

// const Index = () => {
//   const [isConnected, setIsConnected] = useState(true);
  
//   useEffect(() => {
//     // Check network status on mount
//     const checkNetworkStatus = async () => {
//       const connected = await NetworkUtils.isConnected();
//       setIsConnected(connected);
//     };
    
//     checkNetworkStatus();
    
//     // Set up network listener
//     const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
//       setIsConnected(connected);
//     });
    
//     return () => unsubscribe();
//   }, []);
  
//   return (
//     <>
//       <StatusBar barStyle="dark-content" backgroundColor="black" />
//       <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
//         {isConnected ? (
//           <CustomDotIndicator count={3} />
//         ) : (
//           <View style={styles.offlineContainer}>
//             <Icon
//               name="noicon"
//               size={hp(10.5)} 
//               color="white" 
//             />
//             <Text style={styles.offlineText}>You're offline</Text>
//             <Text style={styles.offlineSubText}>
//               Connect to the internet to continue
//             </Text>
//           </View>
//         )}
//       </View>
      
//       {/* Offline Mode Indicator */}
//       {!isConnected && (
//         <View style={styles.offlineBar}>
//           <Text style={styles.offlineBarText}>Offline Mode - Network Unavailable</Text>
//         </View>
//       )}
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   dotContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   dot: {
//     width: 18,
//     height: 18,
//     borderRadius: 9.5,
//     marginHorizontal: 7,
//   },
//   offlineContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   offlineText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: hp(1),
//   },
//   offlineSubText: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     paddingHorizontal: wp(10),
//   },
//   offlineBar: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     padding: hp(1),
//     backgroundColor: '#e53935', 
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   offlineBarText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     fontSize: hp(1.4),
//   }
// });

// export default Index;


// import { View, StatusBar, Text, StyleSheet, Animated, Easing } from 'react-native';
// import React, { useEffect, useState, useRef } from 'react';
// import { NetworkUtils } from '../utils/network';
// import Icon from '../assets/icons';
// import { hp, wp } from '../helpers/common';

// // Custom Dot Indicator Component with Dropping Animation
// const CustomDotIndicator = ({ count = 5 }) => {
//   // Create animated values for each dot
//   const dotAnimatedValues = useRef(
//     Array(count).fill().map(() => new Animated.Value(0))
//   ).current;
  
//   useEffect(() => {
//     // Function to create a dropping animation for a single dot
//     const animateDot = (index, delay) => {
//       // Reset the position to start from the top
//       dotAnimatedValues[index].setValue(0);
      
//       Animated.sequence([
//         // Wait for delay before starting this dot's animation
//         Animated.delay(delay),
        
//         // Drop the dot from top to bottom
//         Animated.timing(dotAnimatedValues[index], {
//           toValue: 1,
//           duration: 700,
//           easing: Easing.bounce,
//           useNativeDriver: true,
//         }),
        
//         // Hold briefly at the bottom
//         Animated.delay(200),
        
//         // Fade out
//         Animated.timing(dotAnimatedValues[index], {
//           toValue: 2,
//           duration: 150,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         }),
        
//         // Delay before next cycle
//         Animated.delay(150),
//       ]).start(() => {
//         // Queue up the next dot animation
//         const nextIndex = (index + 1) % count;
//         animateDot(nextIndex, 80);
//       });
//     };

//     // Only start with the first dot (index 0)
//     animateDot(0, 400);

//     return () => {
//       // Cleanup animations if needed
//       dotAnimatedValues.forEach(value => value.stopAnimation());
//     };
//   }, []);

//   return (
//     <View style={styles.dotIndicatorContainer}>
//       {dotAnimatedValues.map((value, index) => {
//         // Alternate colors between red and blue
//         const dotColor = index % 2 === 0 ? 'red' : 'blue';
        
//         // Main dot animation
//         const translateY = value.interpolate({
//           inputRange: [0, 1, 2],
//           outputRange: [-70, 0, 0], // Start from top, drop to bottom
//         });
        
//         const dotOpacity = value.interpolate({
//           inputRange: [0, 0.1, 0.9, 1, 1.5, 2],
//           outputRange: [1, 1, 1, 1, 0, 0], // Visible during drop, fade out at the end
//         });

//         return (
//           <Animated.View
//             key={index}
//             style={[
//               styles.dot,
//               { backgroundColor: dotColor },
//               {
//                 position: 'absolute',
//                 transform: [{ translateY }],
//                 opacity: dotOpacity
//               },
//             ]}
//           />
//         );
//       })}
//     </View>
//   );
// };

// const Index = () => {
//   const [isConnected, setIsConnected] = useState(true);
  
//   useEffect(() => {
//     // Check network status on mount
//     const checkNetworkStatus = async () => {
//       const connected = await NetworkUtils.isConnected();
//       setIsConnected(connected);
//     };
    
//     checkNetworkStatus();
    
//     // Set up network listener
//     const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
//       setIsConnected(connected);
//     });
    
//     return () => unsubscribe();
//   }, []);
  
//   return (
//     <>
//       <StatusBar barStyle="dark-content" backgroundColor="black" />
//       <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
//         {isConnected ? (
//           <CustomDotIndicator count={5} />
//         ) : (
//           <View style={styles.offlineContainer}>
//             <Icon
//               name="noicon"
//               size={hp(10.5)} 
//               color="white" 
//             />
//             <Text style={styles.offlineText}>You're offline</Text>
//             <Text style={styles.offlineSubText}>
//               Connect to the internet to continue
//             </Text>
//           </View>
//         )}
//       </View>
      
//       {/* Offline Mode Indicator */}
//       {!isConnected && (
//         <View style={styles.offlineBar}>
//           <Text style={styles.offlineBarText}>Offline Mode - Network Unavailable</Text>
//         </View>
//       )}
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   dotIndicatorContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     height: 100, // Height for the container
//     width: 100, // Width to create center alignment
//     position: 'relative',
//     overflow: 'hidden',
//   },
//   dot: {
//     width: 22, // 2x size (original was 15)
//     height: 22, // 2x size (original was 15)
//     borderRadius: 12, // Half of the width/height for a perfect circle
//     left: 30, // Center the dot horizontally (100 container width - 30 dot width)/2
//   },
//   offlineContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   offlineText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: hp(1),
//   },
//   offlineSubText: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     paddingHorizontal: wp(10),
//   },
//   offlineBar: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     padding: hp(1),
//     backgroundColor: '#e53935', 
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   offlineBarText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     fontSize: hp(1.4),
//   }
// });

// export default Index;


import { View, StatusBar, Text, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { NetworkUtils } from '../utils/network';
import Icon from '../assets/icons';
import { hp, wp } from '../helpers/common';
import CustomDotIndicator from '../components/CutomDotIndicator';

const Index = () => {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    // Check network status on mount
    const checkNetworkStatus = async () => {
      const connected = await NetworkUtils.isConnected();
      setIsConnected(connected);
    };
    
    checkNetworkStatus();
    
    // Set up network listener
    const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
      setIsConnected(connected);
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="black" />
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        {isConnected ? (
          <CustomDotIndicator count={55} size={18}/>
        ) : (
          <View style={styles.offlineContainer}>
            <Icon
              name="noicon"
              size={hp(10.5)} 
              color="white" 
            />
            <Text style={styles.offlineText}>You're offline</Text>
            <Text style={styles.offlineSubText}>
              Connect to the internet to continue
            </Text>
          </View>
        )}
      </View>
      
      {/* Offline Mode Indicator */}
      {!isConnected && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineBarText}>Offline Mode - Network Unavailable</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: hp(1),
  },
  offlineSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
  offlineBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: hp(1),
    backgroundColor: '#e53935', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: hp(1.4),
  }
});

export default Index;