import { View } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ScreenWrapper = ({children, bg, ...props}) => {  // Removed 'key' from destructuring
    const {top} = useSafeAreaInsets();
    const paddingTop = top > 0 ? top + 5 : 0;
    
    return (
        <View style={{flex: 1, paddingTop, backgroundColor: bg}} {...props}>
            {children}
        </View>
    )
}

export default ScreenWrapper
