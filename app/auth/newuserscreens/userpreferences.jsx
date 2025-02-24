import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import theme from '@/constants/theme';
import { hp, wp } from '@/helpers/common';
import { GENRES, LANGUAGES } from '@/constants/preference';
import { getUserPreferences, updateUserPreferences } from '../../../services/userPreferances';

const PreferenceChip = ({ label, selected, onPress }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[
      styles.chip,
      selected && styles.chipSelected
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

  useEffect(() => {
    loadUserPreferences();
  }, []);

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

  const savePreferences = async () => {
    if (selectedGenres.length === 0 || selectedLanguages.length === 0) {
      Alert.alert('Preferences Required', 'Please select at least one genre and language');
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
      
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Set Your Preferences</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your Favorite Genres</Text>
          <Text style={styles.sectionSubtitle}>Choose the types of content you enjoy watching</Text>
          <View style={styles.chipContainer}>
            {GENRES.map(genre => (
              <PreferenceChip
                key={genre}
                label={genre}
                selected={selectedGenres.includes(genre)}
                onPress={() => toggleGenre(genre)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Languages</Text>
          <Text style={styles.sectionSubtitle}>Select languages you're comfortable with</Text>
          <View style={styles.chipContainer}>
            {LANGUAGES.map(language => (
              <PreferenceChip
                key={language}
                label={language}
                selected={selectedLanguages.includes(language)}
                onPress={() => toggleLanguage(language)}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Save Preferences"
            onPress={savePreferences}
            loading={loading}
          />
        </View>
      </View>
    </ScrollView>
  );
};
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
    },
    content: {
      padding: wp(5),
      marginTop: hp(12),
    },
    title: {
      fontSize: hp(3),
      fontWeight: 'bold',
      marginBottom: hp(3),
      color: theme.colors.text,
    },
    section: {
      marginBottom: hp(4),
    },
    sectionTitle: {
      fontSize: hp(2),
      fontWeight: '600',
      marginBottom: hp(1),
      color: theme.colors.text,
    },
    sectionSubtitle: {
      fontSize: hp(1.6),
      color: theme.colors.textLight,
      marginBottom: hp(2),
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
      borderColor: theme.colors.border,
      marginBottom: hp(1),
    },
    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      fontSize: hp(1.6),
      color: theme.colors.text,
    },
    chipTextSelected: {
      color: 'white',
    },
    buttonContainer: {
      marginTop: hp(3),
    },
  });
  
  export default UserPreferences;