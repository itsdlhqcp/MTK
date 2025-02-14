import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import theme from '../constants/theme'
import Icon from '@/assets/icons'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import RichTextEditor from '../components/RichTextEditor'
import Button from '@/components/Button'
import { getSupabaseFileUrl } from '../services/imageService'
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import DatePicker from '../components/DatePicker'
import RatingInput from '../components/RatingInput'
import UserRatingImpact from '../components/userRatingImpact'
import { createOrUpdateOtt } from '../services/ottService'
import TagInput from '../components/OttTagInput'

const NewOtt = () => {

  const post = useLocalSearchParams();
  const { user } = useAuth();
  const bodyRef = useRef(''); 
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [file, setFile] = useState(null);
  const [rating, setRating] = useState(null);
  const [userRatingImpact, setUserRatingImpact] = useState(0);
  const [tags, setTags] = useState([]);

  const handleDateSelect = (date) => {
    console.log('Selected date:', date);
    setSelectedDate(date); // This will now properly store the date
  };

  useEffect(() => {
    if(post && post.id){
      bodyRef.current = post.body; 
      setFile(post.file || null);
      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body);
      },300)
    }
  }, [post])

  const onPick = async (isImage) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: false,
        exif: false
      };
  
      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
      if (!result.canceled) {
        const asset = result.assets[0];
        // Add better type checking
        const fileType = asset.type || (asset.uri.match(/\.(jpg|jpeg|png|gif)$/i) 
          ? 'image' 
          : 'video');
        
        setFile({
          uri: asset.uri,
          type: fileType,
          name: asset.uri.split('/').pop()
        });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media file');
    }
  };

      const isLocalFile = file=>{
        if(!file) return null;
        if(typeof file === 'object') return true;
        return false;
      }

      const getFileType = file => {
        if (!file) return null;
        if (isLocalFile(file)) {
          return file.type || 'image'; // Provide a default type
        }
        // For remote files
        return file.includes('postImage') ? 'image' : 'video';
      };


      const getFileUri = file => {
        if(!file) return null;
        if(isLocalFile(file)){
          return file.uri;
        }
        return getSupabaseFileUrl(file)?.uri;
      }

      const handleRatingChange = (value) => {
        console.log('Rating changed:', value);
        setRating(value);
      };

      const handleuserRatingImpactChange = (value) => {
        console.log('Impact Rating changed:', value);
        setUserRatingImpact(value);
      };

    const onSubmit = async () => {
      if (!selectedDate && !file && !bodyRef.current && !tags.length) {
        Alert.alert('Error', 'Enter Title, post img and release date');
        return;
      }
      if (!rating) {
        Alert.alert('Error', 'Please enter Rating of release');
        return;
      }

      let data = {
        file, 
        body: bodyRef.current,
        userId: user?.id,
        rDate: selectedDate,
        defRating: rating,
        userRatImpact: userRatingImpact,
        tags: tags
      }

      // CREATING A NEW RELEASE 
      setLoading(true);
      let res = await createOrUpdateOtt(data);
      setLoading(false);
      if(res.success){
        setFile(null); 
        bodyRef.current = ''; 
        editorRef.current?.setContentHTML('');
        Alert.alert('Stream uploaded successfully');
        router.push('/upcoming');
      }else{
        Alert.alert('Release', res.msg);
      }
      // below are the set of data console logs
      // console.log('body#######: ', bodyRef.current);
      // console.log('file#######: ', file);
      // console.log('date: ', selectedDate);
      // console.log('rating:', rating);
      // console.log('userRatingImpact:', userRatingImpact);
    };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };

  return (
    <ScreenWrapper bg="white">
      <Header title={post?.id ? "Edit Ott Stream" : "Create Ott Stream"}
         showBackButton={true} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ gap: 20 }}>
          <View style={styles.header}>
            <Avatar
              uri={user?.image}
              size={hp(6.5)}
              rounded={theme.radius.xl}
            />
            <View style={{ gap: 2 }}>
              <Text style={styles.username}>
                {user?.name}
              </Text>
              <Text style={styles.publicText}>
                Public
              </Text>
            </View>
          </View>
          
        <View>
          <RichTextEditor 
            editorRef={editorRef} 
            onChange={handleEditorChange}
            initialHeight={136}
            placeholder="Enter Film Title here @author ## write film name in a line ## please don't use any text alignment for this session and use default text font size ==>> like film name = Interstellar"  />
        </View>


          {file && (
            <View style={styles.file}>
              {getFileType(file) === 'video' ? (
                <Video
                  source={{ uri: getFileUri(file) }}
                  style={{ width: '100%', height: '122%' }}
                  resizeMode="cover"
                  borderRadius={7}
                  onError={(error) => console.log('Video loading error:', error)}
                  useNativeControls 
                  positionMillis
                  isLooping
                  audioPan
                />
              ) : (
                <Image
                  source={{ uri: getFileUri(file) }}
                  style={{ width: '100%', height: '122%' }}
                  resizeMode="cover"
                  borderRadius={6}
                  onError={(error) => console.log('Image loading error:', error)}
                />
              )}
              <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
                <Icon name="delete" size={22} color={"red"} />
              </Pressable>
            </View>
          )}

          <View style={styles.media}>
            <Text style={styles.addImageText}>Stick Release Poster HERE</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPick(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>

          <View>
          <DatePicker 
            // onDateSelect={handleDateSelect}
            onDateSelect={(date) => handleDateSelect(date)}
            initialDate={selectedDate}
          />
          </View>

          <TagInput tags={tags} setTags={setTags} />

          <RatingInput
            onRatingChange={handleRatingChange}
            initialValue={post?.rating}
          />

         <UserRatingImpact
            onRatingChange={handleuserRatingImpactChange}
            initialValue={post?.rating}
          />

        </ScrollView>
        <Button
          buttonStyle={{ height: hp(6.2) }}
          title={post?.id ? "Edit" : "Post New Release"}
          loading={loading}
          onPress={onSubmit}
          hasShadow={false}
        />
      </View>
    </ScreenWrapper>
  );
};

export default NewOtt

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: wp(4), 
    gap: 15,
  },
  file: {
    height: hp(32),
    width: '100%',
    overflow: 'hidden',
    borderCurve: 'continuous',
    paddingVertical: wp(8),
    // Add these properties to make it visible
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    padding: 7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
},
  media: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    borderWidth: 1, 
    padding: 12, 
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md, 
    borderCurve: 'continuous', 
    borderColor: theme.colors.gray
  },
  title: {
    // marginBottom: 10,
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: 'center'
    },
    header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    },
    username: {
    fontSize: hp(2.2),
    fontWeight: theme. fonts. semibold,
    color: theme.colors.text,
    },
    mediaIcons: {
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8,
      marginLeft: 10
    },
    addImageText: {
      fontSize: hp(2),
      fontWeight: theme.fonts.semibold,
      color: theme.colors.text,
    },
    avatar: {
    height: hp(6.5),
    width: hp(6.5),
    borderRadius: theme. radius.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
    },
    publicText: {
      fontSize: hp(1.7),
      fontWeight: theme.fonts.medium,
      color: theme.colors.textLight,
      },
      closeIcon: {
        position: 'absolute',
        top: 16,
        right: 12,
        padding: 6,
        borderRadius: 50,
        backgroundColor: 'rgba(97, 35, 35, 0.14)',
       
      },
      label: {
        fontSize: hp(2),
        fontWeight: hp(4.5),
        paddingStart: 10,
        color: theme.colors.text,
        paddingBottom: 5
      },
      dateInput: {
        fontSize: hp(2),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        padding: 24,
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: theme.radius.md,
        borderCurve: 'continuous',
        marginTop: 10,
      },
     
})