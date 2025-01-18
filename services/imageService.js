
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';    // try delete this library if not used
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { supabaseUrl } from '../constants';
import { Platform } from 'react-native';

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




  export const getLocalFilePath = (filePath) => {
    // Ensure we have a valid filename by removing query parameters
    const fileName = filePath.split('/').pop().split('?')[0];
    return `${FileSystem.documentDirectory}${fileName}`;
  };
  
  export const downloadFile = async (url) => {
    try {
      // Check if file already exists
      const localPath = getLocalFilePath(url);
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      
      if (!fileInfo.exists) {
        const { uri } = await FileSystem.downloadAsync(url, localPath);
        return uri;
      }
      return localPath;
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }; 

  // Sharing utility function
export const shareContent = async ({ message, fileUrl }) => {
  try {
    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      throw new Error('Sharing is not available on this platform');
    }

    // If we have a file to share
    if (fileUrl) {
      const localUri = await downloadFile(fileUrl);
      if (!localUri) {
        throw new Error('Failed to download file');
      }

      if (Platform.OS === 'ios') {
        // For iOS, we can share both message and file together
        await Share.share({
          message: message || '',
          url: localUri
        });
      } else {
        // For Android, we'll use Intent.ACTION_SEND to share both file and text
        // First, create the sharing options
        const options = {
          mimeType: getMimeType(fileUrl),
          UTI: getMimeType(fileUrl),
        };

        // On Android, we need to use Intent extras to include both file and text
        if (message) {
          options.dialogTitle = message;
          // Try multiple approaches to include the message
          options.message = message;
          options.text = message;
          // Some Android apps look for these specific extras
          options.android = {
            extraText: message,
            social: message
          };
        }

        // Use the native sharing
        await Sharing.shareAsync(localUri, options);
      }
    } else {
      // For text-only sharing
      await Share.share({
        message: message || ''
      });
    }

    return true;
  } catch (error) {
    console.error('Sharing error:', error);
    throw error;
  }
};


  const getMimeType = (fileUrl) => {
    const extension = fileUrl.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Add more mime types as needed
    };
    return mimeTypes[extension] || 'application/octet-stream';
  };

export const getFilePath = (folderName, isImage) => {
    const timestamp = new Date().getTime();
    const extension = isImage ? '.png' : '.mp4';
    return `/${folderName}/${timestamp}${extension}`;
};