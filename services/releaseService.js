import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

export const createOrUpdateRelease = async (post) => {
  try {
    if (post.file && typeof post.file === "object") {
      let isImage = post.file.type === "image";
      let folderName = isImage ? "postImage" : "postVideo";
      let fileResult = await uploadProfileImage(folderName, post.file.uri, isImage);
      if (fileResult.success) {
        post.file = fileResult.data;
      } else {
        return fileResult;
      }
    }
    const {data, error} = await supabase.from('releases').upsert(post).select().single();

    if (error){
      console.error("Error in createOrUpdateRelease:", error);
      return { success: false, msg: "Could not create or update your Release", error: error.message };
    }
    return {success: true, data};
  } catch (error) {
    console.error("Error in createOrUpdateRelease:", error);
    return { success: false, msg: "Could not create or update your Release", error: error.message };
  }
}

// plese adjust the fetch releses based on rDate oder in ascending
export const fetchReleases = async (limit=10) => {
  try {
    const {data, error} = await supabase
    .from('releases')
    .select('*')
    .order('rDate', { ascending: false })  
    .limit(limit);
    // can also order based on created date

    if(error){
      console.log("Error in fetching releases:", error);
      return { success: false, msg: "Could not fetch Releases", error: error.message };
    }

    return {success: true, data: data};
   
  } catch (error) {
    console.error("Error in fetching releases:", error);
    return { success: false, msg: "Could not fetch Releases", error: error.message };
  }
}

export const fetchReleaseDetails = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .eq('id', postId)
      .single();
    if (error) {
      console.log('Fetch releases details error: ', error);
      return { success: false, msg: 'Could not fetch releases' };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch the posts releases'};
  }
};