import { View, StyleSheet, StatusBar, Image, Text, Pressable } from 'react-native';
import React from 'react';
import { wp, hp } from '../helpers/common';
import theme from "../constants/theme";
import Button from "../components/Button"
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const Welcome = () => {
  const router = useRouter();
  
  const colors = {
    red: '#E50914',
    darkRed: '#8B0000',
    blue: '#0066B1',
    darkBlue: '#00284D',
    darkBackground: '#0A0A0A',
    gradientStart: '#00284D', // Dark blue shade
    gradientMiddle: '#141414', // Very dark gray/near black
    gradientEnd: '#8B0000', // Dark red shade
  };
  
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Main background gradient */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.container}>
         {/* Welcome image */}
        <View style={styles.imageContainer}>
          <Image
            style={styles.welcomeImage}
            resizeMode="contain"
            source={require('../assets/images/welcome.png')}
          />
        </View>
        <View style={{ gap: 20 }}>
        <Text style={styles.title}>
          <Text style={{color: colors.red}}>Plot</Text>
          <Text style={{color: colors.blue}}>Twist</Text>
        </Text>
        <View style={{ flexDirection: 'column' }}>
          <Text style={styles.punchline}>Stay Ahead of the Plot</Text>
          <Text style={styles.punchline}>Twist your movie Experience</Text>
        </View>
      </View>

        {/* footer */}
        <View style={styles.footer}>
          <Button
          title='Getting Started'
          buttonStyle={{
            marginHorizontal: wp(3),
            backgroundColor: colors.red,
            borderRadius: 10,
            elevation: 5,
          }} 
          textStyle={{
            fontWeight: 'bold',
            fontSize: hp(1.8),
          }}
          onPress={() => router.push("onboardingGrid")}
          loading={false}
          />
            <View style={styles.bottonTextContainer}>
              <Text style={styles.loginText}>
               Already have an account!
               </Text>
            <Pressable onPress={()=> router.push('login')}>
            <Text style={[styles.loginText, {
              color: colors.blue,
               fontWeight: theme.fonts.semibold}]}>
                Login
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>   
  );
};

export default Welcome;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: wp(10),
    paddingTop: StatusBar.currentHeight || 20,
  },
  imageContainer: {
    width: wp(90),
    height: hp(35),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  //  backgroundColor: 'rgba(0,0,0,0.3)', // Subtle dark overlay
    marginVertical: hp(2),
  },
  welcomeImage: {
    width: wp(80), 
    height: hp(30),
    alignSelf: 'center',
  },
  title: {
    fontSize: hp(4),
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  punchline: {
    textAlign: 'center', 
    paddingHorizontal: wp(10), 
    fontSize: hp(1.7), 
    color: '#e0e0e0',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  footer: {
    gap: 30, 
    width: '100%',
   // backgroundColor: 'rgba(0,0,0,0.4)',
    padding: wp(5),
    borderRadius: 15,
  },
  bottonTextContainer: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8
  }, 
  loginText: {
    textAlign: 'center', 
    color: '#e0e0e0', 
    fontSize: hp(1.6),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  }
});