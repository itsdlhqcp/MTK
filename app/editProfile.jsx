import React, { useEffect, useState, useRef } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../contexts/AuthContext';
import { getImageSrc, uploadProfileImage } from '../services/userProfileImage';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from '@/assets/icons';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '@/components/Button';
import { updateUser } from '../services/userServices';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import PhoneVerification from '../components/MobileVerification';

// Pre-defined tags that users can select from
const PREDEFINED_TAGS = [
 "Reviewer",
 "Content Creator",
 "Editor",
 "Business"
];

// TagInput Component
const TagInput = ({ tags = [], setTags }) => { 
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef();
    const MAX_TAGS = 2;
    const MAX_TAG_LENGTH = 15; // Increased length to accommodate predefined tags
  
    const handleAddTag = () => {
        setError('');
        const cleanedTag = inputValue.trim().toLowerCase();
        if (!cleanedTag) {
          setError('Tag cannot be empty');
          return;
        }
        // Ensure tags is an array before checking includes
        const currentTags = Array.isArray(tags) ? tags : [];
        
        // Validation checks
        if (currentTags.length >= MAX_TAGS) {
          setError(`Maximum ${MAX_TAGS} tags allowed.`);
          return;
        }

        if (currentTags.includes(cleanedTag)) {
          setError('This tag already exists.');
          return;
        }
        if (cleanedTag.length > MAX_TAG_LENGTH) {
          setError(`Tag must be less than ${MAX_TAG_LENGTH} characters.`);
          return;
        }
        setTags([...currentTags, cleanedTag]);
        setInputValue('');
        inputRef.current?.focus();
    };
  
    const removeTag = (tagToRemove) => {
        setError('');
        // Ensure tags is an array before filtering
        const currentTags = Array.isArray(tags) ? tags : [];
        setTags(currentTags.filter((tag) => tag !== tagToRemove));
    };

    // Add character limit handler
    const handleInputChange = (text) => {
      setError(''); // Clear error when typing
      if (text.length <= MAX_TAG_LENGTH) {
        setInputValue(text);
      }
    }
    
    // Add a predefined tag when clicked
    const handlePredefinedTagClick = (predefinedTag) => {
      setError('');
      const cleanedTag = predefinedTag.toLowerCase();
      
      // Ensure tags is an array before checking includes
      const currentTags = Array.isArray(tags) ? tags : [];
      
      if (currentTags.length >= MAX_TAGS) {
        setError(`Maximum ${MAX_TAGS} tags allowed.`);
        return;
      }
      
      if (currentTags.includes(cleanedTag)) {
        setError('This tag already exists.');
        return;
      }
      
      setTags([...currentTags, cleanedTag]);
    };

    return (
      <View style={styles.tagContainer}>
        <View style={styles.tagsRow}>
          {Array.isArray(tags) && tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity 
                onPress={() => removeTag(tag)} 
                style={styles.removeTag}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Text style={styles.removeTagText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TextInput
            ref={inputRef}
            value={inputValue}
            onChangeText={handleInputChange}
            style={styles.tagInput}
            placeholder={tags.length >= MAX_TAGS ? "" : "Add a tag"}
            placeholderTextColor="#888"
            returnKeyType="done"
            onSubmitEditing={handleAddTag}
            maxLength={MAX_TAG_LENGTH}
            editable={tags.length < MAX_TAGS}
          />
          <TouchableOpacity 
            onPress={handleAddTag} 
            style={[
              styles.addButton,
              (!inputValue.trim() || tags.length >= MAX_TAGS) && styles.addButtonDisabled
            ]}
            disabled={!inputValue.trim() || tags.length >= MAX_TAGS}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.helperText}>
            {`${MAX_TAGS - (tags?.length || 0)} tags remaining (max ${MAX_TAG_LENGTH} chars each)`}
          </Text>
        )}
        
        {/* Predefined Tags Section */}
        <View style={styles.predefinedTagsContainer}>
          <Text style={styles.predefinedTagsTitle}>Suggested Tags:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.predefinedTagsScroll}
          >
            {PREDEFINED_TAGS.map((predefinedTag, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.predefinedTag,
                  tags.includes(predefinedTag.toLowerCase()) && styles.predefinedTagSelected
                ]}
                onPress={() => handlePredefinedTagClick(predefinedTag)}
                disabled={tags.includes(predefinedTag.toLowerCase()) || tags.length >= MAX_TAGS}
              >
                <Text 
                  style={[
                    styles.predefinedTagText,
                    tags.includes(predefinedTag.toLowerCase()) && styles.predefinedTagTextSelected
                  ]}
                >
                  {predefinedTag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View> 
    );
};
  
// EditProfile Component
const EditProfile = () => {
    const { user: currentUser, updateUserContext } = useAuth();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [user, setUser] = useState({
      name: '',
      phoneNumber: '',
      address: '',
      image: '',
      bio: '',
      tags: [],
    });
    
    // Form validation state
    const [errors, setErrors] = useState({
      name: '',
      address: '',
      bio: '',
      image: '',
      tags: '',
    });

    useEffect(() => {
        if (currentUser) {
            // Parse tags if they're stored as a string
            let userTags = currentUser.tags;
            if (typeof userTags === 'string') {
                try {
                    userTags = JSON.parse(userTags);
                } catch (e) {
                    console.log("Error parsing tags:", e);
                    userTags = [];
                }
            } else if (!Array.isArray(userTags)) {
                userTags = [];
            }
            
            setUser({
                name: currentUser.name || '',
                phoneNumber: currentUser.phoneNumber || '',
                address: currentUser.address || '',
                image: currentUser.image || null,
                bio: currentUser.bio || '',
                tags: userTags, // Set the parsed tags
            });
        }
    }, [currentUser]);

    const validateForm = () => {
      let isValid = true;
      const newErrors = {
        name: '',
        address: '',
        bio: '',
        image: '',
        tags: '',
      };

      // Name validation
      if (!user.name.trim()) {
        newErrors.name = 'Name is required';
        isValid = false;
      } else if (user.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
        isValid = false;
      }

      // Address validation
      if (!user.address.trim()) {
        newErrors.address = 'Address is required';
        isValid = false;
      }

      // Bio validation
      if (!user.bio.trim()) {
        newErrors.bio = 'Bio is required';
        isValid = false;
      } else if (user.bio.trim().length < 10) {
        newErrors.bio = 'Bio must be at least 10 characters';
        isValid = false;
      }

      // Image validation
      if (!user.image) {
        newErrors.image = 'Profile image is required';
        isValid = false;
      }

      // Tags validation
      if (!Array.isArray(user.tags) || user.tags.length === 0) {
        newErrors.tags = 'At least one tag is required';
        isValid = false;
      }

      setErrors(newErrors);
      return isValid;
    };

    const onPickImage = async () => {
        try {
          let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.7,
          });
          
          if (!result.canceled) {
              setUser({...user, image: result.assets[0]});
              // Clear image error if it exists
              if (errors.image) {
                setErrors({...errors, image: ''});
              }
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to pick image');
        }
    };
      
    const onSubmit = async () => {
        // Validate all fields
        if (!validateForm()) {
          Alert.alert('Validation Error', 'Please fix the errors before submitting');
          return;
        }
        
        try {
          setLoading(true);
          const updatedUserData = {
            name: user.name,
            phoneNumber: user.phoneNumber,
            address: user.address,
            bio: user.bio,
            tags: user.tags,
            image: user.image
          };
      
          if (typeof user.image === 'object') {
            // update the image
            let imageRes = await uploadProfileImage('profiles', true, user.image?.uri);
            if (imageRes.success) {
              updatedUserData.image = imageRes.data;
            } else {
              throw new Error('Failed to upload image');
            }
          }
      
          const res = await updateUser(currentUser?.id, updatedUserData);
          
          if (res) {
            updateUserContext({
              ...currentUser,
              ...updatedUserData
            });
            router.back();
            Alert.alert('Success', 'Profile updated successfully');
          }
        } catch (error) {
          Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
          setLoading(false);
        }
      };
   
    const imageSource = user.image 
        ? (typeof user.image === 'object' && user.image.uri 
            ? { uri: user.image.uri }  // Local image
            : getImageSrc(user.image)) // Remote or default image
        : require('../assets/images/defaultUser.png');  // Fallback

    // Input change handler with validation
    const handleInputChange = (field, value) => {
      setUser({...user, [field]: value});
      
      // Clear error when typing
      if (errors[field]) {
        setErrors({...errors, [field]: ''});
      }
    };

    return (
      <ScreenWrapper bg="#121212"> {/* Dark background */}
          <Header title="Edit Profile" showBackButton={true} titleStyle={{color: "#fff"}} />
        <View style={styles.container}>
          <ScrollView 
             style={{ flex: 1 }}
             showsVerticalScrollIndicator={false}
             >
            <View style={styles.form}>
              <View style={styles.avatarContainer}>
                <Image source={imageSource} style={styles.avatar} />
                <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                  <Icon name="camera" strokeWidth={2.5} size={hp(3)} color={theme.colors.text} />
                </Pressable>
              </View>
              {errors.image ? (
                <Text style={styles.errorText}>{errors.image}</Text>
              ) : null}
              <Text style={styles.formHeading}>
                Please fill your profile details
              </Text>
              <Input
                icon={<Icon name="user" color="#fff" />}
                placeholder="Enter your name"
                value={user.name}
                onChangeText={(value) => handleInputChange('name', value)}
                inputStyle={errors.name ? styles.inputError : null}
              />
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
              
              {/* <PhoneVerification /> */}
              
              <Input
                icon={<Icon name="location" color="#fff" />}
                placeholder="Enter your Home Town"
                value={user.address}
                onChangeText={(value) => handleInputChange('address', value)}
                inputStyle={errors.address ? styles.inputError : null}
              />
              {errors.address ? (
                <Text style={styles.errorText}>{errors.address}</Text>
              ) : null}
              
              <Input
                placeholder="Write your bio ..... "
                value={user.bio}
                multiline={true}
                containerStyle={styles.bio}
                inputStyle={errors.bio ? styles.inputError : null}
                onChangeText={(value) => handleInputChange('bio', value)}
              />
              {errors.bio ? (
                <Text style={styles.errorText}>{errors.bio}</Text>
              ) : null}
              
              <TagInput 
                tags={user.tags} 
                setTags={(newTags) => {
                  setUser({ ...user, tags: newTags });
                  if (errors.tags && newTags.length > 0) {
                    setErrors({...errors, tags: ''});
                  }
                }} 
              />
              {errors.tags ? (
                <Text style={styles.errorText}>{errors.tags}</Text>
              ) : null}
              
              <Button 
                title="Update" 
                loading={loading} 
                onPress={onSubmit} 
                style={styles.updateButton}
              />
            </View>
          </ScrollView>
        </View>
      </ScreenWrapper>
    );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    backgroundColor: '#121212', // Dark background
    color: '#fff',
  },
  avatarContainer: {
    height: hp(14),
    width: hp(14),
    alignSelf: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.xxl * 1.8,
    borderWidth: 1,
    borderColor: '#444', // Darker border for dark theme
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#333', // Darker icon background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 7,
  },
  form: {
    gap: 12,
    marginTop: 20,
    paddingBottom: 40,
  },
  bio: {
    flexDirection: 'row',
    height: hp(15),
    alignItems: 'flex-start',
    paddingVertical: 15,
    backgroundColor: '#1E1E1E', // Darker input background
    borderColor: '#444',
    borderWidth: 0.4,
    borderRadius: theme.radius.xxl,
  },
  formHeading: {
    fontSize: hp(1.5),
    color: '#E0E0E0', // Light text for dark theme
    marginBottom: 10,
    textAlign: 'center',
  },
  tagContainer: {
    marginVertical: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#444', // Darker border
    borderRadius: theme.radius.sm,
    padding: 8,
    backgroundColor: '#1E1E1E', // Darker background
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C3E50', // Darker tag background
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 14,
    color: '#E0E0E0', // Light text
  },
  removeTag: {
    marginLeft: 4,
  },
  removeTagText: {
    color: '#AAA', // Lighter icon color
    fontSize: 16,
    marginTop: -2,
  },
  tagInput: {
    flex: 1,
    minWidth: 60,
    fontSize: 14,
    padding: 0,
    marginLeft: 5,
    color: '#E0E0E0', // Light text
  },
  addButton: {
    backgroundColor: '#3498DB', // Blue button
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff6b6b', // Bright red for errors
    fontSize: 12,
    marginTop: -8,
    marginBottom: 4,
    marginLeft: 4,
  },
  helperText: {
    color: '#888', // Lighter text
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#555', // Darker disabled button
    opacity: 0.5,
  },
  inputError: {
    borderColor: '#ff6b6b', // Error border color
    borderWidth: 1,
  },
  updateButton: {
    backgroundColor: '#3498DB', // Blue button
    marginTop: 10,
  },
  // New styles for predefined tags
  predefinedTagsContainer: {
    marginTop: 15,
  },
  predefinedTagsTitle: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  predefinedTagsScroll: {
    paddingBottom: 5,
  },
  predefinedTag: {
    backgroundColor: '#2A3A4A',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3E5167',
  },
  predefinedTagSelected: {
    backgroundColor: '#3498DB',
    opacity: 0.6,
    borderColor: '#2980B9',
  },
  predefinedTagText: {
    color: '#E0E0E0',
    fontSize: 13,
  },
  predefinedTagTextSelected: {
    color: '#D0D0D0',
  }
});