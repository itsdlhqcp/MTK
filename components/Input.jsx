import React from 'react'
import { StyleSheet, Text, View, TextInput } from 'react-native'
import theme from '../constants/theme'
import { hp } from '@/helpers/common'

const Input = (props) => {
  const { icon, containerStyle, inputStyle, inputRef, ...restProps } = props;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {icon && icon}
      <TextInput
        style={[
          { 
            flex: 1,
            color: '#FFFFFF', // Default text color to white
          },
          props.multiline && { textAlignVertical: 'top' },
          inputStyle // Apply custom inputStyle if provided
        ]}
        placeholderTextColor={props.placeholderTextColor || theme.colors.textLight}
        ref={inputRef}
        {...restProps}
      />
    </View>
  )
}

export default Input

const styles = StyleSheet.create({
    container: {
         flexDirection: 'row', 
         height: hp(7.2), 
         alignItems: 'center', 
         borderWidth: 0.4, 
         borderColor: theme.colors.text, 
         borderRadius: theme.radius.xxl, 
         borderCurve: 'continuous', 
         paddingHorizontal: 18, 
         gap: 12
    }
})