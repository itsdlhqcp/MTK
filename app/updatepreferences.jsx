import { View, StyleSheet, Text, TouchableOpacity, StatusBar as RNStatusBar, Animated, FlatList, useColorScheme } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { hp, wp } from '@/helpers/common';
import { GENRES, LANGUAGES } from '@/constants/preference';
import { getUserPreferences, updateUserPreferences } from '../services/userPreferances';
import { StatusBar } from 'expo-status-bar';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/Feather';
import CustomDotIndicator from "../components/CutomDotIndicator";
import ScreenWrapper from '../components/ScreenWrapper';
import { useToast } from '../contexts/ToastContext';

const getColors = (isDark) => ({
  primary: '#E4405F', 
  secondary: '#833AB4',
  background: isDark ? '#000000' : '#FFFFFF',
  surface: isDark ? '#1C1C1E' : '#F8F9FA', 
  cardBackground: isDark ? '#2C2C2E' : '#FFFFFF',
  border: isDark ? '#38383A' : '#E1E8ED',
  textPrimary: isDark ? '#FFFFFF' : '#262626',
  textSecondary: isDark ? '#AEAEB2' : '#8E8E93', 
  textMuted: isDark ? '#8E8E93' : '#C7C7CC',
  accent: '#0095F6',
  success: '#30D158', 
  error: '#FF453A', 
  shadow: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', 
  overlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
});

const PreferenceChip = ({ label, selected, onPress, error, colors }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[
      styles.chip,
      { 
        borderColor: error ? colors.error : colors.border,
        backgroundColor: selected ? colors.primary : colors.surface,
        borderWidth: error ? 1.5 : 1.5,
      }
    ]}
  >
    <Text style={[
      styles.chipText,
      { 
        color: selected ? colors.background : colors.textPrimary,
        fontWeight: selected ? '600' : '500'
      }
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const UpdateUserPreferences = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Store original values to check for changes
  const [originalGenres, setOriginalGenres] = useState([]);
  const [originalLanguages, setOriginalLanguages] = useState([]);
  
  // Error state for validation
  const [genreError, setGenreError] = useState(false);
  const [languageError, setLanguageError] = useState(false);
  
  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Animation values for shake effect
  const genreShakeAnimation = useRef(new Animated.Value(0)).current;
  const languageShakeAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation values for error messages
  const genreErrorOpacity = useRef(new Animated.Value(0)).current;
  const languageErrorOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation for success message
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Check for changes whenever selections change
  useEffect(() => {
    const currentGenres = Array.isArray(selectedGenres) ? [...selectedGenres].sort() : [];
    const origGenres = Array.isArray(originalGenres) ? [...originalGenres].sort() : [];
    const currentLanguages = Array.isArray(selectedLanguages) ? [...selectedLanguages].sort() : [];
    const origLanguages = Array.isArray(originalLanguages) ? [...originalLanguages].sort() : [];
    
    const genresChanged = JSON.stringify(currentGenres) !== JSON.stringify(origGenres);
    const languagesChanged = JSON.stringify(currentLanguages) !== JSON.stringify(origLanguages);
    const hasChangesNow = genresChanged || languagesChanged;
    
    setHasChanges(hasChangesNow);
  }, [selectedGenres, selectedLanguages, originalGenres, originalLanguages, hasChanges]);

  // Reset error when user selects enough items
  useEffect(() => {
    if (Array.isArray(selectedGenres) && selectedGenres.length >= 2) {
      setGenreError(false);
      Animated.timing(genreErrorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [selectedGenres]);

  useEffect(() => {
    if (Array.isArray(selectedLanguages) && selectedLanguages.length >= 2) {
      setLanguageError(false);
      Animated.timing(languageErrorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [selectedLanguages]);

  const loadUserPreferences = async () => {
    if (!user?.id) {
      setInitialLoading(false);
      return;
    }
    
    try {
      setInitialLoading(true);
      const response = await getUserPreferences(user.id);
      
      if (response.success && response.data) {
        // Parse JSON strings back to arrays
        let genres = [];
        let languages = [];
        
        // Handle genres
        if (response.data.genere) {
          if (Array.isArray(response.data.genere)) {
            genres = response.data.genere;
          } else if (typeof response.data.genere === 'string') {
            try {
              genres = JSON.parse(response.data.genere);
            } catch (e) {
              console.error('Error parsing genres:', e);
              genres = [];
            }
          }
        }
        
        // Handle languages
        if (response.data.languages) {
          if (Array.isArray(response.data.languages)) {
            languages = response.data.languages;
          } else if (typeof response.data.languages === 'string') {
            try {
              languages = JSON.parse(response.data.languages);
            } catch (e) {
              console.error('Error parsing languages:', e);
              languages = [];
            }
          }
        }
        
        setSelectedGenres(genres);
        setSelectedLanguages(languages);
        setOriginalGenres(genres);
        setOriginalLanguages(languages);
      } else {
        // If no preferences found, initialize with empty arrays
        setSelectedGenres([]);
        setSelectedLanguages([]);
        setOriginalGenres([]);
        setOriginalLanguages([]);
        
        showToast('info', 'No preferences found. Please set up your preferences.');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      showToast('error', 'Failed to load your current preferences. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      const newGenres = prevArray.includes(genre)
        ? prevArray.filter(g => g !== genre)
        : [...prevArray, genre];
      
      // Show toast for individual genre changes
      if (prevArray.includes(genre)) {
        showToast('info', `Removed ${genre} from your preferences`);
      } else {
        showToast('success', `Added ${genre} to your preferences`);
      }
      
      return newGenres;
    });
  };

  const toggleLanguage = (language) => {
    setSelectedLanguages(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      const newLanguages = prevArray.includes(language)
        ? prevArray.filter(l => l !== language)
        : [...prevArray, language];
      
      // Show toast for individual language changes
      if (prevArray.includes(language)) {
        showToast('info', `Removed ${language} from your preferences`);
      } else {
        showToast('success', `Added ${language} to your preferences`);
      }
      
      return newLanguages;
    });
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
    
    if (!Array.isArray(selectedGenres) || selectedGenres.length < 2) {
      setGenreError(true);
      shakeAndShowError(genreShakeAnimation, genreErrorOpacity);
      showToast('error', 'Please select at least 2 genres');
      isValid = false;
    } else {
      setGenreError(false);
    }
    
    if (!Array.isArray(selectedLanguages) || selectedLanguages.length < 2) {
      setLanguageError(true);
      shakeAndShowError(languageShakeAnimation, languageErrorOpacity);
      showToast('error', 'Please select at least 2 languages');
      isValid = false;
    } else {
      setLanguageError(false);
    }
    
    return isValid;
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();

    // Hide success message after 3 seconds
    setTimeout(() => {
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setShowSuccess(false);
      });
    }, 3000);
  };

  const updatePreferences = async () => {
    if (!validatePreferences()) {
      return;
    }

    if (!hasChanges) {
      showToast('info', 'You haven\'t made any changes to your preferences.');
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
        throw new Error(response.msg || 'Failed to update preferences');
      }
      
      // Update original values to reflect the saved state
      setOriginalGenres([...selectedGenres]);
      setOriginalLanguages([...selectedLanguages]);
      setHasChanges(false);
      
      showSuccessMessage();
      showToast('success', 'Preferences updated successfully!');
      
    } catch (error) {
      console.error('Error updating preferences:', error);
      showToast('error', error.message || 'Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPreferences = () => {
    
    // Using setTimeout to simulate confirmation (you might want to implement a proper confirmation modal)
    setTimeout(() => {
      const safeGenres = Array.isArray(originalGenres) ? originalGenres : [];
      const safeLanguages = Array.isArray(originalLanguages) ? originalLanguages : [];
      setSelectedGenres([...safeGenres]);
      setSelectedLanguages([...safeLanguages]);
      setGenreError(false);
      setLanguageError(false);
      showToast('info', 'Preferences reset to original values');
    }, 1000);
  };

  // Generate transform styles for shake animation
  const genreShakeStyle = {
    transform: [{ translateX: genreShakeAnimation }]
  };
  
  const languageShakeStyle = {
    transform: [{ translateX: languageShakeAnimation }]
  };

  if (initialLoading) {
    return (
      <View style={[styles.mainContainer, styles.centerContainer, { backgroundColor: colors.background }]}>
          <CustomDotIndicator count={55} size={18}/>
      </View>
    );
  }

  return (
    <ScreenWrapper bg={colors.background}> 
      <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        
        {/* Header with Save Button */}
        <Header
          title="Update Preferences"
          showBackButton={true}
          rightIcon={hasChanges ? (
            <TouchableOpacity 
              onPress={updatePreferences} 
              disabled={loading}
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              <Icon name="check" size={28} color="white" />
            </TouchableOpacity>
          ) : null}
        />
        
        {/* Success Message */}
        {showSuccess && (
          <Animated.View style={[styles.successContainer, { opacity: successOpacity }]}>
            <View style={[styles.successMessage, { backgroundColor: colors.success }]}>
              <Icon name="check-circle" size={24} color={colors.background} />
              <Text style={[styles.successText, { color: colors.background }]}>Preferences updated successfully!</Text>
            </View>
          </Animated.View>
        )}
        
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Subtitle */}
            <View style={styles.header}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Modify your interests to get better recommendations
              </Text>
            </View>
            
            {/* Genres Section */}
            <Animated.View style={[styles.section, genreShakeStyle]}>
              <View style={[styles.sectionCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Favorite Genres</Text>
                  <Text style={[styles.selectionCounter, { color: colors.textSecondary }]}>
                    {Array.isArray(selectedGenres) ? selectedGenres.length : 0} selected
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Tell us what you love to watch</Text>
                
                <Animated.Text 
                  style={[
                    styles.errorText, 
                    { opacity: genreErrorOpacity, color: colors.error }
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
                      colors={colors}
                    />
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* Languages Section */}
            <Animated.View style={[styles.section, languageShakeStyle]}>
              <View style={[styles.sectionCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferred Languages</Text>
                  <Text style={[styles.selectionCounter, { color: colors.textSecondary }]}>
                    {Array.isArray(selectedLanguages) ? selectedLanguages.length : 0} selected
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Your preferred watch languages</Text>
                
                <Animated.Text 
                  style={[
                    styles.errorText, 
                    { opacity: languageErrorOpacity, color: colors.error }
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
                      colors={colors}
                    />
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* Reset Button */}
            {hasChanges && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.resetButton, { 
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }]}
                  onPress={resetPreferences}
                >
                  <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset Changes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default UpdateUserPreferences;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  content: {
    flex: 1,
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  header: {
    marginBottom: hp(3),
  },
  loadingText: {
    fontSize: hp(2),
    textAlign: 'center',
  },
  successContainer: {
    position: 'absolute',
    left: wp(5),
    right: wp(5),
    zIndex: 1000,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderRadius: 12,
    gap: wp(2),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  successText: {
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  subtitle: {
    fontSize: hp(1.6),
    fontWeight: '400',
    textAlign: 'center',
  },
  section: {
    marginBottom: hp(2.5),
  },
  sectionCard: {
    borderRadius: 16,
    padding: wp(4),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '600',
  },
  selectionCounter: {
    fontSize: hp(1.4),
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: hp(1.5),
    marginBottom: hp(1.5),
  },
  errorText: {
    fontSize: hp(1.4),
    marginBottom: hp(1),
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  chip: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    borderRadius: 20,
    marginBottom: hp(1),
  },
  chipText: {
    fontSize: hp(1.5),
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: hp(2),
    alignItems: 'center',
  },
  resetButton: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: 12,
    borderWidth: 1.5,
  },
  resetButtonText: {
    fontSize: hp(1.6),
    textAlign: 'center',
    fontWeight: '600',
  },
});