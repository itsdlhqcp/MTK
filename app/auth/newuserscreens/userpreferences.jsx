import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, StatusBar as RNStatusBar, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import theme from '@/constants/theme';
import { hp, wp } from '@/helpers/common';
import { GENRES, LANGUAGES } from '@/constants/preference';
import { getUserPreferences, updateUserPreferences } from '../../../services/userPreferances';
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

const PreferenceChip = ({ label, selected, onPress, error }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[
      styles.chip,
      selected && styles.chipSelected,
      error && styles.chipError
    ]}
  >
    <Text style={[
      styles.chipText,
      selected && styles.chipTextSelected
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const UserPreferences = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  
  // Error state for validation
  const [genreError, setGenreError] = useState(false);
  const [languageError, setLanguageError] = useState(false);
  
  // Animation values for shake effect
  const genreShakeAnimation = useRef(new Animated.Value(0)).current;
  const languageShakeAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation values for error messages
  const genreErrorOpacity = useRef(new Animated.Value(0)).current;
  const languageErrorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Reset error when user selects enough items
  useEffect(() => {
    if (selectedGenres.length >= 2) {
      setGenreError(false);
      Animated.timing(genreErrorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [selectedGenres]);

  useEffect(() => {
    if (selectedLanguages.length >= 2) {
      setLanguageError(false);
      Animated.timing(languageErrorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [selectedLanguages]);

  const loadUserPreferences = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const response = await getUserPreferences(user.id);
    if (response.success) {
      setSelectedGenres(response.data.genere || []);
      setSelectedLanguages(response.data.languages || []);
    }
    setLoading(false);
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleLanguage = (language) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const shakeAndShowError = (animationRef, opacityRef) => {
    // Reset animation value
    animationRef.setValue(0);
    
    // Fade in error message
    Animated.timing(opacityRef, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Shake animation sequence
    Animated.sequence([
      Animated.timing(animationRef, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animationRef, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animationRef, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animationRef, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animationRef, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  const validatePreferences = () => {
    let isValid = true;
    
    if (selectedGenres.length < 2) {
      setGenreError(true);
      shakeAndShowError(genreShakeAnimation, genreErrorOpacity);
      isValid = false;
    } else {
      setGenreError(false);
    }
    
    if (selectedLanguages.length < 2) {
      setLanguageError(true);
      shakeAndShowError(languageShakeAnimation, languageErrorOpacity);
      isValid = false;
    } else {
      setLanguageError(false);
    }
    
    return isValid;
  };

  const savePreferences = async () => {
    if (!validatePreferences()) {
      return;
    }

    try {
      setLoading(true);
      const response = await updateUserPreferences(user.id, {
        genere: selectedGenres,
        languages: selectedLanguages,
        is_new_user: false
      });

      if (!response.success) {
        throw new Error(response.msg);
      }
      
      router.replace('/auth/newuserscreens/animefan');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate transform styles for shake animation
  const genreShakeStyle = {
    transform: [{ translateX: genreShakeAnimation }]
  };
  
  const languageShakeStyle = {
    transform: [{ translateX: languageShakeAnimation }]
  };

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
      
      <View style={styles.container}>
        <BackButton router={router} iconColor={colors.lightText} />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View>
              <Text style={styles.welcomeText}>
                <Text style={{color: colors.red}}>Set Your</Text>
              </Text>
              <Text style={styles.welcomeSmallText}>Preferences</Text>
              <Text style={styles.subtitle}>
              Customize your experience to match your personal interests
              </Text>
            </View>
            
            <Animated.View style={[styles.section, genreShakeStyle]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Favorite Genres</Text>
                {/* <Text style={styles.selectionCounter}>
                  {selectedGenres.length}/2 minimum
                </Text> */}
              </View>
              <Text style={styles.sectionSubtitle}>Tell us what you love to watch</Text>
              
              <Animated.Text 
                style={[
                  styles.errorText, 
                  {opacity: genreErrorOpacity}
                ]}
              >
                Please select at least 2 genres
              </Animated.Text>
              
              <View style={styles.chipContainer}>
                {GENRES.map(genre => (
                  <PreferenceChip
                    key={genre}
                    label={genre}
                    selected={selectedGenres.includes(genre)}
                    onPress={() => toggleGenre(genre)}
                    error={genreError}
                  />
                ))}
              </View>
            </Animated.View>

            <Animated.View style={[styles.section, languageShakeStyle]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Preferred Languages</Text>
                {/* <Text style={styles.selectionCounter}>
                  {selectedLanguages.length}/2 minimum
                </Text> */}
              </View>
              <Text style={styles.sectionSubtitle}>Your preferred watch languages</Text>
              
              <Animated.Text 
                style={[
                  styles.errorText, 
                  {opacity: languageErrorOpacity}
                ]}
              >
                Please select at least 2 languages
              </Animated.Text>
              
              <View style={styles.chipContainer}>
                {LANGUAGES.map(language => (
                  <PreferenceChip
                    key={language}
                    label={language}
                    selected={selectedLanguages.includes(language)}
                    onPress={() => toggleLanguage(language)}
                    error={languageError}
                  />
                ))}
              </View>
            </Animated.View>

            <View style={styles.buttonContainer}>
              <Button
                loaderType="BarIndicator"
                title="Save Preferences"
                onPress={savePreferences}
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
    paddingTop: 32,
  },
  content: {
    paddingTop: hp(6),
    paddingBottom: hp(5),
    gap: hp(4),
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
  section: {
    marginBottom: hp(2),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: colors.lightText,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  selectionCounter: {
    fontSize: hp(1.5),
    color: colors.lightText,
    opacity: 0.8,
  },
  sectionSubtitle: {
    fontSize: hp(1.6),
    color: 'rgba(224, 224, 224, 0.7)',
    marginBottom: hp(1),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  errorText: {
    fontSize: hp(1.5),
    color: colors.errorColor,
    marginBottom: hp(1),
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  chip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: wp(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: hp(1),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipSelected: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  chipError: {
    borderColor: colors.errorColor,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: hp(1.6),
    color: colors.lightText,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  chipTextSelected: {
    color: 'white',
  },
  buttonContainer: {
    marginTop: hp(4),
  },
});
  
export default UserPreferences;