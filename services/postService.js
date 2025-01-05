import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

// export const createOrUpdatePost = async (post) => {
//     try {
//       if (post.file && typeof post.file === 'object') {
//         let isImage = post?.file?.type === 'image';
//         let folderName = isImage ? 'postImages' : 'postVideos';
//         console.log(`Uploading file to folder: ${folderName}`);
//         let fileResult = await uploadProfileImage(folderName, post?.file?.uri, isImage);
//         if (fileResult.success) {
//            post.file = fileResult.data;
//         }else{
//             return fileResult;
//         }
//       }

//       const { data, error } = await supabase
//       .from('posts') 
//       .upsert(post)
//       .select()
//       .single();
//       if(error){
//         console.log('createPost error: ', error);
//         return { success: false, msg: 'Could not create your post' };
//       }
//       return {success: true, data: data};
//     } catch (error) {
//       console.log('createPost error: ', error);
//       return { success: false, msg: 'Could not create your post' };
//     }
//   };


export const createOrUpdatePost = async (post) => {
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
    const {data, error} = await supabase.from('posts').upsert(post).select().single();

    if (error){
      console.error("Error in createOrUpdatePost:", error);
      return { success: false, msg: "Could not create or update your post", error: error.message };
    }
    return {success: true, data};
  } catch (error) {
    console.error("Error in createOrUpdatePost:", error);
    return { success: false, msg: "Could not create or update your post", error: error.message };
  }
};


  
export const fetchPosts = async (limit=10) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`*,user: users (id, name, image)`)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        return { success: false, msg: 'Could not fetch the posts' };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, msg: 'Could not fetch the posts due to an exception' };
    }
  };
  
  