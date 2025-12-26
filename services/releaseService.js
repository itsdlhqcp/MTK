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

/**
 * Delete a release (theatre) by ID
 * @param {string|number} releaseId - The ID of the release to delete
 * @returns {Promise<Object>} - Object containing success status and data/error message
 */
export const deleteRelease = async (releaseId) => {
  try {
    if (!releaseId) {
      return { success: false, msg: "Release ID is required" };
    }

    // 1) Cleanup critic reviews and their replies for this release
    try {
      const { data: criticReviews, error: criticError } = await supabase
        .from('reviews')
        .select('id')
        .eq('releaseId', releaseId);

      if (criticError) {
        console.error("Error fetching critic reviews for deleteRelease:", criticError);
      } else if (criticReviews && criticReviews.length > 0) {
        const reviewIds = criticReviews.map(r => r.id);

        // Delete replies to those reviews
        if (reviewIds.length > 0) {
          const { error: replyError } = await supabase
            .from('replyReviews')
            .delete()
            .in('reviewId', reviewIds);

          if (replyError) {
            console.error("Error deleting review replies in deleteRelease:", replyError);
          }

          // Delete the reviews themselves
          const { error: deleteCriticError } = await supabase
            .from('reviews')
            .delete()
            .in('id', reviewIds);

          if (deleteCriticError) {
            console.error("Error deleting critic reviews in deleteRelease:", deleteCriticError);
          }
        }
      }
    } catch (cleanupError) {
      console.error("Unexpected error cleaning up critic reviews in deleteRelease:", cleanupError);
    }

    // 2) Cleanup people reviews (peoplesReview) and all their related data
    try {
      const { data: peopleReviews, error: peopleError } = await supabase
        .from('peoplesReview')
        .select('id')
        .eq('releaseId', releaseId);

      if (peopleError) {
        console.error("Error fetching peoplesReview for deleteRelease:", peopleError);
      } else if (peopleReviews && peopleReviews.length > 0) {
        const peopleReviewIds = peopleReviews.map(r => r.id);

        // Delete upvotes / downvotes linked to these people reviews
        if (peopleReviewIds.length > 0) {
          const { error: upvoteError } = await supabase
            .from('threviewupvote')
            .delete()
            .in('peoplesReviewId', peopleReviewIds);

          if (upvoteError) {
            console.error("Error deleting people review upvotes in deleteRelease:", upvoteError);
          }

          const { error: downvoteError } = await supabase
            .from('threviewdownvote')
            .delete()
            .in('peoplesReviewId', peopleReviewIds);

          if (downvoteError) {
            console.error("Error deleting people review downvotes in deleteRelease:", downvoteError);
          }

          // Find replies for these people reviews
          const { data: peopleReplies, error: repliesError } = await supabase
            .from('replyPeopleReviews')
            .select('id')
            .in('peoplesReviewId', peopleReviewIds);

          if (repliesError) {
            console.error("Error fetching replyPeopleReviews in deleteRelease:", repliesError);
          } else if (peopleReplies && peopleReplies.length > 0) {
            const replyIds = peopleReplies.map(r => r.id);

            // Delete likes on those replies
            if (replyIds.length > 0) {
              const { error: replyLikesError } = await supabase
                .from('pepreplylikes')
                .delete()
                .in('peoplesReviewReplyId', replyIds);

              if (replyLikesError) {
                console.error("Error deleting pepreplylikes in deleteRelease:", replyLikesError);
              }
            }

            // Delete the reply records themselves
            const { error: deleteRepliesError } = await supabase
              .from('replyPeopleReviews')
              .delete()
              .in('id', replyIds);

            if (deleteRepliesError) {
              console.error("Error deleting replyPeopleReviews in deleteRelease:", deleteRepliesError);
            }
          }

          // Finally delete the peoplesReview rows
          const { error: deletePeopleError } = await supabase
            .from('peoplesReview')
            .delete()
            .in('id', peopleReviewIds);

          if (deletePeopleError) {
            console.error("Error deleting peoplesReview in deleteRelease:", deletePeopleError);
          }
        }
      }
    } catch (cleanupError) {
      console.error("Unexpected error cleaning up peoplesReview in deleteRelease:", cleanupError);
    }

    const { error } = await supabase
      .from('releases')
      .delete()
      .eq('id', releaseId);

    if (error) {
      console.error("Error in deleteRelease:", error);
      return { success: false, msg: "Could not delete release", error: error.message };
    }

    return { success: true, msg: "Release deleted successfully" };
  } catch (error) {
    console.error("Error in deleteRelease:", error);
    return { success: false, msg: "Could not delete release", error: error.message };
  }
};

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


// export const fetchPeoplesReleaseDetails = async (postId) => {
//   try {
//     const { data, error } = await supabase
//       .from('releases')
//       .select(`*,
//         user: users (id, name, image),
//         peoplesReview(*, user: users(id, name, image),
//          threviewupvote(*),threviewdownvote(*),replyPeopleReviews(*))
//         `
//        )
//       .eq('id', postId)
//       .order("created_at", { ascending: false, foreignTable: "peoplesReview", foreignColumn: "created_at" })
//       .single();
//     if (error) {
//       console.log('Fetch peoples releases details error: ', error);
//       return { success: false, msg: 'Could not peoplw fetch releases' };
//     }
//     return { success: true, data };
//   } catch (error) {
//     return { success: false, msg: 'Could not fetch the peoples reviews releases'};
//   }
// };

export const fetchPeoplesReleaseDetails = async (postId, userId = null) => {
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
      .single();
      
    if (error) {
      console.log('Fetch peoples releases details error: ', error);
      return { success: false, msg: 'Could not fetch releases' };
    }

    // Sort reviews by vote score (upvotes - downvotes) in descending order
    if (data?.peoplesReview) {
      data.peoplesReview = data.peoplesReview.sort((a, b) => {
        const aScore = (a.threviewupvote?.length || 0) - (a.threviewdownvote?.length || 0);
        const bScore = (b.threviewupvote?.length || 0) - (b.threviewdownvote?.length || 0);
        
        // Primary sort: by vote score (highest first)
        if (bScore !== aScore) {
          return bScore - aScore;
        }
        
        // Secondary sort: by creation date (newest first) if vote scores are equal
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    
    // Add hasUserReviewed flag if userId is provided
    if (userId && data?.peoplesReview) {
      data.hasUserReviewed = data.peoplesReview.some(review => review.userId === userId);
    } else {
      data.hasUserReviewed = false;
    }

    return { success: true, data };
  } catch (error) {
    console.log('Fetch error: ', error);
    return { success: false, msg: 'Could not fetch the peoples reviews releases'};
  }
};

// Alternative approach using a database view or RPC function (recommended for better performance)
export const fetchPeoplesReleaseDetailsOptimized = async (postId) => {
  try {
    // First, get the release data
    const { data, error } = await supabase
      .from('releases')
      .select(`*,
        user: users (id, name, image)
        `
       )
      .eq('id', postId)
      .single();
      
    if (error) {
      console.log('Fetch peoples releases details error: ', error);
      return { success: false, msg: 'Could not fetch releases' };
    }

    // Then, get reviews ordered by vote score using RPC function
    const { data: reviewsData, error: reviewsError } = await supabase
      .rpc('get_reviews_by_vote_score', { 
        release_id: postId 
      });

    if (reviewsError) {
      console.log('Fetch reviews error: ', reviewsError);
      // Fall back to unordered reviews if RPC fails
      const { data: fallbackReviews } = await supabase
        .from('peoplesReview')
        .select(`*, user: users(id, name, image),
         threviewupvote(*),threviewdownvote(*),replyPeopleReviews(*)`)
        .eq('release_id', postId);
      
      data.peoplesReview = fallbackReviews || [];
    } else {
      data.peoplesReview = reviewsData || [];
    }

    return { success: true, data };
  } catch (error) {
    console.log('Fetch error: ', error);
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
    
    // Send notification to review author if voter is not the author
    if (upvote.userId && upvote.peoplesReviewId) {
      try {
        // Fetch review to get author's userId
        const { data: reviewData } = await supabase
          .from('peoplesReview')
          .select('userId, releaseId')
          .eq('id', upvote.peoplesReviewId)
          .single();
        
        if (reviewData && reviewData.userId !== upvote.userId) {
          // Dynamic import to avoid circular dependency
          const notificationModule = await import('./notificationService');
          await notificationModule.createNotifications({
            senderId: upvote.userId,
            receiverId: reviewData.userId,
            title: 'upvoted your review',
            data: JSON.stringify({ 
              reviewId: upvote.peoplesReviewId,
              releaseId: reviewData.releaseId 
            })
          });
        }
      } catch (notifError) {
        console.error('Error sending upvote notification:', notifError);
        // Don't fail the upvote if notification fails
      }
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
        
        // Send notification to review author if voter is not the author
        if (downupvote.userId && downupvote.peoplesReviewId) {
          try {
            // Fetch review to get author's userId
            const { data: reviewData } = await supabase
              .from('peoplesReview')
              .select('userId, releaseId')
              .eq('id', downupvote.peoplesReviewId)
              .single();
            
            if (reviewData && reviewData.userId !== downupvote.userId) {
              // Dynamic import to avoid circular dependency
              const notificationModule = await import('./notificationService');
              await notificationModule.createNotifications({
                senderId: downupvote.userId,
                receiverId: reviewData.userId,
                title: 'downvoted your review',
                data: JSON.stringify({ 
                  reviewId: downupvote.peoplesReviewId,
                  releaseId: reviewData.releaseId 
                })
              });
            }
          } catch (notifError) {
            console.error('Error sending downvote notification:', notifError);
            // Don't fail the downvote if notification fails
          }
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

     // api fetching without sorting

      // export const fetchPeoplesReleaseDetailsx = async (postId) => {
      //   try {
      //     const { data, error } = await supabase
      //       .from('releases')
      //       .select(`*,
      //         user: users (id, name, image),
      //         peoplesReview(*, user: users(id, name, image),
      //          threviewupvote(*),threviewdownvote(*),replyPeopleReviews(*))
      //         `
      //        )
      //       .eq('id', postId)
      //       .order("created_at", { ascending: false, foreignTable: "peoplesReview", foreignColumn: "created_at" })
      //       .single();
      //     if (error) {
      //       console.log('Fetch peoples releases details error: ', error);
      //       return { success: false, msg: 'Could not peoplw fetch releases' };
      //     }
      //     return { success: true, data };
      //   } catch (error) {
      //     return { success: false, msg: 'Could not fetch the peoples reviews releases'};
      //   }
      // };

      export const fetchPeoplesReleaseDetailsx = async (postId, userId = null) => {
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
            .single();
            
          if (error) {
            console.log('Fetch peoples releases details error: ', error);
            return { success: false, msg: 'Could not fetch releases' };
          }
      
          // Sort reviews by vote score (upvotes - downvotes) in descending order
          if (data?.peoplesReview && Array.isArray(data.peoplesReview)) {
            data.peoplesReview = data.peoplesReview.sort((a, b) => {
              const aUpvotes = a.threviewupvote?.length || 0;
              const aDownvotes = a.threviewdownvote?.length || 0;
              const aScore = aUpvotes - aDownvotes;
              
              const bUpvotes = b.threviewupvote?.length || 0;
              const bDownvotes = b.threviewdownvote?.length || 0;
              const bScore = bUpvotes - bDownvotes;
              
              // Primary sort: by vote score (highest first)
              if (bScore !== aScore) {
                return bScore - aScore;
              }
              
              // Secondary sort: by creation date (newest first) if vote scores are equal
              return new Date(b.created_at) - new Date(a.created_at);
            });
          }
      
          // Add hasUserReviewed flag if userId is provided
          if (userId && data?.peoplesReview) {
            data.hasUserReviewed = data.peoplesReview.some(review => review.userId === userId);
          } else {
            data.hasUserReviewed = false;
          }
      
          return { success: true, data };
        } catch (error) {
          console.log('Fetch error: ', error);
          return { success: false, msg: 'Could not fetch the peoples reviews releases'};
        }
      };

      // export const fetchAverageRating = async (releaseId) => {
      //   try {
      //     const { data, error } = await supabase
      //       .from('peoplesReview')
      //       .select('userRating')
      //       .eq('releaseId', releaseId);
      
      //     if (error) {
      //       console.error('Error fetching avg user ratings:', error);
      //       return { success: false, msg: 'Could not fetch avg user ratings' };
      //     }
      
      //     const ratings = data.map((item) => item.userRating).filter((r) => typeof r === 'number');
      
      //     const average =
      //       ratings.length > 0
      //         ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      //         : 0.0;
      
      //     return { success: true, average };
      //   } catch (error) {
      //     console.error('Server error during average rating fetch:', error);
      //     return { success: false, msg: 'Server error' };
      //   }
      // };

      export const fetchAverageRating = async (releaseId, sconnectedId) => {
        try {
          // Fetch ratings from peoplesReview table
          const { data: peopleReviewData, error: peopleReviewError } = await supabase
            .from('peoplesReview')
            .select('userRating')
            .eq('releaseId', releaseId);
      
          if (peopleReviewError) {
            console.error('Error fetching people review ratings:', peopleReviewError);
            return { success: false, msg: 'Could not fetch user ratings from peoplesReview' };
          }
      
          // Initialize allRatings with ratings from peoplesReview
          const peopleReviewRatings = peopleReviewData
            .map((item) => item.userRating)
            .filter((r) => typeof r === 'number');
          
          let allRatings = [...peopleReviewRatings];
          
          // If sconnectedId exists, fetch ratings from dpeopreviews table
          if (sconnectedId) {
            const { data: dPeopleReviewData, error: dPeopleReviewError } = await supabase
              .from('dpeopreviews')
              .select('userRating')
              .eq('releaseId', sconnectedId);
      
            if (dPeopleReviewError) {
              console.error('Error fetching dpeopreviews ratings:', dPeopleReviewError);
              // Continue with only peoplesReview ratings rather than failing completely
            } else if (dPeopleReviewData) {
              // Add dpeopreviews ratings to allRatings
              const dPeopleReviewRatings = dPeopleReviewData
                .map((item) => item.userRating)
                .filter((r) => typeof r === 'number');
              
              allRatings = [...allRatings, ...dPeopleReviewRatings];
            }
          }
      
          // Calculate average from all collected ratings
          const average =
            allRatings.length > 0
              ? parseFloat((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
              : 0.0;
      
          return { success: true, average };
        } catch (error) {
          console.error('Server error during average rating fetch:', error);
          return { success: false, msg: 'Server error' };
        }
      };
      
      // user checking if a user has posted a review on a theatre or digital stream
      export const hasUserPostedAnyReview = async (userId, releaseId, streamId) => {
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

      // New function to update only the end date of a release
export const updateReleaseEndDate = async (releaseId, endDate) => {
  try {
    // Validate inputs
    if (!releaseId) {
      return { success: false, msg: "Release ID is required", error: "Missing release ID" };
    }
    
    if (!endDate) {
      return { success: false, msg: "End date is required", error: "Missing end date" };
    }
    
    // Update only the endDate field for the specified release
    const { data, error } = await supabase
      .from('releases')
      .update({ endDate: endDate })
      .eq('id', releaseId)
      .select()
      .single();
    
    if (error) {
      console.error("Error in updateReleaseEndDate:", error);
      return { 
        success: false, 
        msg: "Could not update the release end date", 
        error: error.message 
      };
    }
    
    return { 
      success: true, 
      data,
      msg: "End date updated successfully" 
    };
  } catch (error) {
    console.error("Error in updateReleaseEndDate:", error);
    return { 
      success: false, 
      msg: "Could not update the release end date", 
      error: error.message 
    };
  }
}

/// here the functon  for direct release 
export const hasUserPostedAnyReviewInDirect = async (userId, streamId) => {
  
  try {
    if (!userId || !streamId) {
      return { 
        success: false, 
        msg: 'User ID and Stream ID are required' 
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
        msg: 'Error checking for direct review' 
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
      msg: 'Could not process direct review check' 
    };
  }
};

// BELOW USES RATING CAL FOR DIRECT RELEASE 

export const fetchAverageRatingDirect = async (releaseId) => {
  try {
    if (!releaseId) {
      return { success: false, msg: 'Release ID is required' };
    }
    
    // Fetch ratings only from dpeopreviews table
    const { data: dPeopleReviewData, error: dPeopleReviewError } = await supabase
      .from('dpeopreviews')
      .select('userRating')
      .eq('releaseId', releaseId);
    
    if (dPeopleReviewError) {
      console.error('Error fetching dpeopreviews ratings:', dPeopleReviewError);
      return { success: false, msg: 'Could not fetch user ratings from dpeopreviews' };
    }
    
    // Filter out any non-numeric ratings
    const validRatings = dPeopleReviewData
      .map((item) => item.userRating)
      .filter((r) => typeof r === 'number');
    
    // Calculate average from collected ratings
    const average =
      validRatings.length > 0
        ? parseFloat((validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1))
        : 0.0;
    
    return { 
      success: true, 
      average,
      totalRatings: validRatings.length 
    };
  } catch (error) {
    console.error('Server error during direct average rating fetch:', error);
    return { success: false, msg: 'Server error' };
  }
};

// Add this function to your releaseService.js file
export const searchReleases = async (searchQuery, limit = 50) => {
  try {
    if (!searchQuery || searchQuery.trim() === '') {
      return { success: false, data: [], message: 'Search query is required' };
    }

    // Create search query using ilike for case-insensitive search across multiple columns
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .or(`body.ilike.%${searchQuery}%,director.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%,cast.ilike.%${searchQuery}%,lang.ilike.%${searchQuery}%,writer.ilike.%${searchQuery}%,dop.ilike.%${searchQuery}%,music.ilike.%${searchQuery}%,edit.ilike.%${searchQuery}%,type.ilike.%${searchQuery}%`)
      .order('rDate', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching releases:', error);
      return { success: false, data: [], message: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Exception while searching releases:', error);
    return { success: false, data: [], message: error.message };
  }
};