// import { View, StyleSheet, StatusBar } from 'react-native';
// import React from 'react';
// import ScreenWrapper from '../components/ScreenWrapper';
//  import  wp  from '../helpers/common'

// const Welcome = () => {
//   return (
//     <ScreenWrapper bg="white"> {/* Pass background color as a prop */}
//       <StatusBar barStyle={"dark-content"} />
//      <View style={styles.container}>
//         <Image style={styles.welcomeImage} resizeMode='contain' source={require('../assets/images/welcome.png')} />
//      </View>
//     </ScreenWrapper>
//   );
// };

// export default Welcome;

// const styles = StyleSheet.create({
//   container:{
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'space-around',
//     backgroundColor: 'red',
//     paddingHorizontal: wp(10),
//   }
// });







// import { View, StyleSheet, StatusBar, Image } from 'react-native';
// import React from 'react';
// import ScreenWrapper from '../components/ScreenWrapper';
// import wp, { hp } from '../helpers/common';
// import theme from "../constants/theme"

// const welcome = () => {
//   return (
//     <ScreenWrapper bg="white">
//       <StatusBar barStyle="dark-content" />
//       <View style={styles.container}>
//          {/* welcome image */}
//         <Image
//           style={styles.welcomeImage}
//           resizeMode="contain"
//           source={require('../assets/images/welcome.png')}
//         />
//         <View style={{gap: 20}}>
//            <Text style={styles.title}>LinkUp!</Text>
//            <Text style={styles.punchline}>Where every thought finds a home and every image tells a story.</Text>
//         </View>
//       </View>
//     </ScreenWrapper>
//   );
// };

// export default welcome;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'space-around',
//     backgroundColor: 'white',
//     paddingHorizontal: wp(10),
//   },
//   welcomeImage: {
//     width: hp(30), 
//     height: wp(100),
//     alignSelf: 'center'
//   },
//   title: {
//     color: theme.colors.text,
//     fontSize: hp(4),
//     textAlign: 'center',
//     fontWeight: theme.fonts.extraBold
//   },
//   punchline: {
//     textAlign: 'center', 
//     paddingHorizontal: wp(10), 
//     fontSize: hp(1.7), 
//     color: theme.colors.text 
//   }
// });







import { View, StyleSheet, StatusBar, Image, Text, Pressable } from 'react-native';
import React from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { wp, hp } from '../helpers/common';
import theme from "../constants/theme";
import Button from "../components/Button"
import { useRouter } from 'expo-router';

const Welcome = () => {
  const router = useRouter();
  return (
    <ScreenWrapper bg="white">
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
         {/* Welcome image */}
        <Image
          style={styles.welcomeImage}
          resizeMode="contain"
          source={require('../assets/images/welcome.png')}
        />
        <View style={{ gap: 20 }}>
           <Text style={styles.title}>MediaTalk</Text>
           <Text style={styles.punchline}>Where every thought finds a home and every image tells a story.</Text>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Button
          title='Getting Started'
          buttonStyle={{marginHorizontal: wp(3)}} 
          onPress={() => router.push("onboardingGrid")}
          loading={false}
          />
            <View style={styles.bottonTextContainer}>
              <Text style={styles.loginText}>
               Already have an account!
               </Text>
            <Pressable onPress={()=> router.push('login')}>
            <Text style={[styles.loginText, {
              color: theme.colors.primaryDark,
               fontWeight: theme.fonts.semibold}]}>
                Login
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>   
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingHorizontal: wp(10),
  },
  welcomeImage: {
    width: wp(80), 
    height: hp(30),
    alignSelf: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(4),
    textAlign: 'center',
    fontWeight: 'bold', // Adjust as per font support
  },
  punchline: {
    textAlign: 'center', 
    paddingHorizontal: wp(10), 
    fontSize: hp(1.7), 
    color: theme.colors.text,
  },
  footer: {
    gap: 30, 
    width: '100%'
  },
  bottonTextContainer: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8
  }, 
  loginText: {
    textAlign: 'center', 
    color: theme.colors.text, 
    fontSize: hp(1.6)
  }
});
