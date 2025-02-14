import React, { useEffect, useState } from 'react'
import { StyleSheet, Text , View } from 'react-native'
import { useAuth } from '../contexts/AuthContext';
import { fetchNotifications } from '../services/notificationService';
import { hp, wp } from '../helpers/common'
import theme from '../constants/theme'
import ScreenWrapper from '../components/ScreenWrapper';
import { ScrollView } from 'react-native';
import Header from '../components/Header';
import { useRouter } from 'expo-router';
import NotificationItem from '../components/NotificationItem';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const {user} = useAuth();
  const router = useRouter();

  useEffect(()=>{
    getNotifications();
  },[]); 

  const getNotifications = async () => {
     let res = await fetchNotifications(user.id);
     console.log('res', res);
     if(res.success) setNotifications(res.data);
  }
  return (
   <ScreenWrapper>
      <View style={styles.container}>
         <Header title="Notifications" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listStyle}>
           {
             notifications.map(item=>{
               return (
                  <NotificationItem
                      item={item}
                      key={item?.id}
                      router={router}
                  />
               )
             })
           }

           {
            notifications.length==0 && (
                <Text style={styles.noData}>No notifications yet</Text>
            )
           }
        </ScrollView>
      </View>
   </ScreenWrapper>
   
  )
}

export default Notifications

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  listStyle: {
    paddingVertical: 20,
    gap: 10
  },
  noData: {
    fontSize: hp(1.8),
    textAlign: theme.fonts.medium,
    color: theme.colors.text,
    textAlign: 'center'
  }
})







// import React, { useEffect, useState } from 'react'
// import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
// import { useAuth } from '../contexts/AuthContext';
// import { fetchNotifications } from '../services/notificationService';
// import { hp, wp } from '../helpers/common'
// import theme from '../constants/theme'
// import ScreenWrapper from '../components/ScreenWrapper';
// import { ScrollView } from 'react-native';
// import Header from '../components/Header';
// import { useRouter } from 'expo-router';
// import NotificationItem from '../components/NotificationItem';

// const Notifications = () => {
//     const [notifications, setNotifications] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const {user} = useAuth();
//     const router = useRouter();

//     useEffect(() => {
//         getNotifications();
//     }, []); 

//     const getNotifications = async () => {
//         try {
//             setLoading(true);
//             setError(null);
//             let res = await fetchNotifications(user.id);
//             if (res.success) {
//                 setNotifications(res.data);
//             } else {
//                 setError('Failed to fetch notifications');
//             }
//         } catch (err) {
//             setError('Something went wrong');
//             console.error('Notification fetch error:', err);
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <ScreenWrapper>
//             <View style={styles.container}>
//                 <Header title="Notifications" />
//                 {loading ? (
//                     <ActivityIndicator size="large" color={theme.colors.primary} />
//                 ) : error ? (
//                     <Text style={styles.errorText}>{error}</Text>
//                 ) : (
//                     <ScrollView 
//                         showsVerticalScrollIndicator={false} 
//                         contentContainerStyle={styles.listStyle}
//                     >
//                         {notifications.map(item => (
//                             <NotificationItem
//                                 item={item}
//                                 key={item?.id}
//                                 router={router}
//                             />
//                         ))}
//                         {notifications.length === 0 && (
//                             <Text style={styles.noData}>No notifications yet</Text>
//                         )}
//                     </ScrollView>
//                 )}
//             </View>
//         </ScreenWrapper>
//     )
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: theme.colors.background,
//     },
//     listStyle: {
//         padding: wp(4),
//         paddingBottom: hp(2),
//     },
//     noData: {
//         textAlign: 'center',
//         fontSize: wp(4),
//         color: theme.colors.textLight,
//         marginTop: hp(20),
//     },
//     errorText: {
//         textAlign: 'center',
//         color: theme.colors.error,
//         marginTop: hp(20),
//     }
// });

// export default Notifications;