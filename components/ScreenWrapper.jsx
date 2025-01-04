// import { View, Text } from 'react-native'
// import React from 'react'
// import { useSafeAreaInsets } from 'react-native-safe-area-context'

// const ScreenWrapper = ({children, bg, key, ...props}) => {

//     const {top} = useSafeAreaInsets();
//     const paddingTop = top>0? top+5: 30;
//   return (
//     <View style={{flex: 1, paddingTop, backgroundColor: bg}} {...props}>
//       {
//         children
//       }
//     </View>
//   )
// }

// export default ScreenWrapper



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
// ScreenWrapper.js
// import React from 'react';
// import { Animated, StyleSheet, View } from 'react-native';

// const ScreenWrapper = ({ children, key, style, ...props }) => {
//   return (
//     <Animated.View key={key} style={[styles.container, style]} {...props}>
//       {children}
//     </Animated.View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

// export default ScreenWrapper;