// import { uploadProfileImage } from "./imageService";
// import { supabase } from "../lib/supabase";

// export const createOrUpdateRelease = async (post) => {
//   try {
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
//     const {data, error} = await supabase.from('releases').upsert(post).select().single();

//     if (error){
//       console.error("Error in createOrUpdateRelease:", error);
//       return { success: false, msg: "Could not create or update your Release", error: error.message };
//     }
//     return {success: true, data};
//   } catch (error) {
//     console.error("Error in createOrUpdateRelease:", error);
//     return { success: false, msg: "Could not create or update your Release", error: error.message };
//   }
// }

import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

export const createOrUpdateRelease = async (post) => {
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
    .select('*, reviews(count), peoplesReview(count)')
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

export const fetchReleaseDetailsx = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select(`*,
        user: users(id, name, image),
        reviews(*, user: users(id, name, image),replyReviews(*))
        `
       )
      .eq('id', postId)
      .order("created_at", { ascending: false, foreignTable: "reviews", foreignColumn: "created_at" })
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

// api for managing reviews of release

export const createReleaseReview = async (release) => {
  try {
      const { data, error } = await supabase  // Destructure both data and error
          .from('reviews')
          .insert(release)
          .select()
          .single();
  
      if (error) {
          console.log('release review error: ', error);
          return { 
              success: false, 
              msg: 'Could not create release review comment' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'relaese reviewed'
      };
  
  } catch (error) {
      console.log('release review error: ', error);
      return { 
          success: false, 
          msg: 'Could not process release review action' 
      };
  }
}

// review delete function
export const removeReview = async (reviewId) => {
  try {
    const {error} = await supabase.from('reviews').
    delete().
    eq('id', reviewId);
 
    if (error) {
      console.log('removeReview error: ', error);
      return { success: false, msg: 'Could not remove review' };
    }
    return { success: true, data: {reviewId}};
  } catch (error) {
    return { success: false, msg: 'Could not remove release review' };
  }
};

// export const createReview = async (review) => {
//   try {
//       const { data, error } = await supabase  // Destructure both data and error
//           .from('reviews')
//           .insert(review)
//           .select()
//           .single();
  
//       if (error) {
//           console.log('review error: ', error);
//           return { 
//               success: false, 
//               msg: 'Could not create review' 
//           };
//       }
      
//       return { 
//           success: true, 
//           data, 
//           action: 'post reviewed' 
//       };
  
//   } catch (error) {
//       console.log('post review error: ', error);
//       return { 
//           success: false, 
//           msg: 'Could not process post review action' 
//       };
//   }
// }

// replyReview services here 

export const createReviewReply = async (review) => {
  try {
      const { data, error } = await supabase
          .from('replyReviews')
          .insert({
            userId: review.userId,
            text: review.text,
            reviewId: review.parentReviewId  // Use parentCommentId as commentId
          })
          .select()
          .single();
  
      if (error) {
          console.log('post review reply error: ', error);
          return { 
              success: false, 
              msg: 'Could not create review reply' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'release review replied' 
      };
  
  } catch (error) {
      console.log('release review reply error: ', error);
      return { 
          success: false, 
          msg: 'Could not process review reply action' 
      };
  }
}

// In postService.js
export const fetchReviewReplies = async (reviewId) => {
  try {
    const { data, error } = await supabase
      .from('replyReviews')
      .select(`
        *,
        user: users(id, name, image)
      `)
      .eq('reviewId', reviewId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Fetch review replies error: ', error);
      return { success: false, msg: 'Could not fetch review replies' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch review replies' };
  }
};


// below are the api for managing people reviews

export const createPeopleReleaseReview = async (reviewpeople) => {
  try {
      const { data, error } = await supabase  // Destructure both data and error
          .from('peoplesReview')
          .insert(reviewpeople)
          .select()
          .single();
  
      if (error) {
          console.log('people release review error: ', error);
          return { 
              success: false, 
              msg: 'Could not create people release review' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'people relaese reviewed'
      };
  
  } catch (error) {
      console.log('peopele release review error: ', error);
      return { 
          success: false, 
          msg: 'Could not proccess  people release review action' 
      };
  }
}


export const fetchPeoplesReleaseDetails = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select(`*,
        user: users (id, name, image),
        peoplesReview(*, user: users(id, name, image),
         threviewupvote(*),threviewdownvote(*),replyPeopleReviews(*))
        `
       )
      .eq('id', postId)
      .order("created_at", { ascending: false, foreignTable: "peoplesReview", foreignColumn: "created_at" })
      .single();
    if (error) {
      console.log('Fetch peoples releases details error: ', error);
      return { success: false, msg: 'Could not peoplw fetch releases' };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch the peoples reviews releases'};
  }
};


export const removePeopleReview = async (reviewId) => {
  try {
    const {error} = await supabase.from('peoplesReview').
    delete().
    eq('id', reviewId);
 
    if (error) {
      console.log('removePeopleReview error: ', error);
      return { success: false, msg: 'Could not remove people review' };
    }
    return { success: true, data: {reviewId}};
  } catch (error) {
    return { success: false, msg: 'Could not remove people release review' };
  }
};

export const createPeopleReviewReply = async (review) => {
  try {
      const { data, error } = await supabase
          .from('replyPeopleReviews')
          .insert({
            userId: review.userId,
            text: review.text,
            peoplesReviewId: review.parentReviewId  // Use parentCommentId as commentId replyPeopleReviews peoplesReviewId
          })
          .select()
          .single();
  
      if (error) {
          console.log('peoples review reply error: ', error);
          return { 
              success: false, 
              msg: 'Could not create peoples review reply' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'release  peoples review replied' 
      };
  
  } catch (error) {
      console.log('release peopeles review reply error: ', error);
      return { 
          success: false, 
          msg: 'Could not process peoples review reply action' 
      };
  }
}

export const fetchPeopleReviewReplies = async (reviewId) => {
  try {
    const { data, error } = await supabase
      .from('replyPeopleReviews')
      .select(`
        *,
        user: users(id, name, image),
        pepreplylikes(*)
      `)
      .eq('peoplesReviewId', reviewId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Fetch peoples review replies error: ', error);
      return { success: false, msg: 'Could not fetch peopeles review replies' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch peopeles review replies' };
  }
};

export const removeReplyPeopleReview = async (reviewId) => {
  try {
    const {error} = await supabase.from('replyPeopleReviews').
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


//   // UPvote service
//   export const createPostUpvote = async (postLike) => {
//     try {
//       // First check if upvote already exists
//       const { data: existingLike } = await supabase
//         .from('threviewupvote')
//         .select()
//         .match({ userId: postLike.userId, peoplesReviewId: postLike.peoplesReviewId })
//         .single();
  
//       if (existingLike) {
//         // Unlike if already liked
//         const { error } = await supabase
//           .from('threviewupvote')
//           .delete()
//           .match({ userId: postLike.userId, peoplesReviewId: postLike.peoplesReviewId });
  
//         if (error) throw error;
//         return { success: true, data: null, action: 'unliked' };
//       }
  
//       // Create new like if not exists
//       const { data, error } = await supabase
//         .from('threviewupvote')
//         .insert(postLike)
//         .select()
//         .single();
  
//       if (error) throw error;
//       return { success: true, data, action: 'liked' };
  
//     } catch (error) {
//       console.log('people review upvote error: ', error);
//       return { 
//         success: false, 
//         msg: 'Could not process upvote action' 
//       };
//     }
//   };
  
    
//     export const removePostUpvote = async (postId, userId) => {
//       try {
//         const {error} = await supabase.from('threviewupvote').
//         delete().
//         eq('peoplesReviewId', postId).  
//         eq('userId', userId);
     
//         if (error) {
//           console.log('postLike error: ', error);
//           return { success: false, msg: 'Could not remove post like' };
//         }
//         return { success: true};
//       } catch (error) {
//         return { success: false, msg: 'Could not remove post like' };
//       }
//     };

//     // Add this to your releaseService.js file
// export const getPostLikes = async (postId) => {
//   try {
//     const { data, error } = await supabase
//       .from('threviewupvote')
//       .select('*')
//       .eq('peoplesReviewId', postId);
    
//     if (error) throw error;
//     return { success: true, data };
//   } catch (error) {
//     console.error('Get post likes error:', error);
//     return { success: false, msg: 'Could not fetch post likes' };
//   }
// };


export const createPeopleReviewUpvote = async (upvote) => {

const { data, error } = await supabase
.from('threviewupvote')
.insert(upvote)
.select()
.single();
  try{
    if(error){
      console.log('people review upvote error: ', error);
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
  .from('threviewupvote')
  .delete()
  .eq('peoplesReviewId', peoplesReviewId)
  .eq('userId', userId);
    try{
      if(error){
        console.log('people review upvote remove error: ', error);
          return {success: false, msg: error?.message};
      }
       return {success: true}; 
    }catch(error){
      console.log('got upvote removing error', error);
      return {success: false, msg: error?.message};
    }
  
  }


  // Review downvote service threviewdownvote

  export const createPeopleReviewDownvote = async (downupvote) => {

    const { data, error } = await supabase
    .from('threviewdownvote')
    .insert(downupvote)
    .select()
    .single();
      try{
        if(error){
          console.log('people review downvote error: ', error);
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
      .from('threviewdownvote')
      .delete()
      .eq('peoplesReviewId', peoplesReviewId)
      .eq('userId', userId);
        try{
          if(error){
            console.log('people review downvote remove error: ', error);
              return {success: false, msg: error?.message};
          }
           return {success: true}; 
        }catch(error){
          console.log('got downvote removing error', error);
          return {success: false, msg: error?.message};
        }
      
      }




      // create and remove people review reply likes 

      // Review downvote service threviewdownvote

  export const createPeopleReviewReplyLike = async (addreply) => {

    const { data, error } = await supabase
    .from('pepreplylikes')
    .insert(addreply)
    .select()
    .single();
      try{
        if(error){
          console.log('people reply like error: ', error);
            return {success: false, msg: error?.message};
        }
         return {success: true, data}; 
      }catch(error){
        console.log('got review reply like create error', error);
        return {success: false, msg: error?.message};
      }
    
    }
    
    
    export const removePeopleReviewReplyLike = async (peoplesReviewId, userId) => {
    
      const { error } = await supabase
      .from('pepreplylikes')
      .delete()
      .eq('peoplesReviewReplyId', peoplesReviewId)  
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

      // api to edit the people review  
      export const updatePeopleReview = async (reviewId, reviewData) => {
        try {
          const { data, error } = await supabase
            .from('peoplesReview')
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

      // creating a funcyion to get people review details using title

      export const fetchPeoplesReleaseDetailsUsingTitle = async (title) => {
        try {
          const { data, error } = await supabase
            .from('releases')
            .select(`*,
              user: users (id, name, image),
              peoplesReview(*, user: users(id, name, image),
               threviewupvote(*),threviewdownvote(*),replyPeopleReviews(*))
              `
             )
            .eq('body', title)
            .order("created_at", { ascending: false, foreignTable: "peoplesReview", foreignColumn: "created_at" })
            .single();
          if (error) {
            console.log('Fetch peoples releases details error: ', error);
            return { success: false, msg: 'Could not peoplw fetch releases' };
          }
          return { success: true, data };
        } catch (error) {
          return { success: false, msg: 'Could not fetch the peoples reviews releases'};
        }
      };



      export const fetchPeoplesReleaseDetailsx = async (postId) => {
        try {
          const { data, error } = await supabase
            .from('releases')
            .select(`*,
              user: users (id, name, image),
              peoplesReview(*, user: users(id, name, image),
               threviewupvote(*),threviewdownvote(*),replyPeopleReviews(*))
              `
             )
            .eq('id', postId)
            .order("created_at", { ascending: false, foreignTable: "peoplesReview", foreignColumn: "created_at" })
            .single();
          if (error) {
            console.log('Fetch peoples releases details error: ', error);
            return { success: false, msg: 'Could not peoplw fetch releases' };
          }
          return { success: true, data };
        } catch (error) {
          return { success: false, msg: 'Could not fetch the peoples reviews releases'};
        }
      };

      export const fetchAverageRating = async (releaseId) => {
        try {
          const { data, error } = await supabase
            .from('peoplesReview')
            .select('userRating')
            .eq('releaseId', releaseId);
      
          if (error) {
            console.error('Error fetching avg user ratings:', error);
            return { success: false, msg: 'Could not fetch avg user ratings' };
          }
      
          const ratings = data.map((item) => item.userRating).filter(Boolean);
      
          const average =
            ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : null;
      
          return { success: true, average };
        } catch (error) {
          console.error('Server error during average rating fetch:', error);
          return { success: false, msg: 'Server error' };
        }
      };


      // user checking if a user has posted a review on a theatre or digital stream
      export const hasUserPostedAnyReview = async (userId, releaseId, streamId) => {
        console.log("Trying the process to get user review");
        
        try {
          if (!userId || !releaseId) {
            return { 
              success: false, 
              msg: 'User ID and Release ID are required' 
            };
          }
      
          const { data: peopleReviewData, error: peopleReviewError } = await supabase
            .from('peoplesReview')
            .select('id')
            .eq('userId', userId)
            .eq('releaseId', releaseId)
            .limit(1)
            .maybeSingle();
      
          if (peopleReviewError) {
            return { 
              success: false, 
              msg: 'Error checking for people review' 
            };
          }
      
          if (peopleReviewData) {
            return { 
              success: true, 
              hasPostedReview: true 
            };
          }
      
          const { data: dPeopleReviewData, error: dPeopleReviewError } = await supabase
            .from('dpeopreviews')
            .select('id')
            .eq('userId', userId)
            .eq('releaseId', streamId)
            .limit(1)
            .maybeSingle();
      
          if (dPeopleReviewError) {
            return { 
              success: false, 
              msg: 'Error checking for dpeople review' 
            };
          }
      
          return { 
            success: true, 
            hasPostedReview: !!dPeopleReviewData 
          };
      
        } catch (error) {
          console.error(error);
          return { 
            success: false, 
            msg: 'Could not process review check' 
          };
        }
      };
      