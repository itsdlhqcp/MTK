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
import { getImageSrc, uploadProfileImage } from '../services/imageService';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from '@/assets/icons';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '@/components/Button';
import { updateUser } from '../services/userServices';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// TagInput Component/ TagInput Component
const TagInput = ({ tags = [], setTags }) => { 
    console.log("TagInput received tags:", tags); // Add default value for tags
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef();
    const MAX_TAGS = 3;
    const MAX_TAG_LENGTH = 7;
  
    const handleAddTag = () => {
        setError('');
      const cleanedTag = inputValue.trim().toLowerCase();
      if (!cleanedTag) {
        Alert.alert('Invalid Tag', 'Tag cannot be empty.');
        return;
      }
      // Ensure tags is an array before checking includes
      const currentTags = Array.isArray(tags) ? tags : [];
       // Validation checks
       if (!cleanedTag) {
        setError('Add your first tag');
        return;
      }

      if (currentTags.length >= MAX_TAGS) {
        setError(`Maximum ${MAX_TAGS} tags allowed.`);
        return;
      }

      if (currentTags.includes(cleanedTag)) {
        Alert.alert('Duplicate Tag', 'This tag already exists.');
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
              returnKeyType="done"
              onSubmitEditing={handleAddTag}
              maxLength={MAX_TAG_LENGTH}
              editable={tags.length < MAX_TAGS}
            />
            <TouchableOpacity 
              onPress={handleAddTag} 
              style={[
                styles.addButton,
                tags.length >= MAX_TAGS && styles.addButtonDisabled
              ]}
              disabled={tags.length >= MAX_TAGS}
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
        </View> 
      );
  };
  

// EditProfile Component
const EditProfile = () => {
    const { user: currentUser , updateUserContext } = useAuth();
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
    
            console.log("Setting user with tags:", userTags); // Debug log
            
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

    const onPickImage = async () => {

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })
        if (!result.canceled) {
            setUser({...user, image: result.assets[0]});
        }
    }
      
    const onSubmit = async () => {
        const { name, phoneNumber, address, bio, tags, image } = user;
        if (!name || !phoneNumber || !bio || !address || !tags || !image) {
          Alert.alert('Profile', 'Please fill all the fields');
          return;
        }
        
        try {
          setLoading(true);
          const updatedUserData = {
            name,
            phoneNumber,
            address,
            bio,
            tags,
            image: user.image
          };
      
          if (typeof image === 'object') {
            // update the image
            let imageRes = await uploadProfileImage('profiles', true, image?.uri);
            if (imageRes.success) {
              updatedUserData.image = imageRes.data;
            } else {
              Alert.alert('Error', 'Failed to upload image');
              return;
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
    // const onSubmit = async () => {
    //   const { name, phoneNumber, address ,bio, tags, image } = user;
    //   if (!name || !phoneNumber || !bio || !address || !tags || !image) {
    //     Alert.alert('Profile', 'Please fill all the fields');
    //     return;
    //   }
      
    //   try {
    //     setLoading(true);
    //     const updatedUserData = {
    //       name,
    //       phoneNumber,
    //       address,
    //       bio,
    //       tags,
    //     image: user.image
        
    //     };
    //     setLoading(true);


    //     if(typeof image === 'object'){
    //         // update the image
    //         let imageRes = await uploadProfileImage('profiles', image?.uri, true);
    //         if(imageRes.success) updatedUserData.image = imageRes.data;
    //         else updatedUserData.image = null;
    //     }

    //     const res = await updateUser(currentUser?.id, updatedUserData);
    //     // Pass the user object directly
    //     // const res = await updateUser(currentUser?.id, {
    //     //   name,
    //     //   phoneNumber,
    //     //   bio,
    //     //   tags,
    //     //   image: user.image
    //     // });
        
    //     if (res) {
    //         updateUserContext({
    //             ...currentUser,
    //             ...updatedUserData
    //           });
    //           router.back();
    //       Alert.alert('Success', 'Profile updated successfully');
    //     }
    //   } catch (error) {
    //     Alert.alert('Error', error.message || 'Failed to update profile');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
  
    // Rest of the component remains the same...
//   const imageSource = user.image && typeof user.image === 'object' ? user.image.uri : getImageSrc(user.image);
const imageSource = user.image 
    ? (typeof user.image === 'object' && user.image.uri 
        ? { uri: user.image.uri }  // Local image
        : getImageSrc(user.image)) // Remote or default image
    : require('../assets/images/defaultUser.png');  // Fallback

  return (
    <ScreenWrapper bg="white">
        <Header title="Edit Profile" showBackButton={true} />
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.form}>
            <View style={styles.avatarContainer}>
              <Image source={imageSource} style={styles.avatar} />
              <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                <Icon name="camera" strokeWidth={2.5} size={hp(3)} color={theme.colors.text} />
              </Pressable>
            </View>
            <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
              Please fill your profile details
            </Text>
            <Input
              icon={<Icon name="user" />}
              placeholder="Enter your name"
              value={user.name}
              onChangeText={(value) => setUser({ ...user, name: value })}
            />
            <Input
              icon={<Icon name="call" />}
              placeholder="Enter your Contact (Optional)"
              value={user.phoneNumber}
              onChangeText={(value) => setUser({ ...user, phoneNumber: value })}
            />
             <Input
              icon={<Icon name="location" />}
              placeholder="Enter your Home Town (Optional)"
              value={user.address}
              onChangeText={(value) => setUser({ ...user, address: value })}
            />
            <Input
              placeholder="Write your bio ..... "
              value={user.bio}
              multiline={true}
              containerStyle={styles.bio}
              onChangeText={(value) => setUser({ ...user, bio: value })}
            />
            <TagInput tags={user.tags} setTags={(newTags) => setUser({ ...user, tags: newTags })} />
            <Button title="Update" loading={loading} onPress={onSubmit} />
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
    borderColor: theme.colors.darkLight,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 7,
  },
  form: {
    gap: 18,
    marginTop: 20,
  },
  bio: {
    flexDirection: 'row',
    height: hp(15),
    alignItems: 'flex-start',
    paddingVertical: 15,
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
    borderColor: theme.colors.darkLight,
    borderRadius: theme.radius.sm,
    padding: 5,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 14,
    color: '#1a73e8',
  },
  removeTag: {
    marginLeft: 4,
  },
  removeTagText: {
    color: '#666',
    fontSize: 16,
    marginTop: -2,
  },
  tagInput: {
    flex: 1,
    minWidth: 60,
    fontSize: 14,
    padding: 0,
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: '#1a73e8',
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
    color: theme.colors.error || 'red',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: theme.colors.textLight,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.darkLight,
    opacity: 0.5,
  },
});