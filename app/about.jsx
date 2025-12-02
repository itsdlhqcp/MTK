import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from '@/assets/icons';
import { useRouter } from 'expo-router';

// Instagram-style dark theme colors
const instagramTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#000000',
    backgroundSecondary: '#121212',
    text: '#FFFFFF',
    textLight: '#8E8E8E',
    border: '#262626',
    primary: '#3797EF',
    error: '#ED4956',
    warning: '#FFA726',
    success: '#4CAF50',
  }
};

const appLogo = require('../assets/images/appicontrans.png'); // adjust path as needed

// Feature Item Component
const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIconContainer}>
      <Icon name={icon} size={24} color={instagramTheme.colors.primary} />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

// Social Media Button
const SocialButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.socialButton} onPress={onPress}>
    <Icon name={icon} size={18} color={instagramTheme.colors.text} />
    <Text style={styles.socialButtonText}>{label}</Text>
  </TouchableOpacity>
);

const AboutScreen = () => {
  const router = useRouter();
  
  // App Version
  const appVersion = "1.0.0";
  
  // Open URL helper function
  const openURL = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <ScreenWrapper bg={instagramTheme.colors.background}>
      <Header
        title="About"
        showBackButton={true}
        textColor={instagramTheme.colors.text}
        backgroundColor={instagramTheme.colors.background}
      />
      
      <ScrollView style={styles.container}>
        {/* App Logo and Title */}
        <View style={styles.logoContainer}>
          <View style={styles.appLogoWrapper}>
          <Image source={appLogo} style={styles.appLogoImage} resizeMode="contain" />
          </View>
          <Text style={styles.appTitle}>PlotTwist</Text>
          <Text style={styles.appVersion}>Version {appVersion}</Text>
        </View>
        
        {/* App Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            Plot Twist is your ultimate movie companion app - designed for film lovers who never want to miss a moment. Whether you're a casual viewer or a hardcore cinephile, Plot Twist brings you closer to the world of cinema with everything you need in one powerful, easy-to-use platform.
          </Text>
        </View>
        
        {/* Key Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <FeatureItem  // star
            icon="star"
            title="Fastest Reviews"
            description="Get quick, spoiler-free reviews the moment a movie hits theaters or OTT platforms."
          />
          
          <FeatureItem   // notification
            icon="notsqr"
            title="Instant Film Updates"
            description="Stay up-to-date with breaking movie news, trailers, cast announcements, and production insights."
          />
          
          <FeatureItem
            icon="calender"
            title="Release Alerts"
            description="Never miss a release again — receive notifications for upcoming theatrical and OTT premieres."
          />
          
          <FeatureItem   // stats
            icon="box"
            title="Box Office Reports"
            description="Track the latest box office numbers and trends in real-time."
          />
          
          <FeatureItem
            icon="behind"
            title="Behind-the-Scenes Content"
            description="Explore exclusive interviews, set footage, and the stories behind your favorite films."
          />
          
          <FeatureItem  //list
            icon="list"
            title="Watched list & OTT Tracker"
            description="Organize your watched list and keep tabs on where your favorite movies are streaming."
          />
        </View>
        
        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>
            From the latest blockbusters to hidden gems, Plot Twist ensures you're always in the know. Experience movies like never before!
          </Text>
        </View>
        
        {/* Social Media / Contact Links */}
        <View style={styles.socialContainer}>
          <Text style={styles.socialTitle}>Connect With Us</Text>
          <View style={styles.socialButtonsContainer}>
            <SocialButton 
              icon="insta" 
              label="Instagram" 
              onPress={() => openURL('https://instagram.com/plottwistapp')} 
            />
            <SocialButton 
              icon="mail" 
              label="Contact Us" 
              onPress={() => openURL('mailto:plotwistapk@gmail.com')} 
            />
            <SocialButton 
              icon="policy" 
              label="Privacy Policy" 
              onPress={() => openURL('https://sites.google.com/view/plottwist-privacy-policy/home?authuser=1')} 
            />
          </View>
        </View>
        
        {/* Credits */}
        <View style={styles.creditsContainer}>
          <Text style={styles.creditsText}>© 2025 Plot Twist. All Rights Reserved.</Text>
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    backgroundColor: instagramTheme.colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: hp(3),
    marginBottom: hp(4),
  },
  appLogoWrapper: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    backgroundColor: instagramTheme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: instagramTheme.colors.border,
  },
  appTitle: {
    fontSize: hp(3.5),
    fontWeight: 'bold',
    color: instagramTheme.colors.text,
    marginBottom: hp(0.5),
  },
  appVersion: {
    fontSize: hp(1.8),
    color: instagramTheme.colors.textLight,
  },
  descriptionContainer: {
    marginBottom: hp(4),
    backgroundColor: instagramTheme.colors.backgroundSecondary,
    borderRadius: theme.radius.sm,
    padding: wp(4),
  },
  descriptionText: {
    fontSize: hp(1.8),
    lineHeight: hp(2.7),
    color: instagramTheme.colors.text,
    textAlign: 'center',
  },
  section: {
    marginBottom: hp(4),
    backgroundColor: instagramTheme.colors.backgroundSecondary,
    borderRadius: theme.radius.sm,
    paddingVertical: hp(2),
    paddingHorizontal: wp(2),
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: instagramTheme.colors.text,
    marginBottom: hp(2),
    paddingHorizontal: wp(2),
  },
  featureItem: {
    flexDirection: 'row',
    paddingHorizontal: wp(2),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: instagramTheme.colors.border,
  },
  featureIconContainer: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: 'rgba(55, 151, 239, 0.1)', // Primary color with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: instagramTheme.colors.text,
    marginBottom: hp(0.5),
  },
  featureDescription: {
    fontSize: hp(1.6),
    color: instagramTheme.colors.textLight,
    lineHeight: hp(2.2),
  },
  ctaContainer: {
    marginBottom: hp(4),
    backgroundColor: 'rgba(55, 151, 239, 0.1)', // Primary color with opacity
    borderRadius: theme.radius.sm,
    padding: wp(4),
    borderLeftWidth: 3,
    borderLeftColor: instagramTheme.colors.primary,
  },
  ctaText: {
    fontSize: hp(1.8),
    lineHeight: hp(2.7),
    color: instagramTheme.colors.text,
    fontStyle: 'italic',
  },
  socialContainer: {
    marginBottom: hp(4),
  },
  socialTitle: {
    fontSize: hp(2),
    fontWeight: '500',
    color: instagramTheme.colors.text,
    marginBottom: hp(2),
    textAlign: 'center',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: instagramTheme.colors.backgroundSecondary,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.sm,
    marginBottom: hp(1.5),
    minWidth: wp(25),
    gap: wp(1.5),
  },
  socialButtonText: {
    fontSize: hp(1.6),
    color: instagramTheme.colors.text,
  },
  creditsContainer: {
    marginBottom: hp(4),
    alignItems: 'center',
  },
  creditsText: {
    fontSize: hp(1.5),
    color: instagramTheme.colors.textLight,
  },
  bottomPadding: {
    height: hp(5),
  },
  appLogoImage: {
    width: 84,
    height: 84,
    borderRadius: 8, // Optional: if your logo has rounded edges
  },
  
});