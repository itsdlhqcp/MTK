// import * as FileSystem from 'expo-file-system';
// import { decode } from 'base64-arraybuffer'; 
// import { supabase } from '@/lib/supabase';
// import { supabaseUrl } from '../constants';

// export const getImageSrc = imagePath => {
//     if (imagePath) {
//         return getSupabaseFileUrl(imagePath);
//     }else {
//         return require('../assets/images/defaultUser.png');
//     }
// }

// export const getSupabaseFileUrl = filePath =>{
//     if (filePath) {
//     return {uri: `${supabaseUrl}/storage/v1/object/public/profileImage/${filePath}`}
//     }
//     return null;
//     }

// export const uploadProfileImage = async (folderName, isImage=true, fileUri) => {
//     try{
//      let filename = getFilePath(folderName , isImage);
//      // Fixed: Use base64 directly instead of EncodingType
//      const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {encoding: 'base64'});
//      let imageData = decode(fileBase64); 
//      let {data, error} = await supabase.storage.from('profileImage').upload(filename, imageData, {
//         cacheControl: '3600',
//         upsert: false, 
//         contentType: isImage? 'image/*': 'video/*'
//      });
//      if(error){
//         console.log('file upload error', error); 
//         return {success: false, msg: 'Could not upload media'};
//      }

//      console.log('file upload data', data);

//      return {success: true, data: data.path};  // Fixed typo in 'success'

//     }catch(error){
//         console.log('file upload error', error);
//         return {success: false, msg: 'Could not upload media'};
//     }
// }

// export const getFilePath = (folderName, isImage) => {
//     return `/${folderName}/${(new Date()).getTime()}${isImage? '.png': '.mp4'}`;
// }






import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { supabaseUrl } from '../constants';

export const getImageSrc = imagePath => {
    if (imagePath) {
        return getSupabaseFileUrl(imagePath);
    }
    return require('../assets/images/defaultUser.png');
};

export const getSupabaseFileUrl = filePath => {
    if (filePath) {
        return { uri: `${supabaseUrl}/storage/v1/object/public/profileImage/${filePath}` };
    }
    return null;
};

export const uploadProfileImage = async (folderName, fileUri, isImage = true) => {
    try {
      if (!fileUri) {
        throw new Error('File URI is required');
      }
  
      const filename = getFilePath(folderName, isImage);
      
      // Verify file exists and get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist at path: ' + fileUri);
      }
  
      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      if (!fileBase64) {
        throw new Error('Failed to read file as base64');
      }
  
      // Convert to array buffer
      const fileData = decode(fileBase64);
  
      // Set appropriate content type
      const contentType = isImage ? 'image/jpeg' : 'video/mp4';
  
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('profileImage')
        .upload(filename, fileData, {
          contentType,
          cacheControl: '3600',
          upsert: true // Allow overwriting
        });
  
      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }
  
      return {
        success: true,
        data: data.path
      };
  
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        msg: error.message || 'Failed to upload file',
        error
      };
    }
  };

// export const uploadProfileImage = async (folderName, isImage = true, fileUri) => {
//     try {
//         if (!fileUri) {
//             throw new Error('File URI is required');
//         }

//         const filename = getFilePath(folderName, isImage);
        
//         // Check if file exists before reading
//         const fileInfo = await FileSystem.getInfoAsync(fileUri);
//         if (!fileInfo.exists) {
//             throw new Error('File does not exist');
//         }

//         // Read file with explicit options
//         const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
//             encoding: FileSystem.EncodingType.Base64
//         });

//         if (!fileBase64) {
//             throw new Error('Failed to read file as base64');
//         }

//         // Convert base64 to array buffer
//         const imageData = decode(fileBase64);

//         // Upload to Supabase with proper content type
//         const contentType = isImage ? 'image/png' : 'video/mp4';
//         const { data, error } = await supabase.storage
//             .from('profileImage')
//             .upload(filename, imageData, {
//                 cacheControl: '3600',
//                 upsert: false,
//                 contentType
//             });

//         if (error) {
//             console.error('Supabase upload error:', error);
//             return {
//                 success: false,
//                 msg: 'Could not upload media',
//                 error: error.message
//             };
//         }

//         return {
//             success: true,
//             data: data.path
//         };

//     } catch (error) {
//         console.error('File upload error:', error);
//         return {
//             success: false,
//             msg: error.message || 'Could not upload media',
//             error: error
//         };
//     }
// };

export const getFilePath = (folderName, isImage) => {
    const timestamp = new Date().getTime();
    const extension = isImage ? '.png' : '.mp4';
    return `/${folderName}/${timestamp}${extension}`;
};