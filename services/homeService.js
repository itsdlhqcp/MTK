import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

export const createOrUpdatePost = async (post, onProgress) => {
  try {
    console.log("Starting createOrUpdatePost with data:", post);
    
    // Calculate total steps based on what needs to be done
    const needsFileUpload = post.file && typeof post.file === "object";
    let totalSteps = 1; // database save is always 1 step
    if (needsFileUpload) totalSteps++;
    
    let currentStep = 0;

    const updateProgress = (step, message) => {
      currentStep = step;
      const percentage = (step / totalSteps) * 100;
      if (onProgress) {
        onProgress({ percentage, step, message, totalSteps });
      }
    };
    
    // Handle file upload for image or video if present
    if (needsFileUpload) {
      updateProgress(1, "Uploading media...");
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

    // Save to database
    const dbStep = needsFileUpload ? 2 : 1;
    updateProgress(dbStep, "Saving post...");
    // Insert or update the post in the database
    const { data, error } = await supabase.from('twists').upsert(postData).select().single();

    if (error) {
      console.error("Supabase error in createOrUpdatePost:", error);
      return { success: false, msg: "Could not create or update your twist", error: error.message };
    }
    
    updateProgress(totalSteps, "Complete!");
    console.log("Post created/updated successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Exception in createOrUpdatePost:", error);
    return { success: false, msg: "Could not create or update your twist", error: error.message };
  }
};

// below api fetch and display file tags and tests

// export const fetchPosts = async (limit=10) => {
//   try {
//     const { data, error } = await supabase
//       .from('twists')
//       .select(`*,user: users (id, name, image),twistLikes(*),twistUnlikes(*),tcomments(count)`)
//       .order('created_at', { ascending: false })
//       .limit(limit);
//     if (error) {
//       return { success: false, msg: 'Could not fetch the posts' };
//     }
//     return { success: true, data };
//   } catch (error) {
//     return { success: false, msg: 'Could not fetch the posts due to an exception' };
//   }
// };


export const fetchPosts = async (limit=10,userId) => {
    try {
     
      if(userId){
        const { data, error } = await supabase
        .from('twists')
        .select(`*,user: users (id, name, image),twistLikes(*),twistUnlikes(*),tcomments(count)`)
        .order('created_at', { ascending: false })
        .eq('userId', userId)
        .limit(limit);
      if (error) {
        return { success: false, msg: 'Could not fetch the posts' };
      }
      return { success: true, data };
      }else{
        const { data, error } = await supabase
        .from('twists')
        .select(`*,user: users (id, name, image),twistLikes(*),twistUnlikes(*),tcomments(count)`)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        return { success: false, msg: 'Could not fetch the posts' };
      }
      return { success: true, data };
      }
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

      // create a service which fetched the twist details 

        export const fetchPostDetails = async (postId) => {
          try {
            const { data, error } = await supabase
              .from('twists')
              .select(`*,user: users (id, name, image),
                twistLikes(*),
                tcomments(*,
                user: users(id, name, image),
                treply(*),  
                ctwistLikes(*),
                ctwistUnlikes(*))
                `,
                
              )
              .eq('id', postId)
              .order("created_at", { ascending: false, foreignTable: "tcomments", foreignColumn: "treply" })
              .single();
            if (error) {
              console.log('Fech twist details error: ', error);
              return { success: false, msg: 'Could not fetch posts' };
            }
            return { success: true, data };
          } catch (error) {
            return { success: false, msg: 'Could not fetch the twists due to an exception' };
          }
        };

         // this is a function to create a comment

         export const createComment = async (comment) => {
            try {
                const { data, error } = await supabase  // Destructure both data and error
                    .from('tcomments')
                    .insert(comment)
                    .select()
                    .single();
            
                if (error) {
                    console.log('twist comment error: ', error);
                    return { 
                        success: false, 
                        msg: 'Could not create twist comment' 
                    };
                }
                
                return { 
                    success: true, 
                    data, 
                    action: 'twist commented' 
                };
            
            } catch (error) {
                console.log('twist comment error: ', error);
                return { 
                    success: false, 
                    msg: 'Could not process twist comment action' 
                };
            }
        }

        // create a function to delete the comment 

        export const removeComment = async (commentId) => {
          try {
            const {error} = await supabase.from('tcomments').
            delete().
            eq('id', commentId);
         
            if (error) {
              console.log('removeComment error: ', error);
              return { success: false, msg: 'Could not remove comment' };
            }
            return { success: true, data: {commentId}};
          } catch (error) {
            return { success: false, msg: 'Could not remove feed comment' };
          }
        };

        // function to remove twist post

        export const removePost = async (postId) => {
          try {
            const {error} = await supabase.from('twists').
            delete().
            eq('id', postId);
         
            if (error) {
              console.log('removePost error: ', error);
              return { success: false, msg: 'Could not remove Post' };
            }
            return { success: true, data: {postId}};
          } catch (error) {
            return { success: false, msg: 'Could not remove feed post' };
          }
        };


        // here is the function to create a tcomment reply 

        export const createReply = async (reply) => {
          try {
              const { data, error } = await supabase
                  .from('treply')
                  .insert({
                    userId: reply.userId,
                    text: reply.text,
                    tcommentId: reply.parentCommentId  // Use parentCommentId as commentId
                  })
                  .select()
                  .single();
          
              if (error) {
                  console.log('twist comment reply error: ', error);
                  return { 
                      success: false, 
                      msg: 'Could not create twist comment reply' 
                  };
              }
              
              return { 
                  success: true, 
                  data, 
                  action: 'twist comment replied' 
              };
          
          } catch (error) {
              console.log('twist comment reply error: ', error);
              return { 
                  success: false, 
                  msg: 'Could not process twist comment reply action' 
              };
          }
        }

/// function to fetch comment replies

        export const fetchCommentReplies = async (commentId) => {
          try {
            const { data, error } = await supabase
              .from('treply')
              .select(`
                *,
                user: users(id, name, image),
                   treplyLikes(*) 
              `)
              .eq('tcommentId', commentId)
              .order('created_at', { ascending: true });
        
            if (error) {
              console.log('Fetch twist replies error: ', error);
              return { success: false, msg: 'Could not fetch twist replies' };
            }
        
            return { success: true, data };
          } catch (error) {
            return { success: false, msg: 'Could not fetch twist replies' };
          }
        };

        // function to create comment likes 
        export const createCommentLike = async (addlike) => {
        
          const { data, error } = await supabase
          .from('ctwistLikes')
          .insert(addlike)
          .select()
          .single();
            try{
              if(error){
                console.log('twist comment like error: ', error);
                  return {success: false, msg: error?.message};
              }
               return {success: true, data}; 
            }catch(error){
              console.log('got twist comment like create error', error);
              return {success: false, msg: error?.message};
            }
          }

          // function to create comment reply likes
          export const removeCommentLike = async (commentId, userId) => {
  
            const { error } = await supabase
            .from('ctwistLikes')
            .delete()
            .eq('tcommentId', commentId)
            .eq('userId', userId);
              try{
                if(error){
                  console.log('people comment like remove error: ', error);
                    return {success: false, msg: error?.message};
                }
                 return {success: true}; 
              }catch(error){
                console.log('got comment like removing error', error);
                return {success: false, msg: error?.message};
              }
            }

            // create and remove comment unlikes apis
            
            export const createCommentUnlike = async (removelike) => {
            
              const { data, error } = await supabase
              .from('ctwistUnlikes')
              .insert(removelike)
              .select()
              .single();
                try{
                  if(error){
                    console.log('comment unlike error: ', error);
                      return {success: false, msg: error?.message};
                  }
                   return {success: true, data}; 
                }catch(error){
                  console.log('got comment unlike create error', error);
                  return {success: false, msg: error?.message};
                }
              }
              
              export const removeCommentUnlike = async (commentId, userId) => {
              
                const { error } = await supabase
                .from('ctwistUnlikes')
                .delete()
                .eq('tcommentId', commentId)
                .eq('userId', userId);
                  try{
                    if(error){
                      console.log('people comment unlike remove error: ', error);
                        return {success: false, msg: error?.message};
                    }
                     return {success: true}; 
                  }catch(error){
                    console.log('got comment unlike removing error', error);
                    return {success: false, msg: error?.message};
                  }
                }

      // create and remove comment reply likes apis
                
      export const createCommentReplylike = async (replylike) => {
                
        const { data, error } = await supabase
        .from('treplyLikes')
        .insert(replylike)
        .select()
        .single();
          try{
            if(error){
              console.log('comment twist reply like error: ', error);
                return {success: false, msg: error?.message};
            }
             return {success: true, data}; 
          }catch(error){
            console.log('got twist comment reply like create error', error);
            return {success: false, msg: error?.message};
          }
        }
        
        export const removeCommentReplyunlike = async (replyId, userId) => {
        
          const { error } = await supabase
          .from('treplyLikes')
          .delete()
          .eq('treplyId ', replyId)
          .eq('userId', userId);
            try{
              if(error){
                console.log('people twist comment reply like remove error: ', error);
                  return {success: false, msg: error?.message};
              }
               return {success: true}; 
            }catch(error){
              console.log('got comment twsit reply like removing error', error);
              return {success: false, msg: error?.message};
            }
          }

          // create a service to fetch twists of that user into profile
          export const fetchTwists = async (limit=10,userId) => {
            try {
              if(userId){
                const { data, error } = await supabase
                .from('twists')
                .select(`*,user: users (id, name, image)
                  `,
                )
                .order('created_at', { ascending: false })
                .eq('userId', userId)
                .limit(limit);
              if (error) {
                return { success: false, msg: 'Could not fetch the twists' };
              }
              return { success: true, data };
              }else{
                const { data, error } = await supabase
                .from('twists')
                .select(`*,user: users (id, name, image)
                  `,
                )
                .order('created_at', { ascending: false })
                .limit(limit);
              if (error) {
                return { success: false, msg: 'Could not fetch the twist' };
              }
              return { success: true, data };
              }
            } catch (error) {
              return { success: false, msg: 'Could not fetch the twists due to an exception' };
            }
          };

          export const searchTwists = async (query, limit = 10) => {
            try {
              if (!query || query.trim() === '') {
                return { success: true, data: [] };
              }
          
              const searchTerm = `%${query.toLowerCase()}%`;
          
              const { data, error } = await supabase
                .from('twists')
                .select(`
                  *,
                  user: users (id, name, image),
                  twistLikes(*),
                  twistUnlikes(*),
                  tcomments(count)
                `)
                .or(`body.ilike.${searchTerm}`)
                .order('created_at', { ascending: false })
                .limit(limit);
          
              if (error) {
                console.error('Search error:', error);
                return { success: false, msg: 'Failed to search twists' };
              }
          
              return { success: true, data };
            } catch (error) {
              console.error('Exception in searchTwists:', error);
              return { success: false, msg: 'Could not search twists due to an exception' };
            }
          };


                
            