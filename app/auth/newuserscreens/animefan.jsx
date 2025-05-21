import { View, StyleSheet, Text, TouchableOpacity, StatusBar as RNStatusBar, Animated, Alert, ScrollView } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import theme from '@/constants/theme';
import { hp, wp } from '@/helpers/common';
import { updateUserPreferences } from '../../../services/userPreferances';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '@/components/BackButton';

// Define colors to match login page
const colors = {
  red: '#E50914',
  darkRed: '#8B0000',
  blue: '#0066B1',
  darkBlue: '#00284D',
  darkBackground: '#0A0A0A',
  gradientStart: '#00284D', // Dark blue shade
  gradientMiddle: '#141414', // Very dark gray/near black
  gradientEnd: '#8B0000', // Dark red shade
  lightText: '#e0e0e0',
  errorColor: '#FF5252',
};

// Define anime tags with their corresponding values
const animeTags = [
  { name: 'One Piece', value: 'a' },
  { name: 'Naruto', value: 'b' },
  { name: 'Bleach', value: 'c' },
  { name: 'Dragon Ball', value: 'd' },
  { name: 'Attack on Titan', value: 'e' },
  { name: 'Death Note', value: 'f' },
];

const AnimeFanPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [showAnimeTags, setShowAnimeTags] = useState(false);
  const [error, setError] = useState(false);
  const [animeError, setAnimeError] = useState(false);
  
  // Animation values for shake effect
  const optionShakeAnimation = useRef(new Animated.Value(0)).current;
  const animeShakeAnimation = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const animeErrorOpacity = useRef(new Animated.Value(0)).current;

  // Show anime tags when user selects "Yes"
  useEffect(() => {
    if (selectedOption === 'yes') {
      setShowAnimeTags(true);
    } else {
      setShowAnimeTags(false);
      setSelectedAnime(null);
    }
  }, [selectedOption]);

  const shakeAndShowError = (isAnimeError = false) => {
    // Reset animation value
    const animationValue = isAnimeError ? animeShakeAnimation : optionShakeAnimation;
    const opacityValue = isAnimeError ? animeErrorOpacity : errorOpacity;
    
    animationValue.setValue(0);
    
    // Fade in error message
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Shake animation sequence
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animationValue, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animationValue, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animationValue, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  const validateAndProceed = () => {
    if (selectedOption === null) {
      setError(true);
      shakeAndShowError();
      return false;
    }
    
    if (selectedOption === 'yes' && selectedAnime === null) {
      setAnimeError(true);
      shakeAndShowError(true);
      return false;
    }
    
    return true;
  };

  const savePreference = async () => {
    if (!validateAndProceed()) {
      return;
    }

    try {
      setLoading(true);
      const preferences = {
        animefan: selectedOption === 'yes',
      };
      
      // Add anime value if user is an anime fan
      if (selectedOption === 'yes' && selectedAnime) {
        preferences.anime = selectedAnime;
      }
      
      const response = await updateUserPreferences(user.id, preferences);

      if (!response.success) {
        throw new Error(response.msg);
      }
      router.dismissAll();
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const optionShakeStyle = {
    transform: [{ translateX: optionShakeAnimation }]
  };
  
  const animeShakeStyle = {
    transform: [{ translateX: animeShakeAnimation }]
  };

  const Option = ({ value, label, selected, onPress }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.optionButton,
        selected && styles.optionSelected,
        error && !selected && styles.optionError
      ]}
    >
      <Text style={[
        styles.optionText,
        selected && styles.optionTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  const AnimeTag = ({ tag, selected, onPress }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.animeTag,
        selected && styles.animeTagSelected,
        animeError && !selected && styles.animeTagError
      ]}
    >
      <Text style={[
        styles.animeTagText,
        selected && styles.animeTagTextSelected
      ]}>
        {tag.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {/* Main background gradient */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={{flexGrow: 1}}>
        <BackButton router={router} iconColor={colors.lightText} />
        
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.welcomeText}>
              <Text style={{color: colors.red}}>Quick</Text>
            </Text>
            <Text style={styles.welcomeSmallText}>Question</Text>
            <Text style={styles.subtitle}>
              Help us personalize your experience
            </Text>
          </View>
          
          <Animated.View style={[styles.questionSection, optionShakeStyle]}>
            <Text style={styles.questionText}>Do you watch anime?</Text>
            
            <Animated.Text 
              style={[
                styles.errorText, 
                {opacity: errorOpacity}
              ]}
            >
              Please select an option
            </Animated.Text>
            
            <View style={styles.optionsContainer}>
              <Option 
                value="yes"
                label="Yes"
                selected={selectedOption === 'yes'}
                onPress={() => {
                  setSelectedOption('yes');
                  setError(false);
                }}
              />
              
              <Option 
                value="no"
                label="No"
                selected={selectedOption === 'no'}
                onPress={() => {
                  setSelectedOption('no');
                  setError(false);
                }}
              />
            </View>
          </Animated.View>
          
          {showAnimeTags && (
            <Animated.View style={[styles.animeTagsSection, animeShakeStyle]}>
              <Text style={styles.animeTagsTitle}>Select your favourite anime</Text>
              
              <Animated.Text 
                style={[
                  styles.errorText, 
                  {opacity: animeErrorOpacity}
                ]}
              >
                Please select an anime
              </Animated.Text>
              
              <View style={styles.animeTagsContainer}>
                {animeTags.map((tag) => (
                  <AnimeTag 
                    key={tag.value}
                    tag={tag}
                    selected={selectedAnime === tag.value}
                    onPress={() => {
                      setSelectedAnime(tag.value);
                      setAnimeError(false);
                    }}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              loaderType="BarIndicator"
              title="Continue"
              onPress={savePreference}
              loading={loading}
              buttonStyle={{
                backgroundColor: colors.red,
                borderRadius: 10,
                elevation: 5,
              }}
              textStyle={{
                fontWeight: 'bold',
                fontSize: hp(1.8),
                color: colors.lightText,
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
  
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
    paddingHorizontal: wp(5),
    paddingTop: 44,
  },
  content: {
    flex: 1,
    paddingTop: hp(6),
    paddingBottom: hp(5),
    justifyContent: 'space-between',
  },
  headerSection: {
    marginBottom: hp(3),
  },
  welcomeText: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeSmallText: {
    fontSize: hp(3.3),
    fontWeight: theme.fonts.bold,
    color: colors.lightText,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: hp(1.5),
    color: colors.lightText,
    marginTop: hp(1),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  questionSection: {
    marginBottom: hp(3),
  },
  questionText: {
    fontSize: hp(2.5),
    fontWeight: '600',
    color: colors.lightText,
    marginBottom: hp(1.5),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  errorText: {
    fontSize: hp(1.5),
    color: colors.errorColor,
    marginBottom: hp(2),
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(6),
    marginTop: hp(1),
  },
  optionButton: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp(25),
  },
  optionSelected: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  optionError: {
    borderColor: colors.errorColor,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: hp(2),
    color: colors.lightText,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  animeTagsSection: {
    marginVertical: hp(3),
  },
  animeTagsTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: colors.lightText,
    marginBottom: hp(1.5),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  animeTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: wp(3),
    marginTop: hp(1),
  },
  animeTag: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderRadius: wp(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },
  animeTagSelected: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  animeTagError: {
    borderColor: colors.errorColor,
    borderWidth: 1.5,
  },
  animeTagText: {
    fontSize: hp(1.8),
    color: colors.lightText,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  animeTagTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: hp(3),
  },
});
  
export default AnimeFanPage;