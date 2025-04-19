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


import { View, StatusBar, Text, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { DotIndicator } from 'react-native-indicators'; 
import { NetworkUtils } from '../utils/network';
import Icon from '../assets/icons';
import { hp, wp } from '../helpers/common';
// import 'expo-dev-client';

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
          <DotIndicator size={12} color="green" />
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