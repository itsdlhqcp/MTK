// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
// import React, { useRef, useState, useEffect } from 'react'
// import ScreenWrapper from '../components/ScreenWrapper'
// import Header from '../components/Header'
// import { useRouter } from 'expo-router'
// import { hp, wp } from '@/helpers/common'
// import theme from '../constants/theme'
// import Icon from '@/assets/icons'
// import Avatar from '../components/Avatar'
// import { useAuth } from '../contexts/AuthContext'
// import RichTextEditor from '../components/RichTextEditor'
// import Button from '@/components/Button'
// import * as ImagePicker from 'expo-image-picker';
// import { getSupabaseFileUrl } from '../services/imageService'

// const CreateFeed = () => {
//   const { user } = useAuth();
//   const bodyRef = useRef(''); 
//   const editorRef = useRef(null);
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [file, setFile] = useState(null);

//   // useEffect(() => {
//   //   (async () => {
//   //     // Request permissions when component mounts
//   //     const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//   //     if (!mediaPermission.granted) {
//   //       Alert.alert(
//   //         "Permission Required",
//   //         "Please allow access to your media library to upload photos and videos.",
//   //         [{ text: "OK" }]
//   //       );
//   //     }
//   //   })();
//   // }, []);

//   const onPick = async (isImage = true) => {
//     try {
//       const mediaConfig = {
//         mediaTypes: isImage 
//           ? ImagePicker.MediaTypeOptions.Images 
//           : ImagePicker.MediaTypeOptions.Videos,
        
//         aspect: [4, 3],
//         quality: isImage ? 0.8 : 1,
//       };

//       if (!isImage) {
//         mediaConfig.duration = 60; // Limit video duration to 60 seconds
//       }

//       let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
//       console.log('result', result);
//       if (!result.canceled){
//         setFile(result.assets[0].uri);
//       }
//     } catch (error) {
//       Alert.alert(
//         "Error",
//         "Failed to pick media. Please try again.",
//         [{ text: "OK" }]
//       );
//     }
//   };

//   const isLocalFile = file => {
//     if (!file) return null;
//     if(typeof file  === 'object') return true;

//     return false;
//   }

//   const getFileType = file => {
//     if (!file) return null;
//     if(isLocalFile(file)) 
//       return file.type;

//     // check image or vedeo
//     if(file.includes('postImage')) {
//       return 'image';
//     }
//     return 'video';
//   }

//   // const getFileUri = file => {
//   //   if (!file) return null;
//   //   if(isLocalFile(file)) {
//   //     return file.uri;
//   //   }
//   //   return getSupabaseFileUrl(file?.uri);
//   // }

//   const getFileUri = file => {
//     if (!file) return null;
//     if(isLocalFile(file)) {
//       return file.uri;  // This expects file to be an object with a uri property
//     }
//     return getSupabaseFileUrl(file?.uri);
// }

//   const onSubmit = async () => {
//     // Implement your submit logic here
//   };

//   const handleEditorChange = (body) => {
//     bodyRef.current = body;
//   };

//   return (
//     <ScreenWrapper bg="white">
//       <Header title="Create Feed" showBackButton={true} />
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

//           <View style={styles.textEditor}>
//             <RichTextEditor 
//               editorRef={editorRef} 
//               onChange={handleEditorChange}
//             />
//           </View>

//           {       
//                 file && (
//                   <View style={styles.file}>
//                     {getFileType(file) == 'video' ? (
//                       <Text style={{ color: 'black', fontSize: 16 }}>Video File Detected</Text>
//                     ) : (
//                       <Image
//                         source={{ uri: getFileUri(file)}}
//                         style={{ width: '100%', height: '100%' }}
//                         resizeMode="cover"
//                       />
//                     )}
//                   </View>
//                 )   
//           }
//           <View style={styles.media}>
//             <Text style={styles.addImageText}>Add new feed</Text>
//             <View style={styles.mediaIcons}>
//               <TouchableOpacity onPress={() => onPick(true)}>
//                 <Icon name="image" size={30} color={theme.colors.dark} />
//               </TouchableOpacity>
//               <TouchableOpacity onPress={() => onPick(false)}>
//                 <Icon name="video" size={37} color={theme.colors.dark} />
//               </TouchableOpacity>
//             </View>
            
//           </View>
//         </ScrollView>
//         <Button
//           buttonStyle={{height: hp(6.2)}}
//           title="Post" 
//           loading={loading}
//           onPress={onSubmit}
//           hasShadow={false}
//         />
//       </View>
//     </ScreenWrapper>
//   );
// };

// export default CreateFeed

// const styles = StyleSheet.create({
//   container: {
//     flex: 1, 
//     marginTop: 14,
//     marginBottom: 10,
//     paddingHorizontal: wp(4), 
//     gap: 15,
//   },
//   file: {
//     height: hp(30),
//     width: '100%',
//     overflow: 'hidden',
//     borderCurve: 'continuous',
//     // Add these properties to make it visible
//     borderWidth: 1,
//     borderColor: theme.colors.gray,
//     marginTop: 10,
//     borderRadius: theme.radius.md,
//     padding: 10,
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
     
// })







import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import theme from '../constants/theme'
import Icon from '@/assets/icons'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import RichTextEditor from '../components/RichTextEditor'
import Button from '@/components/Button'
import * as ImagePicker from 'expo-image-picker';
import { getSupabaseFileUrl } from '../services/imageService'
import { Video } from 'expo-av';
import { createOrUpdatePost } from '../services/postService'

const CreateFeed = () => {
  const { user } = useAuth();
  const bodyRef = useRef(''); 
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  // useEffect(() => {
  //   (async () => {
  //     // Request permissions when component mounts
  //     const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //     if (!mediaPermission.granted) {
  //       Alert.alert(
  //         "Permission Required",
  //         "Please allow access to your media library to upload photos and videos.",
  //         [{ text: "OK" }]
  //       );
  //     }
  //   })();
  // }, []);

  const onPick = async (isImage = true) => {
    try {
      const mediaConfig = {
        mediaTypes: isImage 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        aspect: [4, 3],
        quality: isImage ? 0.8 : 1,
      };

      if (!isImage) {
        mediaConfig.duration = 60;
      }

      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
      console.log('Selected file result:', result);
      
      if (!result.canceled) {
        setFile(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Media picker error:', error);
      Alert.alert(
        "Error",
        "Failed to pick media. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const isLocalFile = file => {
    if (!file) return null;
    // Check if it's a local URI (doesn't start with http/https)
    if (typeof file === 'string') {
      return !file.startsWith('http') && !file.startsWith('https');
    }
    return typeof file === 'object';
  };

  const getFileType = file => {
    if (!file) return null;
    
    // For local files selected through ImagePicker
    if (typeof file === 'string') {
      // Check file extension
      const extension = file.toLowerCase().split('.').pop();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const videoExtensions = ['mp4', 'mov', 'avi', 'wmv'];
      
      if (imageExtensions.includes(extension)) {
        return 'image';
      }
      if (videoExtensions.includes(extension)) {
        return 'video';
      }
    }
    
    // For files from Supabase or other sources
    if (typeof file === 'object' && file.uri) {
      if (file.uri.includes('postImage')) {
        return 'image';
      }
      // Check MIME type if available
      if (file.type) {
        return file.type.startsWith('image/') ? 'image' : 'video';
      }
    }
    
    // If we can't determine the type, assume it's an image for safety
    return 'image';
  };

  const getFileUri = file => {
    if (!file) return null;
    
    // If file is just a URI string, return it directly for local files
    if (typeof file === 'string') {
      return file;
    }
    
    // For object types (from Supabase)
    if (typeof file === 'object' && file.uri) {
      return getSupabaseFileUrl(file.uri);
    }
    
    return null;
  };

    const onSubmit = async () => {
      // Implement your submit logic here
      console.log('Body:', bodyRef.current);
      console.log('Submitting with file:', file);
      if(!bodyRef.current && !file) {
        Alert.alert(
          "Error",
          "Please write something in the post.",
          [{ text: "OK" }]
        );
        return;
      }

      let data = {
        file, 
        body: bodyRef.current,
        userId: user?.id,
      }

      // create Post
      setLoading(false);
      let res = await createOrUpdatePost(data);
      setLoading(false);
      if(res.success){
        setFile(null); 
        bodyRef.current = ''; 
        editorRef.current?.setContentHTML('');
        router.back();
      }else{
        Alert.alert('Post', res.msg);
      }
      consol.log('post res:', res)
    };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };

  return (
    <ScreenWrapper bg="white">
      <Header title="Create Feed" showBackButton={true} />
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

          <View >
            <RichTextEditor 
              editorRef={editorRef} 
              onChange={handleEditorChange}
            />
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
                  isLooping={true}
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
            <Text style={styles.addImageText}>Add new feed</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPick(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onPick(false)}>
                <Icon name="video" size={37} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <Button
          buttonStyle={{ height: hp(6.2) }}
          title="Post" 
          loading={loading}
          onPress={onSubmit}
          hasShadow={false}
        />
      </View>
    </ScreenWrapper>
  );
};

export default CreateFeed

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
     
})
