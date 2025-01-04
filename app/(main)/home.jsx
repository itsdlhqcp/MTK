// import { Text, Button, Alert, View, StyleSheet, Pressable } from 'react-native'
// import React from 'react'
// import { useRouter } from 'expo-router'
// import theme from '../../constants/theme'
// import {useAuth} from '../../contexts/AuthContext'
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { supabase } from '../../lib/supabase';
// import { wp, hp } from '@/helpers/common'
// import Icon from '@/assets/icons'
// import Avatar from '../../components/Avatar'

// const home = () => {

//     const {user, setAuth} = useAuth();

//     console.log('user', user);
//     const router = useRouter();

//     const onLogout = async () => {
//         const {error} = await supabase.auth.signOut(); 
//         if (!error) {
//             Alert.alert('Successfully logged out');
//         }else{
//             Alert.alert('Error logging out');
//         }
//     }
//   return (
//     <ScreenWrapper bg={"white"}>
//       <View style={styles.container}>
//           {/* header */} 
//           <View style={styles.header} >
//             <Text style={styles.title}>MediaTalk</Text>
//             <View style={styles.icons}>
//               <Pressable  onPress={()=> router.push('notifications')}>
//                 <Icon name="heart" size={hp(3.2)} color={theme.colors.text} />
//               </Pressable>
//               <Pressable onPress={() => router.push('createFeed')}>
//                 <Icon name="plus" size={hp(3.2)} color={theme.colors.text} />
//               </Pressable> 
//               <Pressable onPress={() => router.push('profile')}>
//                   <Avatar 
//                       uri={user?.image}
//                       size={hp(3.7)}
//                       rounded={theme.radius.xs}
//                       style={{borderWidth: 1.3}}
//                   />
//               </Pressable>
//             </View>
      
//           </View>
//       </View>
      
//       <Button title='logout' onPress={onLogout} />
//     </ScreenWrapper>
//   )
// }

// export default home

// const styles = StyleSheet.create({
//   container: {
//   flex: 1,
//   }, 
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
    
//     alignItems: 'center', 
//     marginBottom: 10,
//     marginHorizontal: wp(3.4)
//   }, 
//   title:{
//     color: theme.colors.text,
//     fontSize: hp(3.2),
//     fontWeight: theme.fonts.bold
//   }, 
//   listStyle: {
//     paddingTop: 20, 
//     paddingHorizontal: wp(4)
//   }, 
//   icons: {
//     flexDirection: 'row', 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     gap: 18
//   },
//   noPosts: {
//     fontSize: hp(2),
//     textAlign: 'center', 
//     color: theme.colors.text 
//   },
//   pill:{
//     position: 'absolute', 
//     right: -10, 
//     top: -4, 
//     height: hp(2.2), 
//     width: hp(2.2), 
//     borderRadius: 20, 
//     backgroundColor: theme.colors.roseLight
//   }, 
//   pillText: {
//     color: 'white',
//     fontSize: hp(1.8), 
//     fontWeight: theme.fonts.bold } from 'react-native'
//   }
// }) , 



import { Text, Button, Alert, View, StyleSheet, Pressable, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import theme from '../../constants/theme'
import {useAuth} from '../../contexts/AuthContext'
import ScreenWrapper from '@/components/ScreenWrapper';
import { supabase } from '../../lib/supabase';
import { wp, hp } from '@/helpers/common'
import Icon from '@/assets/icons'
import Avatar from '../../components/Avatar'

const home = () => {
    const {user, setAuth} = useAuth();
    console.log('user', user);
    const router = useRouter();

    const onLogout = async () => {
        const {error} = await supabase.auth.signOut(); 
        if (!error) {
            Alert.alert('Successfully logged out');
        }else{
            Alert.alert('Error logging out');
        }
    }
  return (
    <ScreenWrapper bg={"#E0E0E0"}>
      <View style={styles.container}>
          {/* header */} 
          <View style={styles.header} >
            <Text style={styles.title}>MediaTalk</Text>
            <View style={styles.icons}>
              <Pressable onPress={()=> router.push('notifications')}>
                <Icon name="heart" size={hp(3.2)} color="white" />
              </Pressable>
              <Pressable onPress={() => router.push('createFeed')}>
                <Icon name="plus" size={hp(3.2)} color="white" />
              </Pressable> 
              <Pressable onPress={() => router.push('profile')}>
                  <Avatar 
                      uri={user?.image}
                      size={hp(4)}
                      rounded={theme.radius.xs}
                      style={{borderWidth: 1.3, borderColor: 'white'}}
                  />
              </Pressable>
            </View>
          </View>
      </View>
      
      <Button title='logout' onPress={onLogout} />
    </ScreenWrapper>
  )
}

export default home

const styles = StyleSheet.create({
  container: {
    flex: 1
  }, 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: 10,
    // marginHorizontal: wp(3.4),
    backgroundColor: '#625D5D',
    padding: wp(3.2),
    // borderRadius: theme.radius.sm
  }, 
  title:{
    color: 'white',
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold
  }, 
  listStyle: {
    paddingTop: 20, 
    paddingHorizontal: wp(4)
  }, 
  icons: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 18
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center', 
    color: theme.colors.text 
  },
  pill:{
    position: 'absolute', 
    right: -10, 
    top: -4, 
    height: hp(2.2), 
    width: hp(2.2), 
    borderRadius: 20, 
    backgroundColor: theme.colors.roseLight
  }, 
  pillText: {
    color: 'white',
    fontSize: hp(1.8), 
    fontWeight: theme.fonts.bold
  }
})