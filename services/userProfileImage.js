import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer'; 
import { supabase } from '@/lib/supabase';
import { supabaseUrl } from '../constants';

export const getImageSrc = imagePath => {
    if (imagePath) {
        return getSupabaseFileUrl(imagePath);
    }else {
        return require('../assets/images/defaultUser.png');
    }
}

export const getSupabaseFileUrl = filePath =>{
    if (filePath) {
    return {uri: `${supabaseUrl}/storage/v1/object/public/profileImage/${filePath}`}
    }
    return null;
    }

export const uploadProfileImage = async (folderName, isImage=true, fileUri) => {
    try{
     let filename = getFilePath(folderName , isImage);
     // Fixed: Use base64 directly instead of EncodingType
     const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {encoding: 'base64'});
     let imageData = decode(fileBase64); 
     let {data, error} = await supabase.storage.from('profileImage').upload(filename, imageData, {
        cacheControl: '3600',
        upsert: false, 
        contentType: isImage? 'image/*': 'video/*'
     });
     if(error){
        console.log('file upload error', error); 
        return {success: false, msg: 'Could not upload media'};
     }

     console.log('file upload data', data);

     return {success: true, data: data.path};  // Fixed typo in 'success'

    }catch(error){
        console.log('file upload error', error);
        return {success: false, msg: 'Could not upload media'};
    }
}

export const getFilePath = (folderName, isImage) => {
    return `/${folderName}/${(new Date()).getTime()}${isImage? '.png': '.mp4'}`;
}