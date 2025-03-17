import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hp, wp } from '@/helpers/common';

const WelcomeHeader = ({ user }) => {
  // Create animated value for subtle animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-20)).current;
  
  // State to track the current welcome message
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome Back");
  
  // Array of welcome messages to cycle through
  const messages = ["Welcome Back", "sent1", "sent2", "sent3"];
  
  useEffect(() => {
    // Start animation when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
    
    // Set up message cycling
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      
      if (currentIndex < messages.length) {
        // Fade out current text
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Change text and fade in
          setWelcomeMessage(messages[currentIndex]);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      }
      
      // Stop after reaching the last message
      if (currentIndex === messages.length - 1) {
        clearInterval(interval);
      }
    }, 1000); // Change message every second
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.welcomeContainerWrapper}>
      <LinearGradient
        colors={['rgba(40, 40, 40, 0.8)', 'rgba(20, 20, 20, 0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <Animated.View 
          style={[
            styles.welcomeContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Animated.Text style={[styles.welcomeText, { opacity: fadeAnim }]}>
            {welcomeMessage}
          </Animated.Text>
          <Text style={styles.username}>{user?.userName || "PloTwist"}</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeContainerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: wp(2),
  },
  gradientBackground: {
    borderRadius: 12,
    padding: hp(1),
  },
  welcomeContainer: {
    paddingVertical: hp(0.5),
  },
  welcomeText: {
    color: '#AAA',
    fontSize: hp(1.6),
    fontWeight: '500',
  },
  username: {
    color: 'white',
    fontSize: hp(2.2),
    fontWeight: 'bold',
    marginTop: hp(0.3),
  },
});

export default WelcomeHeader;