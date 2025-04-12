import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable, TextInput } from 'react-native'
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
import { createOrUpdateRelease } from '../services/releaseService'

const NewRelease = () => {

  const post = useLocalSearchParams();
  const { user } = useAuth();
  const bodyRef = useRef(''); 
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [file, setFile] = useState(null);
  const [filel, setFilel] = useState(null); // Added second file state
  const [rating, setRating] = useState(null);
  const [userRatingImpact, setUserRatingImpact] = useState(0);
  
  // Film information fields as individual state variables
  const [lang, setLang] = useState('');
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState('');
  const [director, setDirector] = useState('');
  const [writer, setWriter] = useState('');
  const [music, setMusic] = useState('');
  const [dop, setDop] = useState('');
  const [edit, setEdit] = useState('');
  const [cast, setCast] = useState('');

  const handleDateSelect = (date) => {
    console.log('Selected date:', date);
    setSelectedDate(date); // This will now properly store the date
  };

  useEffect(() => {
    if(post && post.id){
      bodyRef.current = post.body; 
      setFile(post.file || null);
      setFilel(post.filel || null); // Load second file if it exists
      
      // Load film info if it exists
      if (post.lang) setLang(post.lang);
      if (post.genre) setGenre(post.genre);
      if (post.duration) setDuration(post.duration);
      if (post.director) setDirector(post.director);
      if (post.writer) setWriter(post.writer);
      if (post.music) setMusic(post.music);
      if (post.dop) setDop(post.dop);
      if (post.edit) setEdit(post.edit);
      if (post.cast) setCast(post.cast);
      
      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body);
      },300)
    }
  }, [post])

  const onPick = async (isImage, allowEditing = true) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: allowEditing,
        editable: 'true',
        aspect: [4, 3],
        quality: 1,
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

  // Added second file picker function
  const onPickSecond = async (isImage) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        base64: false,
        exif: false
      };
  
      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
      if (!result.canceled) {
        const asset = result.assets[0];
        
        setFilel({
          uri: asset.uri,
          type: isImage ? 'image' : 'video',
          name: asset.uri.split('/').pop(),
        });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick second media file');
    }
  };

  const isLocalFile = file => {
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
    if (!selectedDate && !file && !bodyRef.current) {
      Alert.alert('Error', 'Enter Title, post img and release date');
      return;
    }
    if (!rating) {
      Alert.alert('Error', 'Please enter Rating of release');
      return;
    }

    // Check if all film info fields are filled
    const filmFields = {
      lang, genre, duration, director, writer, music, dop, edit, cast
    };
    
    const missingFields = Object.entries(filmFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      Alert.alert('Error', `Please fill all film information fields. Missing: ${missingFields.join(', ')}`);
      return;
    }

    let data = {
      file, 
      filel, // Added second file to submission data
      body: bodyRef.current,
      userId: user?.id,
      rDate: selectedDate,
      defRating: rating,
      userRatImpact: userRatingImpact,
      // Add all film info fields directly
      lang,
      genre,
      duration,
      director,
      writer,
      music,
      dop,
      edit,
      cast
    }

    // CREATING A NEW RELEASE 
    setLoading(true);
    let res = await createOrUpdateRelease(data);
    setLoading(false);
    if(res.success){
      setFile(null); 
      setFilel(null); // Clear second file on success
      bodyRef.current = ''; 
      editorRef.current?.setContentHTML('');
      // Reset film info fields
      setLang('');
      setGenre('');
      setDuration('');
      setDirector('');
      setWriter('');
      setMusic('');
      setDop('');
      setEdit('');
      setCast('');
      
      Alert.alert('Release uploaded successfully');
      router.push('/upcoming');
    }else{
      Alert.alert('Release', res.msg);
    }
  };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };

  return (
    <ScreenWrapper bg="white">
      <Header title={post?.id ? "Edit Release" : "Create Release"}
         showBackButton={true} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
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
                <Icon name="crop" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onPick(true, false)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Added second image preview */}
          {filel && (
            <View style={styles.file}>
              {getFileType(filel) === 'video' ? (
                <Text>Video not allowed for second image</Text>
              ) : (
                <Image
                  source={{ uri: getFileUri(filel) }}
                  style={{ width: '100%', height: '122%' }}
                  resizeMode="cover"
                  borderRadius={6}
                  onError={(error) => console.log('Image loading error:', error)}
                />
              )}
              <Pressable style={styles.closeIcon} onPress={() => setFilel(null)}>
                <Icon name="delete" size={22} color={"red"} />
              </Pressable>
            </View>
          )}

          {/* Added second image picker */}
          <View style={styles.media}>
            <Text style={styles.addImageText}>Add Digital list poster image</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPickSecond(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Film Information Section */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Film Information</Text>
          </View>

          {/* Language Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Language</Text>
            <TextInput
              style={styles.input}
              value={lang}
              onChangeText={setLang}
              placeholder="Enter film language"
            />
          </View>

          {/* Genre Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Genre</Text>
            <TextInput
              style={styles.input}
              value={genre}
              onChangeText={setGenre}
              placeholder="Enter film genre"
            />
          </View>

          {/* Duration Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Duration</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="Enter film duration (HH:MM:SS)"
              keyboardType="default"
            />
          </View>

          {/* Director Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Director</Text>
            <TextInput
              style={styles.input}
              value={director}
              onChangeText={setDirector}
              placeholder="Enter film director"
            />
          </View>

          {/* Writer Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Writer</Text>
            <TextInput
              style={styles.input}
              value={writer}
              onChangeText={setWriter}
              placeholder="Enter film writer"
            />
          </View>

          {/* Music Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Music</Text>
            <TextInput
              style={styles.input}
              value={music}
              onChangeText={setMusic}
              placeholder="Enter music composer"
            />
          </View>

          {/* DOP Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Director of Photography</Text>
            <TextInput
              style={styles.input}
              value={dop}
              onChangeText={setDop}
              placeholder="Enter DOP"
            />
          </View>

          {/* Edit Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Editor</Text>
            <TextInput
              style={styles.input}
              value={edit}
              onChangeText={setEdit}
              placeholder="Enter film editor"
            />
          </View>

          {/* Cast Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cast</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={cast}
              onChangeText={setCast}
              placeholder="Enter cast members"
              multiline={true}
              numberOfLines={4}
            />
          </View>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Release Information</Text>
          </View>

          <View>
          <DatePicker 
            onDateSelect={(date) => handleDateSelect(date)}
            initialDate={selectedDate}
          />
          </View>

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

export default NewRelease

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
    fontWeight: theme.fonts.semibold,
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
    borderRadius: theme.radius.xl,
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
  // Styles for Film Information Section
  sectionDivider: {
    marginVertical: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: theme.colors.gray,
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: hp(1.8),
  },
  multilineInput: {
    minHeight: hp(10),
    textAlignVertical: 'top',
  }
})


// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable, TextInput } from 'react-native'
// import React, { useRef, useState, useEffect } from 'react'
// import ScreenWrapper from '../components/ScreenWrapper'
// import Header from '../components/Header'
// import { useLocalSearchParams, useRouter } from 'expo-router'
// import { hp, wp } from '@/helpers/common'
// import theme from '../constants/theme'
// import Icon from '@/assets/icons'
// import Avatar from '../components/Avatar'
// import { useAuth } from '../contexts/AuthContext'
// import RichTextEditor from '../components/RichTextEditor'
// import Button from '@/components/Button'
// import { getSupabaseFileUrl } from '../services/imageService'
// import { Video } from 'expo-av';
// import * as ImagePicker from 'expo-image-picker';
// import DatePicker from '../components/DatePicker'
// import RatingInput from '../components/RatingInput'
// import UserRatingImpact from '../components/userRatingImpact'
// import { createOrUpdateRelease } from '../services/releaseService'

// const NewRelease = () => {

//   const post = useLocalSearchParams();
//   const { user } = useAuth();
//   const bodyRef = useRef(''); 
//   const editorRef = useRef(null);
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [file, setFile] = useState(null);
//   const [filel, setFilel] = useState(null); // Added second file state
//   const [rating, setRating] = useState(null);
//   const [userRatingImpact, setUserRatingImpact] = useState(0);
  
//   // New film information fields
//   const [filmInfo, setFilmInfo] = useState({
//     lang: '',
//     genre: '',
//     duration: '',
//     director: '',
//     writer: '',
//     music: '',
//     dop: '',
//     edit: '',
//     cast: ''
//   });

//   const handleDateSelect = (date) => {
//     console.log('Selected date:', date);
//     setSelectedDate(date); // This will now properly store the date
//   };

//   useEffect(() => {
//     if(post && post.id){
//       bodyRef.current = post.body; 
//       setFile(post.file || null);
//       setFilel(post.filel || null); // Load second file if it exists
//       // Load film info if it exists
//       if (post.filmInfo) {
//         setFilmInfo(post.filmInfo);
//       }
//       setTimeout(() => {
//         editorRef?.current?.setContentHTML(post.body);
//       },300)
//     }
//   }, [post])

//   const onPick = async (isImage, allowEditing = true) => {
//     try {
//       let mediaConfig = {
//         mediaTypes: isImage 
//           ? ImagePicker.MediaTypeOptions.Images 
//           : ImagePicker.MediaTypeOptions.Videos,
//         allowsEditing: allowEditing,
//         editable: 'true',
//         aspect: [4, 3],
//         quality: 1,
//         base64: false,
//         exif: false
//       };
  
//       let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
//       if (!result.canceled) {
//         const asset = result.assets[0];
//         // Add better type checking
//         const fileType = asset.type || (asset.uri.match(/\.(jpg|jpeg|png|gif)$/i) 
//           ? 'image' 
//           : 'video');
        
//         setFile({
//           uri: asset.uri,
//           type: fileType,
//           name: asset.uri.split('/').pop()
//         });
//       }
//     } catch (error) {
//       console.error('Error picking media:', error);
//       Alert.alert('Error', 'Failed to pick media file');
//     }
//   };

//   // Added second file picker function
//   const onPickSecond = async (isImage) => {
//     try {
//       let mediaConfig = {
//         mediaTypes: isImage 
//           ? ImagePicker.MediaTypeOptions.Images 
//           : ImagePicker.MediaTypeOptions.Videos,
//         allowsEditing: false,
//         quality: 1,
//         base64: false,
//         exif: false
//       };
  
//       let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
//       if (!result.canceled) {
//         const asset = result.assets[0];
        
//         setFilel({
//           uri: asset.uri,
//           type: isImage ? 'image' : 'video',
//           name: asset.uri.split('/').pop(),
//         });
//       }
//     } catch (error) {
//       console.error('Error picking media:', error);
//       Alert.alert('Error', 'Failed to pick second media file');
//     }
//   };

//   const isLocalFile = file => {
//     if(!file) return null;
//     if(typeof file === 'object') return true;
//     return false;
//   }

//   const getFileType = file => {
//     if (!file) return null;
//     if (isLocalFile(file)) {
//       return file.type || 'image'; // Provide a default type
//     }
//     // For remote files
//     return file.includes('postImage') ? 'image' : 'video';
//   };

//   const getFileUri = file => {
//     if(!file) return null;
//     if(isLocalFile(file)){
//       return file.uri;
//     }
//     return getSupabaseFileUrl(file)?.uri;
//   }

//   const handleRatingChange = (value) => {
//     console.log('Rating changed:', value);
//     setRating(value);
//   };

//   const handleuserRatingImpactChange = (value) => {
//     console.log('Impact Rating changed:', value);
//     setUserRatingImpact(value);
//   };

//   // Handle film info changes
//   const handleFilmInfoChange = (field, value) => {
//     setFilmInfo(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const onSubmit = async () => {
//     if (!selectedDate && !file && !bodyRef.current) {
//       Alert.alert('Error', 'Enter Title, post img and release date');
//       return;
//     }
//     if (!rating) {
//       Alert.alert('Error', 'Please enter Rating of release');
//       return;
//     }

//     // Check if all film info fields are filled
//     const missingFields = Object.entries(filmInfo)
//       .filter(([_, value]) => !value)
//       .map(([key]) => key);
    
//     if (missingFields.length > 0) {
//       Alert.alert('Error', `Please fill all film information fields. Missing: ${missingFields.join(', ')}`);
//       return;
//     }

//     let data = {
//       file, 
//       filel, // Added second file to submission data
//       body: bodyRef.current,
//       userId: user?.id,
//       rDate: selectedDate,
//       defRating: rating,
//       userRatImpact: userRatingImpact,
//       filmInfo // Add film info to data
//     }

//     // CREATING A NEW RELEASE 
//     setLoading(true);
//     let res = await createOrUpdateRelease(data);
//     setLoading(false);
//     if(res.success){
//       setFile(null); 
//       setFilel(null); // Clear second file on success
//       bodyRef.current = ''; 
//       editorRef.current?.setContentHTML('');
//       // Reset film info fields
//       setFilmInfo({
//         lang: '',
//         genre: '',
//         duration: '',
//         director: '',
//         writer: '',
//         music: '',
//         dop: '',
//         edit: '',
//         cast: ''
//       });
//       Alert.alert('Release uploaded successfully');
//       router.push('/upcoming');
//     }else{
//       Alert.alert('Release', res.msg);
//     }
//   };

//   const handleEditorChange = (body) => {
//     bodyRef.current = body;
//   };

//   return (
//     <ScreenWrapper bg="white">
//       <Header title={post?.id ? "Edit Release" : "Create Release"}
//          showBackButton={true} />
//       <View style={styles.container}>
//         <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
//           <View style={styles.header}>
//             <Avatar
//               uri={user?.image}
//               size={hp(6.5)}
//               rounded={theme.radius.xl}
//             />
//             <View style={{ gap: 2 }}>
//               <Text style={styles.username}>
//                 {user?.name}
//               </Text>
//               <Text style={styles.publicText}>
//                 Public
//               </Text>
//             </View>
//           </View>
          
//         <View>
//           <RichTextEditor 
//             editorRef={editorRef} 
//             onChange={handleEditorChange}
//             initialHeight={136}
//             placeholder="Enter Film Title here @author ## write film name in a line ## please don't use any text alignment for this session and use default text font size ==>> like film name = Interstellar"  />
//         </View>

//           {file && (
//             <View style={styles.file}>
//               {getFileType(file) === 'video' ? (
//                 <Video
//                   source={{ uri: getFileUri(file) }}
//                   style={{ width: '100%', height: '122%' }}
//                   resizeMode="cover"
//                   borderRadius={7}
//                   onError={(error) => console.log('Video loading error:', error)}
//                   useNativeControls 
//                   positionMillis
//                   isLooping
//                   audioPan
//                 />
//               ) : (
//                 <Image
//                   source={{ uri: getFileUri(file) }}
//                   style={{ width: '100%', height: '122%' }}
//                   resizeMode="cover"
//                   borderRadius={6}
//                   onError={(error) => console.log('Image loading error:', error)}
//                 />
//               )}
//               <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
//                 <Icon name="delete" size={22} color={"red"} />
//               </Pressable>
//             </View>
//           )}

//           <View style={styles.media}>
//             <Text style={styles.addImageText}>Stick Release Poster HERE</Text>
//             <View style={styles.mediaIcons}>
//               <TouchableOpacity onPress={() => onPick(true)}>
//                 <Icon name="crop" size={30} color={theme.colors.dark} />
//               </TouchableOpacity>
//               <TouchableOpacity onPress={() => onPick(true, false)}>
//                 <Icon name="image" size={30} color={theme.colors.dark} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Added second image preview */}
//           {filel && (
//             <View style={styles.file}>
//               {getFileType(filel) === 'video' ? (
//                 <Text>Video not allowed for second image</Text>
//               ) : (
//                 <Image
//                   source={{ uri: getFileUri(filel) }}
//                   style={{ width: '100%', height: '122%' }}
//                   resizeMode="cover"
//                   borderRadius={6}
//                   onError={(error) => console.log('Image loading error:', error)}
//                 />
//               )}
//               <Pressable style={styles.closeIcon} onPress={() => setFilel(null)}>
//                 <Icon name="delete" size={22} color={"red"} />
//               </Pressable>
//             </View>
//           )}

//           {/* Added second image picker */}
//           <View style={styles.media}>
//             <Text style={styles.addImageText}>Add Digital list poster image</Text>
//             <View style={styles.mediaIcons}>
//               <TouchableOpacity onPress={() => onPickSecond(true)}>
//                 <Icon name="image" size={30} color={theme.colors.dark} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* New Film Information Section */}
//           <View style={styles.sectionDivider}>
//             <Text style={styles.sectionTitle}>Film Information</Text>
//           </View>

//           {/* Language Field */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Language</Text>
//             <TextInput
//               style={styles.input}
//               value={filmInfo.lang}
//               onChangeText={(text) => handleFilmInfoChange('lang', text)}
//               placeholder="Enter film language"
//             />
//           </View>

//           {/* Genre Field */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Genre</Text>
//             <TextInput
//               style={styles.input}
//               value={filmInfo.genre}
//               onChangeText={(text) => handleFilmInfoChange('genre', text)}
//               placeholder="Enter film genre"
//             />
//           </View>

//           {/* Duration Field */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Duration</Text>
//             <TextInput
//               style={styles.input}
//               value={filmInfo.duration}
//               onChangeText={(text) => handleFilmInfoChange('duration', text)}
//               placeholder="Enter film duration (HH:MM:SS)"
//               keyboardType="default"
//             />
//           </View>

//           {/* Director Field */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Director</Text>
//             <TextInput
//               style={styles.input}
//               value={filmInfo.director}
//               onChangeText={(text) => handleFilmInfoChange('director', text)}
//               placeholder="Enter film director"
//             />
//           </View>

//           {/* Writer Field */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Writer</Text>
//             <TextInput
//               style={styles.input}
//               value={filmInfo.writer}
//               onChangeText={(text) => handleFilmInfoChange('writer', text)}
//               placeholder="Enter film writer"
//             />
//           </View>

//           {/* Music Field */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Music</Text>
//             <TextInput
//               style={styles.input}
//               value={filmInfo.music}
//               onChangeText={(text) => handleFilmInfoChange('music', text)}
//               placeholder="Enter music composer"
//             />
//           </View>

//           {/* DOP Field */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Director of Photography</Text>
//             <TextInput
//               style={styles.input}
//               value={filmInfo.dop}
//               onChangeText={(text) => handleFilmInfoChange('dop', text)}
//               placeholder="Enter DOP"
//             />
//           </View>

//           {/* Edit Field */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Editor</Text>
//             <TextInput
//               style={styles.input}
//               value={filmInfo.edit}
//               onChangeText={(text) => handleFilmInfoChange('edit', text)}
//               placeholder="Enter film editor"
//             />
//           </View>

//           {/* Cast Field */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Cast</Text>
//             <TextInput
//               style={[styles.input, styles.multilineInput]}
//               value={filmInfo.cast}
//               onChangeText={(text) => handleFilmInfoChange('cast', text)}
//               placeholder="Enter film cast"
//               multiline={true}
//               numberOfLines={4}
//             />
//           </View>

//           <View style={styles.sectionDivider}>
//             <Text style={styles.sectionTitle}>Release Information</Text>
//           </View>

//           <View>
//           <DatePicker 
//             onDateSelect={(date) => handleDateSelect(date)}
//             initialDate={selectedDate}
//           />
//           </View>

//           <RatingInput
//             onRatingChange={handleRatingChange}
//             initialValue={post?.rating}
//           />

//          <UserRatingImpact
//             onRatingChange={handleuserRatingImpactChange}
//             initialValue={post?.rating}
//           />

//         </ScrollView>
//         <Button
//           buttonStyle={{ height: hp(6.2) }}
//           title={post?.id ? "Edit" : "Post New Release"}
//           loading={loading}
//           onPress={onSubmit}
//           hasShadow={false}
//         />
//       </View>
//     </ScreenWrapper>
//   );
// };

// export default NewRelease

// const styles = StyleSheet.create({
//   container: {
//     flex: 1, 
//     marginTop: 14,
//     marginBottom: 10,
//     paddingHorizontal: wp(4), 
//     gap: 15,
//   },
//   file: {
//     height: hp(32),
//     width: '100%',
//     overflow: 'hidden',
//     borderCurve: 'continuous',
//     paddingVertical: wp(8),
//     // Add these properties to make it visible
//     borderWidth: 1,
//     borderColor: theme.colors.gray,
//     borderRadius: theme.radius.md,
//     padding: 7,
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'relative'
//   },
//   media: {
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     alignItems: 'center', 
//     borderWidth: 1, 
//     padding: 12, 
//     paddingHorizontal: wp(4),
//     borderRadius: theme.radius.md, 
//     borderCurve: 'continuous', 
//     borderColor: theme.colors.gray
//   },
//   title: {
//     // marginBottom: 10,
//     fontSize: hp(2.5),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//     textAlign: 'center'
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   username: {
//     fontSize: hp(2.2),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//   },
//   mediaIcons: {
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     gap: 8,
//     marginLeft: 10
//   },
//   addImageText: {
//     fontSize: hp(2),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//   },
//   avatar: {
//     height: hp(6.5),
//     width: hp(6.5),
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//     borderWidth: 1,
//     borderColor: 'rgba(0,0,0,0.1)'
//   },
//   publicText: {
//     fontSize: hp(1.7),
//     fontWeight: theme.fonts.medium,
//     color: theme.colors.textLight,
//   },
//   closeIcon: {
//     position: 'absolute',
//     top: 16,
//     right: 12,
//     padding: 6,
//     borderRadius: 50,
//     backgroundColor: 'rgba(97, 35, 35, 0.14)',
//   },
//   label: {
//     fontSize: hp(2),
//     fontWeight: hp(4.5),
//     paddingStart: 10,
//     color: theme.colors.text,
//     paddingBottom: 5
//   },
//   dateInput: {
//     fontSize: hp(2),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//     padding: 24,
//     borderWidth: 1,
//     borderColor: theme.colors.gray,
//     borderRadius: theme.radius.md,
//     borderCurve: 'continuous',
//     marginTop: 10,
//   },
//   // New styles for Film Information Section
//   sectionDivider: {
//     marginVertical: 10,
//     paddingVertical: 6,
//     borderBottomWidth: 1,
//     borderColor: theme.colors.gray,
//   },
//   sectionTitle: {
//     fontSize: hp(2.2),
//     fontWeight: theme.fonts.bold,
//     color: theme.colors.primary,
//   },
//   inputContainer: {
//     marginBottom: 10,
//   },
//   inputLabel: {
//     fontSize: hp(1.8),
//     fontWeight: theme.fonts.medium,
//     color: theme.colors.text,
//     marginBottom: 4,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: theme.colors.gray,
//     borderRadius: theme.radius.sm,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: hp(1.8),
//   },
//   multilineInput: {
//     minHeight: hp(10),
//     textAlignVertical: 'top',
//   }
// })

// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable } from 'react-native'
// import React, { useRef, useState, useEffect } from 'react'
// import ScreenWrapper from '../components/ScreenWrapper'
// import Header from '../components/Header'
// import { useLocalSearchParams, useRouter } from 'expo-router'
// import { hp, wp } from '@/helpers/common'
// import theme from '../constants/theme'
// import Icon from '@/assets/icons'
// import Avatar from '../components/Avatar'
// import { useAuth } from '../contexts/AuthContext'
// import RichTextEditor from '../components/RichTextEditor'
// import Button from '@/components/Button'
// import { getSupabaseFileUrl } from '../services/imageService'
// import { Video } from 'expo-av';
// import * as ImagePicker from 'expo-image-picker';
// import DatePicker from '../components/DatePicker'
// import RatingInput from '../components/RatingInput'
// import UserRatingImpact from '../components/userRatingImpact'
// import { createOrUpdateRelease } from '../services/releaseService'

// const NewRelease = () => {

//   const post = useLocalSearchParams();
//   const { user } = useAuth();
//   const bodyRef = useRef(''); 
//   const editorRef = useRef(null);
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [file, setFile] = useState(null);
//   const [filel, setFilel] = useState(null); // Added second file state
//   const [rating, setRating] = useState(null);
//   const [userRatingImpact, setUserRatingImpact] = useState(0);

//   const handleDateSelect = (date) => {
//     console.log('Selected date:', date);
//     setSelectedDate(date); // This will now properly store the date
//   };

//   useEffect(() => {
//     if(post && post.id){
//       bodyRef.current = post.body; 
//       setFile(post.file || null);
//       setFilel(post.filel || null); // Load second file if it exists
//       setTimeout(() => {
//         editorRef?.current?.setContentHTML(post.body);
//       },300)
//     }
//   }, [post])

//   const onPick = async (isImage, allowEditing = true) => {
//     try {
//       let mediaConfig = {
//         mediaTypes: isImage 
//           ? ImagePicker.MediaTypeOptions.Images 
//           : ImagePicker.MediaTypeOptions.Videos,
//         allowsEditing: allowEditing,
//         editable: 'true',
//         aspect: [4, 3],
//         quality: 1,
//         base64: false,
//         exif: false
//       };
  
//       let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
//       if (!result.canceled) {
//         const asset = result.assets[0];
//         // Add better type checking
//         const fileType = asset.type || (asset.uri.match(/\.(jpg|jpeg|png|gif)$/i) 
//           ? 'image' 
//           : 'video');
        
//         setFile({
//           uri: asset.uri,
//           type: fileType,
//           name: asset.uri.split('/').pop()
//         });
//       }
//     } catch (error) {
//       console.error('Error picking media:', error);
//       Alert.alert('Error', 'Failed to pick media file');
//     }
//   };

//   // Added second file picker function
//   const onPickSecond = async (isImage) => {
//     try {
//       let mediaConfig = {
//         mediaTypes: isImage 
//           ? ImagePicker.MediaTypeOptions.Images 
//           : ImagePicker.MediaTypeOptions.Videos,
//         allowsEditing: false,
//         quality: 1,
//         base64: false,
//         exif: false
//       };
  
//       let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
//       if (!result.canceled) {
//         const asset = result.assets[0];
        
//         setFilel({
//           uri: asset.uri,
//           type: isImage ? 'image' : 'video',
//           name: asset.uri.split('/').pop(),
//         });
//       }
//     } catch (error) {
//       console.error('Error picking media:', error);
//       Alert.alert('Error', 'Failed to pick second media file');
//     }
//   };

//   const isLocalFile = file => {
//     if(!file) return null;
//     if(typeof file === 'object') return true;
//     return false;
//   }

//   const getFileType = file => {
//     if (!file) return null;
//     if (isLocalFile(file)) {
//       return file.type || 'image'; // Provide a default type
//     }
//     // For remote files
//     return file.includes('postImage') ? 'image' : 'video';
//   };

//   const getFileUri = file => {
//     if(!file) return null;
//     if(isLocalFile(file)){
//       return file.uri;
//     }
//     return getSupabaseFileUrl(file)?.uri;
//   }

//   const handleRatingChange = (value) => {
//     console.log('Rating changed:', value);
//     setRating(value);
//   };

//   const handleuserRatingImpactChange = (value) => {
//     console.log('Impact Rating changed:', value);
//     setUserRatingImpact(value);
//   };

//   const onSubmit = async () => {
//     if (!selectedDate && !file && !bodyRef.current) {
//       Alert.alert('Error', 'Enter Title, post img and release date');
//       return;
//     }
//     if (!rating) {
//       Alert.alert('Error', 'Please enter Rating of release');
//       return;
//     }

//     let data = {
//       file, 
//       filel, // Added second file to submission data
//       body: bodyRef.current,
//       userId: user?.id,
//       rDate: selectedDate,
//       defRating: rating,
//       userRatImpact: userRatingImpact,
//     }

//     // CREATING A NEW RELEASE 
//     setLoading(true);
//     let res = await createOrUpdateRelease(data);
//     setLoading(false);
//     if(res.success){
//       setFile(null); 
//       setFilel(null); // Clear second file on success
//       bodyRef.current = ''; 
//       editorRef.current?.setContentHTML('');
//       Alert.alert('Release uploaded successfully');
//       router.push('/upcoming');
//     }else{
//       Alert.alert('Release', res.msg);
//     }
//   };

//   const handleEditorChange = (body) => {
//     bodyRef.current = body;
//   };

//   return (
//     <ScreenWrapper bg="white">
//       <Header title={post?.id ? "Edit Release" : "Create Release"}
//          showBackButton={true} />
//       <View style={styles.container}>
//         <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
//           <View style={styles.header}>
//             <Avatar
//               uri={user?.image}
//               size={hp(6.5)}
//               rounded={theme.radius.xl}
//             />
//             <View style={{ gap: 2 }}>
//               <Text style={styles.username}>
//                 {user?.name}
//               </Text>
//               <Text style={styles.publicText}>
//                 Public
//               </Text>
//             </View>
//           </View>
          
//         <View>
//           <RichTextEditor 
//             editorRef={editorRef} 
//             onChange={handleEditorChange}
//             initialHeight={136}
//             placeholder="Enter Film Title here @author ## write film name in a line ## please don't use any text alignment for this session and use default text font size ==>> like film name = Interstellar"  />
//         </View>

//           {file && (
//             <View style={styles.file}>
//               {getFileType(file) === 'video' ? (
//                 <Video
//                   source={{ uri: getFileUri(file) }}
//                   style={{ width: '100%', height: '122%' }}
//                   resizeMode="cover"
//                   borderRadius={7}
//                   onError={(error) => console.log('Video loading error:', error)}
//                   useNativeControls 
//                   positionMillis
//                   isLooping
//                   audioPan
//                 />
//               ) : (
//                 <Image
//                   source={{ uri: getFileUri(file) }}
//                   style={{ width: '100%', height: '122%' }}
//                   resizeMode="cover"
//                   borderRadius={6}
//                   onError={(error) => console.log('Image loading error:', error)}
//                 />
//               )}
//               <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
//                 <Icon name="delete" size={22} color={"red"} />
//               </Pressable>
//             </View>
//           )}

//           <View style={styles.media}>
//             <Text style={styles.addImageText}>Stick Release Poster HERE</Text>
//             <View style={styles.mediaIcons}>
//               <TouchableOpacity onPress={() => onPick(true)}>
//                 <Icon name="crop" size={30} color={theme.colors.dark} />
//               </TouchableOpacity>
//               <TouchableOpacity onPress={() => onPick(true, false)}>
//                 <Icon name="image" size={30} color={theme.colors.dark} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Added second image preview */}
//           {filel && (
//             <View style={styles.file}>
//               {getFileType(filel) === 'video' ? (
//                 <Text>Video not allowed for second image</Text>
//               ) : (
//                 <Image
//                   source={{ uri: getFileUri(filel) }}
//                   style={{ width: '100%', height: '122%' }}
//                   resizeMode="cover"
//                   borderRadius={6}
//                   onError={(error) => console.log('Image loading error:', error)}
//                 />
//               )}
//               <Pressable style={styles.closeIcon} onPress={() => setFilel(null)}>
//                 <Icon name="delete" size={22} color={"red"} />
//               </Pressable>
//             </View>
//           )}

//           {/* Added second image picker */}
//           <View style={styles.media}>
//             <Text style={styles.addImageText}>Add Digital list poster image</Text>
//             <View style={styles.mediaIcons}>
//               <TouchableOpacity onPress={() => onPickSecond(true)}>
//                 <Icon name="image" size={30} color={theme.colors.dark} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           <View>
//           <DatePicker 
//             onDateSelect={(date) => handleDateSelect(date)}
//             initialDate={selectedDate}
//           />
//           </View>

//           <RatingInput
//             onRatingChange={handleRatingChange}
//             initialValue={post?.rating}
//           />

//          <UserRatingImpact
//             onRatingChange={handleuserRatingImpactChange}
//             initialValue={post?.rating}
//           />

//         </ScrollView>
//         <Button
//           buttonStyle={{ height: hp(6.2) }}
//           title={post?.id ? "Edit" : "Post New Release"}
//           loading={loading}
//           onPress={onSubmit}
//           hasShadow={false}
//         />
//       </View>
//     </ScreenWrapper>
//   );
// };

// export default NewRelease

// const styles = StyleSheet.create({
//   container: {
//     flex: 1, 
//     marginTop: 14,
//     marginBottom: 10,
//     paddingHorizontal: wp(4), 
//     gap: 15,
//   },
//   file: {
//     height: hp(32),
//     width: '100%',
//     overflow: 'hidden',
//     borderCurve: 'continuous',
//     paddingVertical: wp(8),
//     // Add these properties to make it visible
//     borderWidth: 1,
//     borderColor: theme.colors.gray,
//     borderRadius: theme.radius.md,
//     padding: 7,
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'relative'
//   },
//   media: {
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     alignItems: 'center', 
//     borderWidth: 1, 
//     padding: 12, 
//     paddingHorizontal: wp(4),
//     borderRadius: theme.radius.md, 
//     borderCurve: 'continuous', 
//     borderColor: theme.colors.gray
//   },
//   title: {
//     // marginBottom: 10,
//     fontSize: hp(2.5),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//     textAlign: 'center'
//     },
//     header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     },
//     username: {
//     fontSize: hp(2.2),
//     fontWeight: theme. fonts. semibold,
//     color: theme.colors.text,
//     },
//     mediaIcons: {
//       flexDirection: 'row', 
//       alignItems: 'center', 
//       gap: 8,
//       marginLeft: 10
//     },
//     addImageText: {
//       fontSize: hp(2),
//       fontWeight: theme.fonts.semibold,
//       color: theme.colors.text,
//     },
//     avatar: {
//     height: hp(6.5),
//     width: hp(6.5),
//     borderRadius: theme. radius.xl,
//     borderCurve: 'continuous',
//     borderWidth: 1,
//     borderColor: 'rgba(0,0,0,0.1)'
//     },
//     publicText: {
//       fontSize: hp(1.7),
//       fontWeight: theme.fonts.medium,
//       color: theme.colors.textLight,
//       },
//       closeIcon: {
//         position: 'absolute',
//         top: 16,
//         right: 12,
//         padding: 6,
//         borderRadius: 50,
//         backgroundColor: 'rgba(97, 35, 35, 0.14)',
       
//       },
//       label: {
//         fontSize: hp(2),
//         fontWeight: hp(4.5),
//         paddingStart: 10,
//         color: theme.colors.text,
//         paddingBottom: 5
//       },
//       dateInput: {
//         fontSize: hp(2),
//         fontWeight: theme.fonts.semibold,
//         color: theme.colors.text,
//         padding: 24,
//         borderWidth: 1,
//         borderColor: theme.colors.gray,
//         borderRadius: theme.radius.md,
//         borderCurve: 'continuous',
//         marginTop: 10,
//       },
// })


// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable } from 'react-native'
// import React, { useRef, useState, useEffect } from 'react'
// import ScreenWrapper from '../components/ScreenWrapper'
// import Header from '../components/Header'
// import { useLocalSearchParams, useRouter } from 'expo-router'
// import { hp, wp } from '@/helpers/common'
// import theme from '../constants/theme'
// import Icon from '@/assets/icons'
// import Avatar from '../components/Avatar'
// import { useAuth } from '../contexts/AuthContext'
// import RichTextEditor from '../components/RichTextEditor'
// import Button from '@/components/Button'
// import { getSupabaseFileUrl } from '../services/imageService'
// import { Video } from 'expo-av';
// import * as ImagePicker from 'expo-image-picker';
// import DatePicker from '../components/DatePicker'
// import RatingInput from '../components/RatingInput'
// import UserRatingImpact from '../components/userRatingImpact'
// import { createOrUpdateRelease } from '../services/releaseService'

// const NewRelease = () => {

//   const post = useLocalSearchParams();
//   const { user } = useAuth();
//   const bodyRef = useRef(''); 
//   const editorRef = useRef(null);
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [file, setFile] = useState(null);
//   const [rating, setRating] = useState(null);
//   const [userRatingImpact, setUserRatingImpact] = useState(0);

//   const handleDateSelect = (date) => {
//     console.log('Selected date:', date);
//     setSelectedDate(date); // This will now properly store the date
//   };

//   useEffect(() => {
//     if(post && post.id){
//       bodyRef.current = post.body; 
//       setFile(post.file || null);
//       setTimeout(() => {
//         editorRef?.current?.setContentHTML(post.body);
//       },300)
//     }
//   }, [post])

//   const onPick = async (isImage) => {
//     try {
//       let mediaConfig = {
//         mediaTypes: isImage 
//           ? ImagePicker.MediaTypeOptions.Images 
//           : ImagePicker.MediaTypeOptions.Videos,
//         aspect: [4, 3],
//         quality: 1,
//         base64: false,
//         exif: false
//       };
  
//       let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
//       if (!result.canceled) {
//         const asset = result.assets[0];
//         // Add better type checking
//         const fileType = asset.type || (asset.uri.match(/\.(jpg|jpeg|png|gif)$/i) 
//           ? 'image' 
//           : 'video');
        
//         setFile({
//           uri: asset.uri,
//           type: fileType,
//           name: asset.uri.split('/').pop()
//         });
//       }
//     } catch (error) {
//       console.error('Error picking media:', error);
//       Alert.alert('Error', 'Failed to pick media file');
//     }
//   };

//       const isLocalFile = file=>{
//         if(!file) return null;
//         if(typeof file === 'object') return true;
//         return false;
//       }

//       const getFileType = file => {
//         if (!file) return null;
//         if (isLocalFile(file)) {
//           return file.type || 'image'; // Provide a default type
//         }
//         // For remote files
//         return file.includes('postImage') ? 'image' : 'video';
//       };


//       const getFileUri = file => {
//         if(!file) return null;
//         if(isLocalFile(file)){
//           return file.uri;
//         }
//         return getSupabaseFileUrl(file)?.uri;
//       }

//       const handleRatingChange = (value) => {
//         console.log('Rating changed:', value);
//         setRating(value);
//       };

//       const handleuserRatingImpactChange = (value) => {
//         console.log('Impact Rating changed:', value);
//         setUserRatingImpact(value);
//       };

//     const onSubmit = async () => {
//       if (!selectedDate && !file && !bodyRef.current) {
//         Alert.alert('Error', 'Enter Title, post img and release date');
//         return;
//       }
//       if (!rating) {
//         Alert.alert('Error', 'Please enter Rating of release');
//         return;
//       }

//       let data = {
//         file, 
//         body: bodyRef.current,
//         userId: user?.id,
//         rDate: selectedDate,
//         defRating: rating,
//         userRatImpact: userRatingImpact,
//       }

//       // CREATING A NEW RELEASE 
//       setLoading(true);
//       let res = await createOrUpdateRelease(data);
//       setLoading(false);
//       if(res.success){
//         setFile(null); 
//         bodyRef.current = ''; 
//         editorRef.current?.setContentHTML('');
//         Alert.alert('Release uploaded successfully');
//         router.push('/upcoming');
//       }else{
//         Alert.alert('Release', res.msg);
//       }
//     };

//   const handleEditorChange = (body) => {
//     bodyRef.current = body;
//   };

//   return (
//     <ScreenWrapper bg="white">
//       <Header title={post?.id ? "Edit Release" : "Create Release"}
//          showBackButton={true} />
//       <View style={styles.container}>
//         <ScrollView contentContainerStyle={{ gap: 20 }}>
//           <View style={styles.header}>
//             <Avatar
//               uri={user?.image}
//               size={hp(6.5)}
//               rounded={theme.radius.xl}
//             />
//             <View style={{ gap: 2 }}>
//               <Text style={styles.username}>
//                 {user?.name}
//               </Text>
//               <Text style={styles.publicText}>
//                 Public
//               </Text>
//             </View>
//           </View>
          
//         <View>
//           <RichTextEditor 
//             editorRef={editorRef} 
//             onChange={handleEditorChange}
//             initialHeight={136}
//             placeholder="Enter Film Title here @author ## write film name in a line ## please don't use any text alignment for this session and use default text font size ==>> like film name = Interstellar"  />
//         </View>


//           {file && (
//             <View style={styles.file}>
//               {getFileType(file) === 'video' ? (
//                 <Video
//                   source={{ uri: getFileUri(file) }}
//                   style={{ width: '100%', height: '122%' }}
//                   resizeMode="cover"
//                   borderRadius={7}
//                   onError={(error) => console.log('Video loading error:', error)}
//                   useNativeControls 
//                   positionMillis
//                   isLooping
//                   audioPan
//                 />
//               ) : (
//                 <Image
//                   source={{ uri: getFileUri(file) }}
//                   style={{ width: '100%', height: '122%' }}
//                   resizeMode="cover"
//                   borderRadius={6}
//                   onError={(error) => console.log('Image loading error:', error)}
//                 />
//               )}
//               <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
//                 <Icon name="delete" size={22} color={"red"} />
//               </Pressable>
//             </View>
//           )}

//           <View style={styles.media}>
//             <Text style={styles.addImageText}>Stick Release Poster HERE</Text>
//             <View style={styles.mediaIcons}>
//               <TouchableOpacity onPress={() => onPick(true)}>
//                 <Icon name="image" size={30} color={theme.colors.dark} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           <View>
//           <DatePicker 
//             // onDateSelect={handleDateSelect}
//             onDateSelect={(date) => handleDateSelect(date)}
//             initialDate={selectedDate}
//           />
//           </View>

//           <RatingInput
//             onRatingChange={handleRatingChange}
//             initialValue={post?.rating}
//           />

//          <UserRatingImpact
//             onRatingChange={handleuserRatingImpactChange}
//             initialValue={post?.rating}
//           />

//         </ScrollView>
//         <Button
//           buttonStyle={{ height: hp(6.2) }}
//           title={post?.id ? "Edit" : "Post New Release"}
//           loading={loading}
//           onPress={onSubmit}
//           hasShadow={false}
//         />
//       </View>
//     </ScreenWrapper>
//   );
// };

// export default NewRelease

// const styles = StyleSheet.create({
//   container: {
//     flex: 1, 
//     marginTop: 14,
//     marginBottom: 10,
//     paddingHorizontal: wp(4), 
//     gap: 15,
//   },
//   file: {
//     height: hp(32),
//     width: '100%',
//     overflow: 'hidden',
//     borderCurve: 'continuous',
//     paddingVertical: wp(8),
//     // Add these properties to make it visible
//     borderWidth: 1,
//     borderColor: theme.colors.gray,
//     borderRadius: theme.radius.md,
//     padding: 7,
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'relative'
// },
//   media: {
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     alignItems: 'center', 
//     borderWidth: 1, 
//     padding: 12, 
//     paddingHorizontal: wp(4),
//     borderRadius: theme.radius.md, 
//     borderCurve: 'continuous', 
//     borderColor: theme.colors.gray
//   },
//   title: {
//     // marginBottom: 10,
//     fontSize: hp(2.5),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//     textAlign: 'center'
//     },
//     header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     },
//     username: {
//     fontSize: hp(2.2),
//     fontWeight: theme. fonts. semibold,
//     color: theme.colors.text,
//     },
//     mediaIcons: {
//       flexDirection: 'row', 
//       alignItems: 'center', 
//       gap: 8,
//       marginLeft: 10
//     },
//     addImageText: {
//       fontSize: hp(2),
//       fontWeight: theme.fonts.semibold,
//       color: theme.colors.text,
//     },
//     avatar: {
//     height: hp(6.5),
//     width: hp(6.5),
//     borderRadius: theme. radius.xl,
//     borderCurve: 'continuous',
//     borderWidth: 1,
//     borderColor: 'rgba(0,0,0,0.1)'
//     },
//     publicText: {
//       fontSize: hp(1.7),
//       fontWeight: theme.fonts.medium,
//       color: theme.colors.textLight,
//       },
//       closeIcon: {
//         position: 'absolute',
//         top: 16,
//         right: 12,
//         padding: 6,
//         borderRadius: 50,
//         backgroundColor: 'rgba(97, 35, 35, 0.14)',
       
//       },
//       label: {
//         fontSize: hp(2),
//         fontWeight: hp(4.5),
//         paddingStart: 10,
//         color: theme.colors.text,
//         paddingBottom: 5
//       },
//       dateInput: {
//         fontSize: hp(2),
//         fontWeight: theme.fonts.semibold,
//         color: theme.colors.text,
//         padding: 24,
//         borderWidth: 1,
//         borderColor: theme.colors.gray,
//         borderRadius: theme.radius.md,
//         borderCurve: 'continuous',
//         marginTop: 10,
//       },
     
// })