import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

// export const createOrUpdatePost = async (post) => {
//   try {
//     // Handle file upload for image or video if present
//     if (post.file && typeof post.file === "object") {
//       let isImage = post.file.type === "image";
//       let folderName = isImage ? "postImage" : "postVideo";
//       let fileResult = await uploadProfileImage(folderName, post.file.uri, isImage);
//       if (fileResult.success) {
//         post.file = fileResult.data;
//       } else {
//         return fileResult;
//       }
//     }

//     // Prepare post data for database
//     const postData = {
//       ...post,
//       // // If both file and youtubeLink exist, prioritize file and clear youtubeLink
//       youtubeLink: post.youtubeLink || null
//     };

//     // Insert or update the post in the database
//     const { data, error } = await supabase.from('twists').upsert(postData).select().single();

//     if (error) {
//       console.error("Error in createOrUpdatePost:", error);
//       return { success: false, msg: "Could not create or update your twist", error: error.message };
//     }
    
//     return { success: true, data };
//   } catch (error) {
//     console.error("Error in createOrUpdatePost:", error);
//     return { success: false, msg: "Could not create or update your twist", error: error.message };
//   }
// };

export const createOrUpdatePost = async (post) => {
  try {
    console.log("Starting createOrUpdatePost with data:", post);
    
    // Handle file upload for image or video if present
    if (post.file && typeof post.file === "object") {
      let isImage = post.file.type === "image";
      let folderName = isImage ? "postImage" : "postVideo";
      console.log(`Uploading ${isImage ? 'image' : 'video'} to ${folderName}`);
      
      let fileResult = await uploadProfileImage(folderName, post.file.uri, isImage);
      if (fileResult.success) {
        post.file = fileResult.data;
        console.log("File upload successful:", post.file);
      } else {
        console.error("File upload failed:", fileResult);
        return fileResult;
      }
    } 
    // Handle YouTube link - store in file field
    else if (post.youtubeLink) {
      console.log("Using YouTube link as file:", post.youtubeLink);
      post.file = post.youtubeLink; // Store YouTube link in the file field
    }

    // Prepare post data for database - removing youtubeLink field
    const postData = {
      ...post,
    };
    
    // Remove youtubeLink property since we're storing it in file
    delete postData.youtubeLink;

    console.log("Sending data to Supabase:", postData);

    // Insert or update the post in the database
    const { data, error } = await supabase.from('twists').upsert(postData).select().single();

    if (error) {
      console.error("Supabase error in createOrUpdatePost:", error);
      return { success: false, msg: "Could not create or update your twist", error: error.message };
    }
    
    console.log("Post created/updated successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Exception in createOrUpdatePost:", error);
    return { success: false, msg: "Could not create or update your twist", error: error.message };
  }
};

// fetch twists

// export const fetchPosts = async (limit=10,userId) => {
//   try {
   
//     if(userId){
//       const { data, error } = await supabase
//       .from('twists')
//       .select(`*,user: users (id, name, image),
//         postLikes (*),
//         comments  (count)
//         `,
//       )
//       .order('created_at', { ascending: false })
//       .eq('userId', userId)
//       .limit(limit);
//     if (error) {
//       return { success: false, msg: 'Could not fetch the twists' };
//     }
//     return { success: true, data };
//     }else{
//       const { data, error } = await supabase
//       .from('posts')
//       .select(`*,user: users (id, name, image),
//         postLikes (*),
//         comments  (count)
//         `,
        
//       )
//       .order('created_at', { ascending: false })
//       .limit(limit);
//     if (error) {
//       return { success: false, msg: 'Could not fetch the twists' };
//     }
//     return { success: true, data };
//     }
//   } catch (error) {
//     return { success: false, msg: 'Could not fetch the twists due to an exception' };
//   }
// };

// below api fetch and display file tags and tests

export const fetchPosts = async (limit=10) => {
  try {
    const { data, error } = await supabase
      .from('twists')
      .select(`*,user: users (id, name, image),twistLikes(*),twistUnlikes(*)`)
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

// below is two parts which helps to add and remove twist likes

  export const createTwistLikes = async (addlikes) => {

    const { data, error } = await supabase
    .from('twistLikes')
    .insert(addlikes)
    .select()
    .single();
      try{
        if(error){
          console.log('twist create like error: ', error);
            return {success: false, msg: error?.message};
        }
         return {success: true, data}; 
      }catch(error){
        console.log('got twists like create error', error);
        return {success: false, msg: error?.message};
      }
    }
    
    
    export const removeTwistLikes = async (twistId, userId) => {
    
      const { error } = await supabase
      .from('twistLikes')
      .delete()
      .eq('twistId', twistId)
      .eq('userId', userId);
        try{
          if(error){
            console.log('twist like remove error: ', error);
              return {success: false, msg: error?.message};
          }
           return {success: true}; 
        }catch(error){
          console.log('got twist like removing error', error);
          return {success: false, msg: error?.message};
        }
      }


  // below is two parts which helps to add and remove twist unlikes

  export const createTwistUnlikes = async (addUnlikes) => {

    const { data, error } = await supabase
    .from('twistUnlikes')
    .insert(addUnlikes)
    .select()
    .single();
      try{
        if(error){
          console.log('twist create unlike error: ', error);
            return {success: false, msg: error?.message};
        }
         return {success: true, data}; 
      }catch(error){
        console.log('got twists unlike create error', error);
        return {success: false, msg: error?.message};
      }
    }
    
    
    export const removeTwistUnlikes = async (twistId, userId) => {
    
      const { error } = await supabase
      .from('twistUnlikes')
      .delete()
      .eq('twistId', twistId)
      .eq('userId', userId);
        try{
          if(error){
            console.log('twist unlike remove error: ', error);
              return {success: false, msg: error?.message};
          }
           return {success: true}; 
        }catch(error){
          console.log('got twist unlike removing error', error);
          return {success: false, msg: error?.message};
        }
      }