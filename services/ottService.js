import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

export const createOrUpdateOtt = async (post) => {
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
    const {data, error} = await supabase.from('streams').upsert(post).select().single();

    if (error){
      console.error("Error in createOrUpdateOtt:", error);
      return { success: false, msg: "Could not create or update your Ott", error: error.message };
    }
    return {success: true, data};
  } catch (error) {
    console.error("Error in createOrUpdateOtt:", error);
    return { success: false, msg: "Could not create or update your Ott", error: error.message };
  }
}

// plese adjust the fetch releses based on rDate oder in ascending
export const fetchOtt = async (limit2=10) => {
  try {
    const {data, error} = await supabase
    .from('streams')
    .select('*')
    .order('rDate', { ascending: false })  
    .limit(limit2);
    // can also order based on created date

    if(error){
      console.log("Error in fetching ottss:", error);
      return { success: false, msg: "Could not fetch Otts", error: error.message };
    }

    return {success: true, data: data};
   
  } catch (error) {
    console.error("Error in fetching otts:", error);
    return { success: false, msg: "Could not fetch Otts", error: error.message };
  }
}