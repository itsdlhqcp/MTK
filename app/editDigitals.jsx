import { View, Text, StyleSheet, ScrollView, Alert, Image, Pressable } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import theme from '../constants/theme'
import Button from '@/components/Button'
import DatePicker from '../components/DatePicker'
import TagInput from '../components/OttTagInput'
import { fetchDigitalById, updateDigital } from '../services/ottService'

const EditDigital = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [tags, setTags] = useState([]);
  const [digitalData, setDigitalData] = useState(null);
  const [dataFetched, setDataFetched] = useState(false); // Add a flag to track if data has been fetched
  
  // Define OTT platforms list
  const ottPlatforms = [
    'netflix', 'prime', 'disney', 'hbo', 'hulu', 'amc', 'zee5', 'sonyliv', 
    'paramountplus', 'appletvplus', 'hotstar', 'voot', 'aha', 'sunnxt', 
    'appletv', 'paramountx', 'peacocktv'
  ];
  
  // Use useCallback to memoize the fetchDigitalData function
  const fetchDigitalData = useCallback(async (id) => {
    if (!id || dataFetched) return; // Skip if no id or data already fetched
    
    try {
      setLoadingData(true);
      const response = await fetchDigitalById(id);
      
      if(response.success) {
        setDigitalData(response.data);
        
        // Set initial values
        if(response.data.rDate) {
          setSelectedDate(new Date(response.data.rDate));
        }
        
        if(response.data.endDate) {
          setSelectedEndDate(new Date(response.data.endDate));
        }
        
        if(response.data.tags) {
          setTags(Array.isArray(response.data.tags) ? response.data.tags : []);
        }
      } else {
        Alert.alert('Error', 'Failed to fetch digital data');
      }
    } catch (error) {
      console.error('Error fetching digital data:', error);
      Alert.alert('Error', 'An error occurred while fetching data');
    } finally {
      setLoadingData(false);
      setDataFetched(true); // Mark data as fetched
    }
  }, [dataFetched]);

  // Fetch the digital item data when component mounts
  useEffect(() => {
    if(params && params.id) {
      fetchDigitalData(params.id);
    } else {
      setLoadingData(false);
      Alert.alert('Error', 'No digital item specified');
    }
  }, [params?.id, fetchDigitalData]); // Use params.id instead of the entire params object

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleEndDateSelect = (date) => {
    setSelectedEndDate(date);
  };

  // Handle OTT platform selection
  const handleOttPlatformSelect = (platform) => {
    // Check if we already have 2 tags
    if (tags.length >= 2 && !tags.includes(platform)) {
      Alert.alert('Limit Reached', 'You can only add up to 2 tags');
      return;
    }
    
    // Add the platform to tags if it's not already there, otherwise remove it
    if (tags.includes(platform)) {
      setTags(tags.filter(tag => tag !== platform));
    } else {
      setTags([...tags, platform]);
    }
  };

  const onSubmit = async () => {
    if (!digitalData) {
      Alert.alert('Error', 'No digital data to update');
      return;
    }

    // Prepare data for update
    const updatedData = {
      id: digitalData.id,
      rDate: selectedDate,
      endDate: selectedEndDate,
      tags: tags
    };

    setLoading(true);
    try {
      const res = await updateDigital(updatedData);
      setLoading(false);
      
      if(res.success) {
        Alert.alert('Success', 'Digital item updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Update Failed', res.msg || 'Failed to update digital item');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error updating digital:', error);
      Alert.alert('Error', 'An error occurred while updating');
    }
  };

  // Show loading indicator while fetching data
  if(loadingData) {
    return (
      <ScreenWrapper bg="white">
        <Header title="Edit Digital" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading digital data...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Component for OTT platform pills
  const OttPlatformPills = () => {
    return (
      <View style={styles.pillsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ottPlatforms.map((platform, index) => (
            <Pressable 
              key={index} 
              style={[
                styles.pill, 
                tags.includes(platform) && styles.pillSelected
              ]}
              onPress={() => handleOttPlatformSelect(platform)}
            >
              <Text style={[
                styles.pillText, 
                tags.includes(platform) && styles.pillTextSelected
              ]}>
                {platform}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScreenWrapper bg="white">
      <Header title="Edit Digital" showBackButton={true} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
          {digitalData && (
            <View style={styles.infoContainer}>
              <Text style={styles.titleText}>
                {digitalData.body ? digitalData.body.replace(/<[^>]*>/g, '').substring(0, 50) + '...' : 'Digital Item'}
              </Text>
            </View>
          )}
          
          <View>
            <Text style={styles.sectionTitle}>Release Date</Text>
            <DatePicker 
              onDateSelect={handleDateSelect}
              initialDate={selectedDate}
              label="Select Release Date"
            />
          </View>
          
          <View>
            <Text style={styles.sectionTitle}>End Date</Text>
            <DatePicker 
              onDateSelect={handleEndDateSelect}
              initialDate={selectedEndDate}
              label="Select End Date"
            />
          </View>
          
          <View>
            <Text style={styles.sectionTitle}>Tags - removal now not supported(max 2 only)</Text>
            <TagInput tags={tags} setTags={setTags} />
            
            <View style={{marginTop: 12}}>
              <Text style={styles.platformTitle}>Select OTT Platform:</Text>
              <OttPlatformPills />
            </View>
          </View>
        </ScrollView>
        
        <Button
          buttonStyle={{ height: hp(6.2) }}
          title="Update Digital Item"
          loading={loading}
          onPress={onSubmit}
          hasShadow={false}
        />
      </View>
    </ScreenWrapper>
  );
};

export default EditDigital;

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: wp(4), 
    gap: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
  infoContainer: {
    padding: 15,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  titleText: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  platformTitle: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pillSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
  },
  pillTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.medium,
  },
});