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


import { View, StatusBar } from 'react-native';
import React from 'react';
import { DotIndicator } from 'react-native-indicators'; 
import 'expo-dev-client';

const Index = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="black" />
       <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
         <DotIndicator size={12} color="green" />
      </View>
    </>
  );
};

export default Index;