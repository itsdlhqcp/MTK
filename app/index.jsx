import { View, StyleSheet, Text, ActivityIndicator } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper';
import { DotIndicator } from 'react-native-indicators'; 

const index = () => {
   
  return (
    <ScreenWrapper>
       <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
       <DotIndicator size={12} color="green" />  
      </View>
    </ScreenWrapper>
    
  )
}

export default index
