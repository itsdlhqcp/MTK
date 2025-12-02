import { View, Text, Pressable, StyleSheet } from 'react-native'
import React from 'react'
import Icon from "../assets/icons"
import theme from '@/constants/theme'

const BackButton = ({size=26, router, color}) => {
  // Use the passed color prop or fall back to the default theme color
  const iconColor = color || theme.colors.text;
  
  return (
    <Pressable onPress={()=> router.back()} style={styles.button}>
      <Icon name="arrowLeft" strokeWidth={2.5} size={size} color={iconColor}/>
    </Pressable>
  )
}

export default BackButton

const styles = StyleSheet.create({
    button: {
        alignSelf: 'flex-start', 
        padding: 8, 
        borderRadius: theme.radius.sm, 
        backgroundColor: 'rgba(0,0,0,0.07)'
    }
})