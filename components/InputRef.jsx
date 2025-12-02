import React, { forwardRef } from 'react'
import { StyleSheet, View, TextInput } from 'react-native'
import theme from '../constants/theme'
import { hp } from '@/helpers/common'

const Input = forwardRef((props, ref) => {
  const { icon, containerStyle, ...restProps } = props;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {icon && icon}
      <TextInput
        style={[
          { flex: 1 },
          props.multiline && { textAlignVertical: 'top' }
        ]}
        placeholderTextColor={theme.colors.textLight}
        ref={ref}
        {...restProps}
      />
    </View>
  )
});

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