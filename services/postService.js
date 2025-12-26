import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendPushNotificationForNewPost } from "./pushNotificationService";

export const createOrUpdatePost = async (post, onProgress) => {
  try {
    const isNewPost = !post.id; // Check if this is a new post or update
    
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

    // Handle file upload if present
    if (needsFileUpload) {
      updateProgress(1, "Uploading media...");
      let isImage = post.file.type === "image";
      let folderName = isImage ? "postImage" : "postVideo";
      let fileResult = await uploadProfileImage(folderName, post.file.uri, isImage);
      if (fileResult.success) {
        post.file = fileResult.data;
      } else {
        return fileResult;
      }
    }
    
    // Save to database
    const dbStep = needsFileUpload ? 2 : 1;
    updateProgress(dbStep, "Saving post...");
    const {data, error} = await supabase.from('posts').upsert(post).select().single();

    if (error){
      console.error("Error in createOrUpdatePost:", error);
      return { success: false, msg: "Could not create or update your post", error: error.message };
    }

    updateProgress(totalSteps, "Complete!");

    // Send push notification only for new posts (not updates)
    if (isNewPost && data) {
      console.log("📢 New post created, triggering push notification...", { postId: data.id, userId: data.userId });
      // Don't await - send notification in background to avoid blocking the response
      sendPushNotificationForNewPost(data)
        .then(result => {
          console.log("✅ Push notification result:", result);
        })
        .catch(err => {
          console.error("❌ Error sending push notification:", err);
        });
    } else {
      console.log("ℹ️ Skipping notification - isNewPost:", isNewPost, "hasData:", !!data);
    }

    return {success: true, data};
  } catch (error) {
    console.error("Error in createOrUpdatePost:", error);
    return { success: false, msg: "Could not create or update your post", error: error.message };
  }
};

// Modified fetchPosts function to sort unwatched posts first
// Added sinceTimestamp parameter for cursor-based pagination
// userId: filter posts by author (if provided)
// viewerUserId: filter unwatched posts by viewer (for showOnlyUnwatched)
export const fetchPosts = async (limit = 60, userId = null, showOnlyUnwatched = false, filterCategory = 'All', sinceTimestamp = null, viewerUserId = null) => {

  try {
    // If showOnlyUnwatched is true, we need viewerUserId to filter by current user's views
    if (showOnlyUnwatched && !viewerUserId) {
      // If no viewerUserId provided but showOnlyUnwatched is true, use userId as viewerUserId
      viewerUserId = userId;
    }

    // If filtering unwatched posts, exclude posts viewed by the user at database level
    if (showOnlyUnwatched && viewerUserId) {
      // First, get all post IDs that the user has viewed
      const { data: viewedPostIds, error: viewedError } = await supabase
        .from('post_views')
        .select('post_id')
        .eq('user_id', viewerUserId);
      
      if (viewedError) {
        console.error('Error fetching viewed posts:', viewedError);
        // Fall through to alternative method
      } else {
        // Extract post IDs into an array
        const viewedIds = viewedPostIds?.map(v => v.post_id) || [];
        
        // Build query excluding viewed posts
        let query = supabase
          .from('posts')
          .select(`
            *,
            user: users (id, name, image),
            postLikes(*),
            comments(count)
          `)
          .order('created_at', { ascending: false });

        // Exclude posts that the user has viewed
        // Use .not() with 'in' operator to exclude viewed post IDs at database level
        // This ensures viewed posts are never returned from the endpoint
        if (viewedIds.length > 0) {
          query = query.not('id', 'in', `(${viewedIds.join(',')})`);
        }

        // Filter posts created after the timestamp (for fetching new posts)
        if (sinceTimestamp) {
          query = query.gt('created_at', sinceTimestamp);
        }

        // Filter by specific user (post author) if userId provided
        if (userId) {
          query = query.eq('userId', userId);
        }

        // Apply category filter
        if (filterCategory !== 'All') {
          query = query.eq('filter', filterCategory);
        }

        // Execute query
        const { data, error } = await query.limit(limit);
        
        if (error) {
          console.error('Error fetching unwatched posts:', error);
          // Fall through to alternative method below
        } else {
          // Add isWatched property (all will be false since we filtered out viewed posts)
          const postsWithWatchStatus = data.map(post => ({
            ...post,
            isWatched: false,
            post_views: [] // No views since we filtered them out
          }));

          // Sort by created_at (newest first)
          const sortedPosts = postsWithWatchStatus.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });

          return { success: true, data: sortedPosts };
        }
      }
    }

    // Standard query for when not filtering unwatched posts
    let query = supabase
      .from('posts')
      .select(`
        *,
        user: users (id, name, image),
        postLikes(*),
        comments(count),
        post_views!left (id, viewed_at, user_id)
      `)
      .order('created_at', { ascending: false });

    // Filter posts created after the timestamp (for fetching new posts)
    if (sinceTimestamp) {
      query = query.gt('created_at', sinceTimestamp);
    }

    // Filter by specific user (post author) if userId provided
    if (userId) {
      query = query.eq('userId', userId);
    }

    if (filterCategory !== 'All') {
      
      // Since filter is now a single value, use exact match
      query = query.eq('filter', filterCategory);
      
    } else {
    }
    
    // Get the data
    const { data, error } = await query.limit(limit);
    
    if (error) {
      
      // If the error is related to the array operator, try alternative approach
      if (error.code === "42883" && filterCategory !== 'All') {
        
        // Retry without the array filter - fetch all and filter client-side
        let retryQuery = supabase
          .from('posts')
          .select(`
            *,
            user: users (id, name, image),
            postLikes(*),
            comments(count),
            post_views!left (id, viewed_at, user_id)
          `)
          .order('created_at', { ascending: false });

        if (userId && !showOnlyUnwatched) {
          retryQuery = retryQuery.eq('userId', userId);
        }

        if (showOnlyUnwatched && viewerUserId) {
          retryQuery = retryQuery.is('post_views.id', null);
        }

        // Apply timestamp filter if provided
        if (sinceTimestamp) {
          retryQuery = retryQuery.gt('created_at', sinceTimestamp);
        }

        const { data: retryData, error: retryError } = await retryQuery.limit(limit * 2); // Get more to account for filtering
        
        if (retryError) {
          return { success: false, msg: 'Could not fetch the posts' };
        }

        // Filter client-side
        const filteredData = retryData.filter(post => {
          if (!post.filter) return false;
          
          // Handle different filter column formats
          if (Array.isArray(post.filter)) {
            return post.filter.includes(filterCategory);
          } else if (typeof post.filter === 'string') {
            try {
              const filterArray = JSON.parse(post.filter);
              return Array.isArray(filterArray) && filterArray.includes(filterCategory);
            } catch {
              return post.filter.includes(filterCategory);
            }
          }
          return false;
        }).slice(0, limit); // Apply limit after filtering

        data = filteredData;
      } else {
        return { success: false, msg: 'Could not fetch the posts' };
      }
    }

    // Add isWatched property to each post
    // Filter by viewerUserId if showOnlyUnwatched is true
    let postsWithWatchStatus = data.map(post => {
      // Check if this specific viewer has viewed the post
      // post_views is an array from the left join
      let hasViewed = false;
      
      if (post.post_views && Array.isArray(post.post_views)) {
        // Check if any view in the array belongs to the current viewer
        hasViewed = post.post_views.some(view => 
          view && view.user_id === viewerUserId
        );
      } else if (post.post_views && post.post_views.user_id) {
        // Handle case where it might be a single object instead of array
        hasViewed = post.post_views.user_id === viewerUserId;
      }
      
      return {
        ...post,
        isWatched: hasViewed
      };
    });

    // If showOnlyUnwatched is true, filter out posts that the viewer has already seen
    if (showOnlyUnwatched && viewerUserId) {
      postsWithWatchStatus = postsWithWatchStatus.filter(post => !post.isWatched);
    }

    // Sort posts with unwatched first, then watched (both groups still sorted by created_at desc)
    const sortedPosts = postsWithWatchStatus.sort((a, b) => {
      // If watch status is different, unwatched comes first
      if (a.isWatched !== b.isWatched) {
        return a.isWatched ? 1 : -1;
      }
      
      // If watch status is the same, sort by created_at (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return { success: true, data: sortedPosts };
  } catch (error) {
    return { success: false, msg: 'Could not fetch the posts due to an exception' };
  }
};

/**
 * Fetch new posts since a specific timestamp (for cursor-based pagination)
 * This is optimized for refresh operations - only fetches posts newer than the timestamp
 * @param {string} sinceTimestamp - ISO timestamp string
 * @param {number} limit - Maximum number of posts to fetch
 * @param {string} userId - Optional user ID filter
 * @param {boolean} showOnlyUnwatched - Filter only unwatched posts
 * @param {string} filterCategory - Filter by category (All, en, ml, etc.)
 * @returns {Promise<{success: boolean, data: Array, msg?: string}>}
 */
export const fetchNewPostsSince = async (sinceTimestamp, limit = 60, userId = null, showOnlyUnwatched = false, filterCategory = 'All', viewerUserId = null) => {
  if (!sinceTimestamp) {
    // If no timestamp provided, fall back to regular fetchPosts
    return await fetchPosts(limit, userId, showOnlyUnwatched, filterCategory, null, viewerUserId);
  }

  return await fetchPosts(limit, userId, showOnlyUnwatched, filterCategory, sinceTimestamp, viewerUserId);
};

// Mark a post as viewed
export const markPostAsViewed = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from('post_views')
      .upsert({
        user_id: userId,
        post_id: postId,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,post_id'
      });

    if (error) {
      console.error('Error marking post as viewed:', error);
      return { success: false, msg: 'Could not mark post as viewed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking post as viewed:', error);
    return { success: false, msg: 'Could not mark post as viewed' };
  }
};

// Get unwatched posts count

// Fixed unwatched posts count function
export const getUnwatchedPostsCount = async (userId) => {
  try {
    // Validate userId input
    if (!userId) {
      console.log('No userId provided for getUnwatchedPostsCount');
      return { success: false, count: 0, msg: 'No userId provided' };
    }
    
    // First approach: Get total posts count
    const { count: totalCount, error: totalError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
      
    if (totalError) {
      console.error('Error getting total posts count:', totalError);
      return { success: false, count: 0, msg: 'Failed to get total posts count' };
    }
    
    // If there are no posts at all, return zero
    if (totalCount === 0) {
      return { success: true, count: 0 };
    }
    
    // Second approach: Get viewed posts count
    const { count: viewedCount, error: viewedError } = await supabase
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (viewedError) {
      console.error('Error getting viewed posts count:', viewedError);
      return { success: false, count: 0, msg: 'Failed to get viewed posts count' };
    }
    
    // Calculate unwatched count by subtracting
    const unwatchedCount = totalCount - viewedCount;
    
    return { 
      success: true, 
      count: unwatchedCount < 0 ? 0 : unwatchedCount,
      totalCount,
      viewedCount 
    };
  } catch (error) {
    console.error('Exception in getUnwatchedPostsCount:', error);
    return { success: false, count: 0, msg: 'Exception occurred' };
  }
};

// Sync pending views when connection is restored
export const syncPendingViews = async (userId) => {
  try {
    // Get pending views from storage
    const pendingViewsStr = await AsyncStorage.getItem('pendingViews');
    if (!pendingViewsStr) {
      return { success: true, syncedCount: 0 };
    }
    
    const pendingViews = JSON.parse(pendingViewsStr);
    let syncedCount = 0;
    const failedViews = [];
    
    // Process each pending view
    for (const viewKey of pendingViews) {
      // Extract postId from key (format: userId-postId)
      const [storedUserId, postId] = viewKey.split('-');
      
      // Only process views for the current user
      if (storedUserId === userId) {
        // Mark post as viewed
        const { success } = await markPostAsViewed(postId, userId);
        
        if (success) {
          syncedCount++;
        } else {
          failedViews.push(viewKey);
        }
      } else {
        // Keep views for other users
        failedViews.push(viewKey);
      }
    }
    
    // Update local storage with any failed views
    await AsyncStorage.setItem('pendingViews', JSON.stringify(failedViews));
    
    return { success: true, syncedCount };
  } catch (error) {
    console.error('Error syncing pending views:', error);
    return { success: false, msg: 'Could not sync pending views', syncedCount: 0 };
  }
};

  // Like service
// export const createPostLike = async (postLike) => {
//   try {
//     // First check if like already exists
//     const { data: existingLike } = await supabase
//       .from('postLikes')
//       .select()
//       .match({ userId: postLike.userId, postId: postLike.postId })
//       .single();

//     if (existingLike) {
//       // Unlike if already liked
//       const { error } = await supabase
//         .from('postLikes')
//         .delete()
//         .match({ userId: postLike.userId, postId: postLike.postId });

//       if (error) throw error;
//       return { success: true, data: null, action: 'unliked' };
//     }

//     // Create new like if not exists
//     const { data, error } = await supabase
//       .from('postLikes')
//       .insert(postLike)
//       .select()
//       .single();

//     if (error) throw error;
//     return { success: true, data, action: 'liked' };

//   } catch (error) {
//     console.log('postLike error: ', error);
//     return { 
//       success: false, 
//       msg: 'Could not process like action' 
//     };
//   }
// };

export const createPostLike = async (postLike) => {
  try {
    console.log('Incoming postLike:', postLike);

    // First check if like already exists
    const { data: existingLike, error: checkError } = await supabase
      .from('postLikes')
      .select()
      .match({ userId: postLike.userId, postId: postLike.postId })
      .single();

    console.log('Existing like check:', { existingLike, checkError });

    if (existingLike) {
      // Unlike if already liked
      const { error: deleteError } = await supabase
        .from('postLikes')
        .delete()
        .match({ userId: postLike.userId, postId: postLike.postId });

      console.log('Unlike operation result:', { deleteError });

      if (deleteError) throw deleteError;
      return { success: true, data: null, action: 'unliked' };
    }

    // Create new like if not exists
    const { data, error: insertError } = await supabase
      .from('postLikes')
      .insert(postLike)
      .select()
      .single();

    if (insertError) throw insertError;
    return { success: true, data, action: 'liked' };

  } catch (error) {
    console.log('postLike error: ', error);
    return {
      success: false,
      msg: 'Could not process like action'
    };
  }
};


  
  export const removePostLike = async (postId, userId) => {
    try {
      const {error} = await supabase.from('postLikes').
      delete().
      eq('postId', postId).
      eq('userId', userId);
   
      if (error) {
        console.log('postLike error: ', error);
        return { success: false, msg: 'Could not remove feed like' };
      }
      return { success: true};
    } catch (error) {
      return { success: false, msg: 'Could not remove feed like' };
    }
  };

  export const fetchPostDetails = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`*,user: users (id, name, image),
           postLikes(count),
           comments(*,
           user: users(id, name, image),
           reply(*),
           commentLikes(*),
           commentUnlikes(*))
          `,
        )
        .eq('id', postId)
        .order("created_at", { ascending: false, foreignTable: "comments", foreignColumn: "reply" })
        .single();
      if (error) {
        console.log('Fech post details error: ', error);
        return { success: false, msg: 'Could not fetch posts' };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, msg: 'Could not fetch the posts due to an exception' };
    }
  };




  export const createComment = async (comment) => {
    try {
        const { data, error } = await supabase  // Destructure both data and error
            .from('comments')
            .insert(comment)
            .select()
            .single();
    
        if (error) {
            console.log('post comment error: ', error);
            return { 
                success: false, 
                msg: 'Could not create post comment' 
            };
        }
        
        return { 
            success: true, 
            data, 
            action: 'post commented' 
        };
    
    } catch (error) {
        console.log('post comment error: ', error);
        return { 
            success: false, 
            msg: 'Could not process post comment action' 
        };
    }
}


export const removeComment = async (commentId) => {
  try {
    const {error} = await supabase.from('comments').
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


export const removePost = async (postId) => {
  try {
    const {error} = await supabase.from('posts').
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

// export const createReply = async (reply) => {
//   try {
//       const { data, error } = await supabase  // Destructure both data and error
//           .from('reply')
//           .insert(reply)
//           .select()
//           .single();
  
//       if (error) {
//           console.log('post comment reply!! error: ', error);
//           return { 
//               success: false, 
//               msg: 'Could not create post comment reply!!' 
//           };
//       }
      
//       return { 
//           success: true, 
//           data, 
//           action: 'post commented replied' 
//       };
  
//   } catch (error) {
//       console.log('post comment reply error: ', error);
//       return { 
//           success: false, 
//           msg: 'Could not process post comment reply action' 
//       };
//   }
// }



export const createReply = async (reply) => {
  try {
      const { data, error } = await supabase
          .from('reply')
          .insert({
            userId: reply.userId,
            text: reply.text,
            commentId: reply.parentCommentId  // Use parentCommentId as commentId
          })
          .select()
          .single();
  
      if (error) {
          console.log('post comment reply error: ', error);
          return { 
              success: false, 
              msg: 'Could not create post comment reply' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'post comment replied' 
      };
  
  } catch (error) {
      console.log('post comment reply error: ', error);
      return { 
          success: false, 
          msg: 'Could not process post comment reply action' 
      };
  }
}

// In postService.js
export const fetchCommentReplies = async (commentId) => {
  try {
    const { data, error } = await supabase
      .from('reply')
      .select(`
        *,
        user: users(id, name, image),
           replylikes(*) 
      `)
      .eq('commentId', commentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Fetch comment replies error: ', error);
      return { success: false, msg: 'Could not fetch replies' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch replies' };
  }
};

// create and remove comment likes apis

export const createCommentLike = async (addlike) => {

  const { data, error } = await supabase
  .from('commentLikes')
  .insert(addlike)
  .select()
  .single();
    try{
      if(error){
        console.log('comment like error: ', error);
          return {success: false, msg: error?.message};
      }
       return {success: true, data}; 
    }catch(error){
      console.log('got comment like create error', error);
      return {success: false, msg: error?.message};
    }
  
  }
  
  
  export const removeCommentLike = async (commentId, userId) => {
  
    const { error } = await supabase
    .from('commentLikes')
    .delete()
    .eq('commentId', commentId)
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
  .from('commentUnlikes')
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
    .from('commentUnlikes')
    .delete()
    .eq('commentId', commentId)
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
  .from('replylikes')
  .insert(replylike)
  .select()
  .single();
    try{
      if(error){
        console.log('comment reply like error: ', error);
          return {success: false, msg: error?.message};
      }
       return {success: true, data}; 
    }catch(error){
      console.log('got comment reply like create error', error);
      return {success: false, msg: error?.message};
    }
  }
  
  
  export const removeCommentReplyunlike = async (replyId, userId) => {
  
    const { error } = await supabase
    .from('replylikes')
    .delete()
    .eq('replyId ', replyId)
    .eq('userId', userId);
      try{
        if(error){
          console.log('people comment reply like remove error: ', error);
            return {success: false, msg: error?.message};
        }
         return {success: true}; 
      }catch(error){
        console.log('got comment reply like removing error', error);
        return {success: false, msg: error?.message};
      }
    
    }
