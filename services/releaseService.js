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

export const fetchReleaseDetails = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select(`*,
        user: users (id, name, image),
        reviews(*, user: users(id, name, image))
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
        peoplesReview(*, user: users(id, name, image))
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
        user: users(id, name, image)
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