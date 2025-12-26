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
  DevSettings, 
  NativeModules
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
import { useToast } from '../contexts/ToastContext';

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
            placeholder={tags.length >= MAX_TAGS ? "" : "Add a tag (Optional)"}
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
        {/* <View style={styles.predefinedTagsContainer}>
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
        </View> */}
      </View> 
    );
};
  
// EditProfile Component
const EditProfile = () => {
    const { user: currentUser, updateUserContext } = useAuth();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();
    const [user, setUser] = useState({
      name: '',
      phoneNumber: '',
      address: '',
      image: '',
      bio: '',
      tags: [],
      orgname: '', 
    });
    
    // Form validation state
    const [errors, setErrors] = useState({
      name: '',
      address: '',
      bio: '',
      image: '',
      tags: '',
      orgname: '', // Added validation field for orgname
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
                tags: userTags, 
                orgname: currentUser.orgname || '', 
            });
        }
    }, [currentUser]);

    const validateForm = () => {
      const newErrors = {
        name: '',
        address: '',
        bio: '',
        image: '',
        tags: '',
        orgname: '',
      };

      // Validate username (name field) - should not exceed 8 characters
      if (user.name && user.name.length > 8) {
        newErrors.name = 'Username must not exceed 8 characters';
      }

      // Validate orgname (if provided)
      if (user.orgname && user.orgname.length > 50) {
        newErrors.orgname = 'Name must be less than 50 characters';
      }

      // Validate address (if provided)
      if (user.address && user.address.length > 100) {
        newErrors.address = 'Address must be less than 100 characters';
      }

      // Validate bio (if provided)
      if (user.bio && user.bio.length > 500) {
        newErrors.bio = 'Bio must be less than 500 characters';
      }

      // Validate tags
      if (user.tags && user.tags.length > 2) {
        newErrors.tags = 'Maximum 2 tags allowed';
      }

      setErrors(newErrors);
      
      // Return true if no errors
      return !Object.values(newErrors).some(error => error !== '');
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
              // Clear image error if it exists  showToast
              if (errors.image) {
                setErrors({...errors, image: ''});
              }
          }
        } catch (error) {
          showToast('error', 'Failed to pick image');
        }
    };
      
    const onSubmit = async () => {
        // Validate form before submission
        if (!validateForm()) {
          showToast('error', 'Please fix the errors in the form');
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
            image: user.image,
            orgname: user.orgname, // Add orgname to the data being updated
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
            // Only reload if the original user's bio was null
            // if (currentUser?.bio === null || currentUser?.bio === undefined) {
            //   DevSettings.reload();
            // }
           // NativeModules.DevSetting?.reload()
            // RNRestart.
            router.back(); // here the router getting into the profile screeen
            showToast('success', 'Profile updated successfully. Changes will appear shortly after data validation!!');
          }
        } catch (error) {
          showToast('error',  error.message || 'Failed to update profile');

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
      // Validate username length before setting
      if (field === 'name' && value.length > 8) {
        setErrors({...errors, name: 'Username must not exceed 8 characters'});
        return;
      }
      
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
              <View>
                <View style={styles.avatarContainer}>
                  <Image source={imageSource} style={styles.avatar} />
                  <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                    <Icon name="camera" strokeWidth={2.5} size={hp(2.5)} color={theme.colors.text} />
                  </Pressable>
                </View>
                {errors.image ? (
                  <Text style={styles.fieldErrorText}>{errors.image}</Text>
                ) : null}
              </View>
              <Text style={styles.formHeading}>
                Please fill your profile details
              </Text>
              <View>
                <Input
                  icon={<Icon name="user" color="#fff" />}
                  placeholder="Enter username"
                  value={user.name}
                  onChangeText={(value) => {
                    // Limit to 8 characters while typing
                    if (value.length <= 8) {
                      handleInputChange('name', value);
                    }
                  }}
                  maxLength={8}
                  editable={false}  // Disable editing for now
                  containerStyle={errors.name ? styles.inputError : null}
                />
                {errors.name ? (
                  <Text style={styles.fieldErrorText}>{errors.name}</Text>
                ) : null}
              </View>
              
              {/* Added Organization Name Field */}
              <View>
                <Input
                  icon={<Icon name="name" color="#fff" />}
                  placeholder="Enter your name"
                  value={user.orgname}
                  onChangeText={(value) => handleInputChange('orgname', value)}
                  containerStyle={errors.orgname ? styles.inputError : null}
                />
                {errors.orgname ? (
                  <Text style={styles.fieldErrorText}>{errors.orgname}</Text>
                ) : null}
              </View>
              
              {/* <PhoneVerification /> */}
              
              <View>
                <Input
                  icon={<Icon name="location" color="#fff" />}
                  placeholder="Enter your Home Town"
                  value={user.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  containerStyle={errors.address ? styles.inputError : null}
                />
                {errors.address ? (
                  <Text style={styles.fieldErrorText}>{errors.address}</Text>
                ) : null}
              </View>
              
              <View>
                <Input
                  placeholder="Write your bio ..... "
                  value={user.bio}
                  multiline={true}
                  containerStyle={[styles.bio, errors.bio ? styles.inputError : null]}
                  onChangeText={(value) => handleInputChange('bio', value)}
                />
                {errors.bio ? (
                  <Text style={styles.fieldErrorText}>{errors.bio}</Text>
                ) : null}
              </View>
              
              {/* <View>
                <TagInput 
                  tags={user.tags} 
                  setTags={(newTags) => {
                    setUser({ ...user, tags: newTags });
                    // Clear tags error when tags are updated
                    if (errors.tags) {
                      setErrors({...errors, tags: ''});
                    }
                  }} 
                />
                {errors.tags ? (
                  <Text style={styles.fieldErrorText}>{errors.tags}</Text>
                ) : null}
              </View> */}
              
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
   // backgroundColor: '#1E1E1E', // Darker input background
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
   // backgroundColor: '#1E1E1E', // Darker background
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
  fieldErrorText: {
    color: '#ff6b6b',
    fontSize: hp(1.4),
    marginTop: hp(0.5),
    marginLeft: wp(2),
    marginBottom: hp(0.5),
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