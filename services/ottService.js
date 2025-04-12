import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

export const createOrUpdateOtt = async (post) => {
  try {
    // Handle first file upload (file)
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
    
    // Handle second file upload (filel)
    if (post.filel && typeof post.filel === "object") {
      let isImage = post.filel.type === "image";
      let folderName = isImage ? "postImage" : "postVideo";
      let fileResult = await uploadProfileImage(folderName, post.filel.uri, isImage);
      if (fileResult.success) {
        post.filel = fileResult.data;
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


export const fetchReleaseDetails = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select(`*,
         user: users (id, name, image),
         preview(*, user: users(id, name, image),previewsreply(*))`
       )
      .eq('id', postId)
      .order("created_at", { ascending: false, foreignTable: "preview", foreignColumn: "created_at" })
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

// export const fetchReleaseDetails = async (postId) => {
//   try {
//     const { data, error } = await supabase
//       .from('streams')
//       .select(`*,
//         user: users (id, name, image),
//         preview(*, user: users(id, name, image))
//         `
//        )
//       .eq('id', postId)
//       .order("created_at", { ascending: false, foreignTable: "preview", foreignColumn: "created_at" })
//       .single();
//     if (error) {
//       console.log('Fetch ott details error: ', error);
//       return { success: false, msg: 'Could not fetch otts' };
//     }
//     return { success: true, data };
//   } catch (error) {
//     return { success: false, msg: 'Could not fetch the posts of otts'};
//   }
// };


// api to create peoples reviews
export const createReleaseReview = async (release) => {
  try {
      const { data, error } = await supabase  // Destructure both data and error
          .from('preview')
          .insert(release)
          .select()
          .single();
  
      if (error) {
          console.log('stream review error: ', error);
          return { 
              success: false, 
              msg: 'Could not create stream review comment' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'stream reviewed'
      };
  
  } catch (error) {
      console.log('stream review error: ', error);
      return { 
          success: false, 
          msg: 'Could not process strem review action' 
      };
  }
}


// review delete function
export const removeReview = async (reviewId) => {
  try {
    const {error} = await supabase.from('preview').
    delete().
    eq('id', reviewId);
 
    if (error) {
      console.log('removeReview error: ', error);
      return { success: false, msg: 'Could not remove ott review' };
    }
    return { success: true, data: {reviewId}};
  } catch (error) {
    return { success: false, msg: 'Could not remove ott review' };
  }
};

// api for crear=ting preview reply function

export const createReviewReply = async (review) => {
  try {
      const { data, error } = await supabase
          .from('previewsreply')
          .insert({
            userId: review.userId,
            text: review.text,
            previewId: review.parentReviewId  // Use parentCommentId as commentId
          })
          .select()
          .single();
  
      if (error) {
          console.log('preview reply error: ', error);
          return { 
              success: false, 
              msg: 'Could not create preview reply' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'stream review replied' 
      };
  
  } catch (error) {
      console.log('release preview reply error: ', error);
      return { 
          success: false, 
          msg: 'Could not process preview reply action' 
      };
  }
}

//api for fetching preview relies
export const fetchReviewReplies = async (reviewId) => {
  try {
    const { data, error } = await supabase
      .from('previewsreply')
      .select(`
        *,
        user: users(id, name, image)
      `)
      .eq('previewId', reviewId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Fetch preview replies error: ', error);
      return { success: false, msg: 'Could not fetch preview replies' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch preview replies' };
  }
};

// below are the set of services for the peoples reviews 

export const fetchPeoplesReleaseDetails = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select(`*,
        user: users(id, name, image),
        dpeopreviews(*, user: users(id, name, image),
        dupvote(*),ddownvotes(*),replydpeopreviews(*))
        `
       )
      .eq('id', postId)
      .order("created_at", { ascending: false, foreignTable: "dpeopreviews", foreignColumn: "created_at" })
      .single();
    if (error) {
      console.log('Fetch peoples stream details error: ', error);
      return { success: false, msg: 'Could not people fetch streams' };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch the peoples streams releases'};
  }
};

// this is the peoples review create process

export const createPeopleReleaseReview = async (reviewpeople) => {
  try {
      const { data, error } = await supabase  // Destructure both data and error
          .from('dpeopreviews')
          .insert(reviewpeople)
          .select()
          .single();
  
      if (error) {
          console.log('ott people review error: ', error);
          return { 
              success: false, 
              msg: 'Could not create ott people release review' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'people ott relaese reviewed'
      };
  
  } catch (error) {
      console.log('peopele ott release review error: ', error);
      return { 
          success: false, 
          msg: 'Could not proccess people release review action' 
      };
  }
}


/// below is the api which used to remove the preview fromthe stream

export const removePeopleReview = async (reviewId) => {
  try {
    const {error} = await supabase.from('dpeopreviews').
    delete().
    eq('id', reviewId);
 
    if (error) {
      console.log('removePeoplePreview error: ', error);
      return { success: false, msg: 'Could not remove people preview' };
    }
    return { success: true, data: {reviewId}};
  } catch (error) {
    return { success: false, msg: 'Could not remove people stream preview' };
  }
};

// below is the api to create people preview reply 

export const createPeopleReviewReply = async (review) => {
  try {
      const { data, error } = await supabase
          .from('replydpeopreviews')    
          .insert({
            userId: review.userId,
            text: review.text,
            replypreviewId: review.parentReviewId  // Use parentCommentId as commentId replyPeopleReviews peoplesReviewId
          })
          .select()
          .single();
  
      if (error) {
          console.log('peoples preview reply error: ', error);
          return { 
              success: false, 
              msg: 'Could not create peoples preview reply' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'stream  peoples preview replied' 
      };
  
  } catch (error) {
      console.log('stream peopeles preview reply error: ', error);
      return { 
          success: false, 
          msg: 'Could not process peoples preview reply action' 
      };
  }
}

// fetch stream preview replies

export const fetchPeopleReviewReplies = async (reviewId) => {
  try {
    const { data, error } = await supabase
      .from('replydpeopreviews')
      .select(`
        *,
        user: users(id, name, image),
        dplikes(*)
      `)
      .eq('replypreviewId', reviewId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Fetch peoples preview replies error: ', error);
      return { success: false, msg: 'Could not fetch peopeles preview replies' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch peopeles preview replies' };
  }
};

export const removeReplyPeopleReview = async (reviewId) => {
  try {
    const {error} = await supabase.from('replydpeopreviews').
    delete().
    eq('id', reviewId);
 
    if (error) {
      console.log('removePeopleReview reply error: ', error);
      return { success: false, msg: 'Could not remove people review reply' };
    }
    return { success: true, data: {reviewId}};
  } catch (error) {
    return { success: false, msg: 'Could not remove people release review reply' };
  }
};

// create a people review downvote dupvote

export const createPeopleReviewUpvote = async (upvote) => {

  const { data, error } = await supabase
  .from('dupvote')
  .insert(upvote)
  .select()
  .single();
    try{
      if(error){
        console.log('people preview upvote error: ', error);
          return {success: false, msg: error?.message};
      }
       return {success: true, data}; 
    }catch(error){
      console.log('got upvote create error', error);
      return {success: false, msg: error?.message};
    }
  
  }
  
  
  export const removePeopleReviewUpvote = async (peoplesReviewId, userId) => {
  
    const { error } = await supabase
    .from('dupvote')
    .delete()
    .eq('dpeopleReviewId', peoplesReviewId)
    .eq('userId', userId);
      try{
        if(error){
          console.log('people preview upvote remove error: ', error);
            return {success: false, msg: error?.message};
        }
         return {success: true}; 
      }catch(error){
        console.log('got people preview upvote removing error', error);
        return {success: false, msg: error?.message};
      }
    
    }

  // create and remove people review downvote

    export const createPeopleReviewDownvote = async (downupvote) => {

      const { data, error } = await supabase
      .from('ddownvotes')
      .insert(downupvote)
      .select()
      .single();
        try{
          if(error){
            console.log('people preview downvote error: ', error);
              return {success: false, msg: error?.message};
          }
           return {success: true, data}; 
        }catch(error){
          console.log('got downvote create error', error);
          return {success: false, msg: error?.message};
        }
      
      }
      
      
      export const removePeopleReviewDownvote = async (peoplesReviewId, userId) => {
      
        const { error } = await supabase
        .from('ddownvotes')
        .delete()
        .eq('dpeopleReviewId', peoplesReviewId)
        .eq('userId', userId);
          try{
            if(error){
              console.log('people preview downvote remove error: ', error);
                return {success: false, msg: error?.message};
            }
             return {success: true}; 
          }catch(error){
            console.log('got peoples preview downvote removing error', error);
            return {success: false, msg: error?.message};
          }
        
        }

        export const createPeopleReviewReplyLike = async (addreply) => {

          const { data, error } = await supabase
          .from('dplikes')
          .insert(addreply)
          .select()
          .single();
            try{
              if(error){
                console.log('people preview reply like error: ', error);
                  return {success: false, msg: error?.message};
              }
               return {success: true, data}; 
            }catch(error){
              console.log('got preview reply like create error', error);
              return {success: false, msg: error?.message};
            }
          }
          
          export const removePeopleReviewReplyLike = async (peoplesReviewId, userId) => {
          
            const { error } = await supabase
            .from('dplikes')
            .delete()
            .eq('replydpeoplereviewId', peoplesReviewId)  
            .eq('userId', userId);
              try{
                if(error){
                  console.log('people review reply like remove error: ', error);
                    return {success: false, msg: error?.message};
                }
                 return {success: true}; 
              }catch(error){
                console.log('got reply like removing error', error);
                return {success: false, msg: error?.message};
              }
            
            }


            export const updatePeopleReview = async (reviewId, reviewData) => {
              try {
                const { data, error } = await supabase
                  .from('dpeopreviews')
                  .update({
                    text: reviewData.text,
                    favour: reviewData.favour
                  })
                  .eq('id', reviewId)
            
                if (error) {
                  console.log('update people review error: ', error);
                  return { 
                    success: false, 
                    msg: 'Could not update people review' 
                  };
                }
                return { 
                  success: true, 
                  data, 
                  action: 'people review updated'
                };
            
              } catch (error) {
                console.log('update people review error: ', error);
                return { 
                  success: false, 
                  msg: 'Could not process people review update action' 
                };
              }
            };
        
        