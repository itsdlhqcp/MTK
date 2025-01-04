import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import BackButton from './BackButton'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'

const Header = ({title, showBackButton = false, mb = 10, ms = 10}) => {
    const router = useRouter();
    return (
        <View style={[styles.container, {marginBottom: mb}, {marginLeft: ms}]}>
            <View style={styles.titleContainer}>
                {showBackButton && (
                    <View style={styles.backButton}>
                        <BackButton router={router} />
                    </View>
                )}
                <Text style={styles.title}>{title}</Text>
            </View>
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    container: {
        marginTop: 28,
        position: 'relative'
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    title: {
        fontSize: hp(2.7),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.textDark,
        textAlign: 'center'
    },
    backButton: {
        position: 'absolute',
        left: 0
    }
})


// import { useRouter } from 'expo-router';
// import React from 'react'
// import { StyleSheet, Text, View } from 'react-native'
// import BackButton from './BackButton'
// import { hp } from '../helpers/common'
// import theme from '../constants/theme'

// const Header = ({title, showBackButton = false, mb = 10}) => {
//   const router = useRouter();
//   return (
//     <View style={[styles.container, {marginBottom: mb}]}>
//       {
//         showBackButton && (
//           <View style={styles.showBackButton}>
//             <BackButton router={router} />
//           </View>
//         )
//       }
//       <Text style={styles.title}>{title|| ""}</Text>
//     </View>
//   )
// }

// export default Header

// const styles = StyleSheet.create({
//   container:{
//             flexDirection: 'row', 
//              alignItems: 'center', 
//              justifyContent: 'space-between', 
//              marginTop: 28,
//              gap: 10, 
//              position: 'relative'
//             }, 
//          title:{
//              fontSize: hp(2.7), 
//              fontWeight: theme.fonts.semibold,
//              color: theme.colors.textDark,
//              marginLeft: 150 
//          }, 
//          backButton: {
//              position: 'absolute', 
//             left: 0
//         },
//         showBackButton: {
//            position: 'absolute', 
//             left: 0
//         }
// })
