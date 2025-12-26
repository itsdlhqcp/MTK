import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

export const createOrUpdateOtt = async (post, onProgress) => {
  try {
    // Calculate total steps based on what needs to be done
    const needsFileUpload = post.file && typeof post.file === "object";
    const needsFilelUpload = post.filel && typeof post.filel === "object";
    const isSeries = post.seriesType === 'series' && post.episodes && post.episodes.length > 0;
    
    let totalSteps = 1; // database save is always 1 step
    if (needsFileUpload) totalSteps++;
    if (needsFilelUpload) totalSteps++;
    if (isSeries) totalSteps++;
    
    let currentStep = 0;

    const updateProgress = (step, message) => {
      currentStep = step;
      const percentage = (step / totalSteps) * 100;
      if (onProgress) {
        onProgress({ percentage, step, message, totalSteps });
      }
    };

    // Handle first file upload (file)
    if (needsFileUpload) {
      updateProgress(1, "Uploading landscape poster...");
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
    if (needsFilelUpload) {
      const step = needsFileUpload ? 2 : 1;
      updateProgress(step, "Uploading portrait poster...");
      let isImage = post.filel.type === "image";
      let folderName = isImage ? "postImage" : "postVideo";
      let fileResult = await uploadProfileImage(folderName, post.filel.uri, isImage);
      if (fileResult.success) {
        post.filel = fileResult.data;
      } else {
        return fileResult;
      }
    }

    // Extract episodes if it's a series
    const episodes = post.episodes;
    const seriesType = post.seriesType || 'normal';
    // Remove episodes from post data before inserting into streams
    const { episodes: _, ...streamData } = post;

    // Add seriesType to streamData (column added via migration)
    streamData.seriesType = seriesType;

    // Add 'series' to tags if it's a series type
    if (seriesType === 'series') {
      const tags = Array.isArray(streamData.tags) ? streamData.tags : (streamData.tags ? JSON.parse(streamData.tags) : []);
      if (!tags.includes('series')) {
        tags.push('series');
      }
      streamData.tags = tags;
    }

    const dbStep = (needsFileUpload ? 1 : 0) + (needsFilelUpload ? 1 : 0) + 1;
    updateProgress(dbStep, "Saving to database...");
    const { data, error } = await supabase.from('streams').upsert(streamData).select().single();

    if (error) {
      console.error("Error in createOrUpdateOtt:", error);

      // Check for unique constraint violation (duplicate key)
      if (error.code === "23505") {
        return { success: false, msg: "Already added this Film into Ott", error: error.message };
      }

      return { success: false, msg: "Could not create or update your Ott", error: error.message };
    }

    // If it's a series and has episodes, create episodes
    if (seriesType === 'series' && episodes && episodes.length > 0 && data && data.id) {
      const episodesStep = dbStep + 1;
      updateProgress(episodesStep, `Creating ${episodes.length} episode(s)...`);
      // Create episodes in series_episodes table, using stream_id to link to streams table
      // Make episode title, release date and duration optional.
      // We still persist the episode row even if only the episode_number is present,
      // so UI can at least show "Episode X".
      const episodesToInsert = episodes
        .filter(ep => ep.episode_number != null) // keep any episode with a number
        .map(ep => ({
          stream_id: data.id, // Link to streams table via stream_id
          series_id: null, // Null for streams-based series
          episode_number: ep.episode_number,
          episode_title: ep.episode_title || null,
          description: ep.description || null,
          release_date: ep.release_date || null,
          duration: ep.duration || null
        }));

      if (episodesToInsert.length > 0) {
        const { error: episodesError } = await supabase
          .from('series_episodes')
          .insert(episodesToInsert);

        if (episodesError) {
          console.error("Error creating episodes:", episodesError);
          // Don't fail the whole operation, just log the error
          // The stream was created successfully
        }
      }
      updateProgress(totalSteps, "Complete!");
    } else {
      updateProgress(totalSteps, "Complete!");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in createOrUpdateOtt:", error);
    return { success: false, msg: "Could not create or update your Ott", error: error.message };
  }
};


// plese adjust the fetch releses based on rDate oder in ascending
export const fetchOtt = async (limit2=10, offset=0) => {
  try {
    // First fetch streams with pagination
    // Order by rDate (NULLS LAST) then by created_at for items without rDate
    // Fetch ALL streams (both direct releases and connected releases)
    const {data: streamsData, error} = await supabase
    .from('streams')
    .select('*')
    .order('rDate', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false }) // Secondary sort for items without rDate
    .range(offset, offset + limit2 - 1); // Use range for proper pagination

    if(error){
      console.log("Error in fetching ottss:", error);
      return { success: false, msg: "Could not fetch Otts", error: error.message };
    }

    if (!streamsData || streamsData.length === 0) {
      return {success: true, data: []};
    }

    // Get all stream IDs that might have episodes
    const streamIds = streamsData.map(s => s.id);

    // Fetch episodes for these streams
    const {data: episodesData, error: episodesError} = await supabase
      .from('series_episodes')
      .select('*')
      .in('stream_id', streamIds);

    if (episodesError) {
      console.log("Error fetching episodes:", episodesError);
      // Continue without episodes rather than failing
    }

    // Group episodes by stream_id
    const episodesByStreamId = {};
    if (episodesData && Array.isArray(episodesData)) {
      episodesData.forEach(episode => {
        if (episode.stream_id) {
          if (!episodesByStreamId[episode.stream_id]) {
            episodesByStreamId[episode.stream_id] = [];
          }
          episodesByStreamId[episode.stream_id].push(episode);
        }
      });
    }

    // Attach episodes to their respective streams and sort
    const data = streamsData.map(stream => {
      const episodes = episodesByStreamId[stream.id] || [];
      return {
        ...stream,
        episodes: episodes.sort((a, b) => a.episode_number - b.episode_number)
      };
    });

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

export const fetchPeoplesReleaseDetails = async (postId, userId = null) => {
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
    
    // Add hasUserReviewed flag if userId is provided
    if (userId && data?.dpeopreviews) {
      data.hasUserReviewed = data.dpeopreviews.some(review => review.userId === userId);
    } else {
      data.hasUserReviewed = false;
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
      
      // Send notification to review author if voter is not the author
      if (upvote.userId && upvote.dpeopleReviewId) {
        try {
          // Fetch review to get author's userId
          const { data: reviewData } = await supabase
            .from('dpeopreviews')
            .select('userId, releaseId')
            .eq('id', upvote.dpeopleReviewId)
            .single();
          
          if (reviewData && reviewData.userId !== upvote.userId) {
            // Dynamic import to avoid circular dependency
            const notificationModule = await import('./notificationService');
            await notificationModule.createNotifications({
              senderId: upvote.userId,
              receiverId: reviewData.userId,
              title: 'upvoted your review',
              data: JSON.stringify({ 
                reviewId: upvote.dpeopleReviewId,
                streamId: reviewData.releaseId 
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
          
          // Send notification to review author if voter is not the author
          if (downupvote.userId && downupvote.dpeopleReviewId) {
            try {
              // Fetch review to get author's userId
              const { data: reviewData } = await supabase
                .from('dpeopreviews')
                .select('userId, releaseId')
                .eq('id', downupvote.dpeopleReviewId)
                .single();
              
              if (reviewData && reviewData.userId !== downupvote.userId) {
                // Dynamic import to avoid circular dependency
                const notificationModule = await import('./notificationService');
                await notificationModule.createNotifications({
                  senderId: downupvote.userId,
                  receiverId: reviewData.userId,
                  title: 'downvoted your review',
                  data: JSON.stringify({ 
                    reviewId: downupvote.dpeopleReviewId,
                    streamId: reviewData.releaseId 
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

          // First, let's create a function to get the latest stream ID
          const getLatestStreamId = async () => {
            try {
              const { data, error } = await supabase
                .from('streams')
                .select('id')
                .order('created_at', { ascending: false })
                .limit(1);
                
              if (error) {
                console.error("Error fetching latest stream:", error);
                return { success: false, error: error.message };
              }
              
              return { 
                success: true, 
                latestId: data && data.length > 0 ? data[0].id : 0 
              };
            } catch (error) {
              console.error("Error in getLatestStreamId:", error);
              return { success: false, error: error.message };
            }
          };

          // Now let's create a function to update the release's sconnectedId
          export const updateReleaseSconnectedId = async (releaseId) => {
            try {
              // Get the latest stream ID
              const streamResult = await getLatestStreamId();
              
              if (!streamResult.success) {
                return streamResult;
              }
              
              // Calculate the new sconnectedId (latest ID + 1)
              const newSconnectedId = streamResult.latestId + 1;
              
              // Update the release record
              const { data, error } = await supabase
                .from('releases')
                .update({ sconnectedId: newSconnectedId })
                .eq('id', releaseId)
                .select()
                .single();
                
              if (error) {
                console.error("Error updating release sconnectedId:", error);
                return { success: false, error: error.message };
              }
              
              return { success: true, data };
            } catch (error) {
              console.error("Error in updateReleaseSconnectedId:", error);
              return { success: false, error: error.message };
            }
          };

          export const fetchPeoplesStreamDetailsx = async (postId, userId = null) => {
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
              
              // Add hasUserReviewed flag if userId is provided
              if (userId && data?.dpeopreviews) {
                data.hasUserReviewed = data.dpeopreviews.some(review => review.userId === userId);
              } else {
                data.hasUserReviewed = false;
              }
              
              return { success: true, data };
            } catch (error) {
              return { success: false, msg: 'Could not fetch the peoples streams releases'};
            }
          };

              export const fetchAverageRating = async (releaseId) => {
                  try {
                    const { data, error } = await supabase
                      .from('dpeopreviews')
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

            // New function to update only the end date of streams
            export const updateStreamEndDate = async (streamId, endDate) => {
              try {
                // Validate inputs
                if (!streamId) {
                  return { success: false, msg: "Release ID is required", error: "Missing release ID" };
                }
                
                if (!endDate) {
                  return { success: false, msg: "End date is required", error: "Missing end date" };
                }
                
                // Update only the endDate field for the specified release
                const { data, error } = await supabase
                  .from('streams')
                  .update({ endDate: endDate })
                  .eq('id', streamId)
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



/**
 * Fetch a digital item by its ID with episodes
 * @param {string} id - The ID of the digital item to fetch
 * @returns {Promise<Object>} - Object containing success status and data/error message
 */
export const fetchDigitalById = async (id) => {
  try {
    // Fetch the stream
    const { data: streamData, error } = await supabase
      .from('streams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error in fetchDigitalById:", error);
      return { success: false, msg: "Could not fetch digital item", error: error.message };
    }

    // Fetch episodes for this stream
    const { data: episodesData, error: episodesError } = await supabase
      .from('series_episodes')
      .select('*')
      .eq('stream_id', id)
      .order('episode_number', { ascending: true });

    if (episodesError) {
      console.error("Error fetching episodes:", episodesError);
      // Continue without episodes rather than failing
    }

    // Attach episodes to stream
    const data = {
      ...streamData,
      episodes: episodesData ? episodesData.sort((a, b) => a.episode_number - b.episode_number) : []
    };

    return { success: true, data };
  } catch (error) {
    console.error("Error in fetchDigitalById:", error);
    return { success: false, msg: "Could not fetch digital item", error: error.message };
  }
};

/**
 * Update a digital item with new data
 * @param {Object} digitalData - The digital data to update with (must include id)
 * @returns {Promise<Object>} - Object containing success status and data/error message
 */
export const updateDigital = async (digitalData) => {
  try {
    if (!digitalData.id) {
      return { success: false, msg: "Digital item ID is required" };
    }

    // Create a copy of the data to update
    const updateData = { ...digitalData };
    
    // Ensure dates are in ISO format
    if (updateData.rDate && updateData.rDate instanceof Date) {
      updateData.rDate = updateData.rDate.toISOString();
    }
    
    if (updateData.endDate && updateData.endDate instanceof Date) {
      updateData.endDate = updateData.endDate.toISOString();
    }

    // Update the digital item in the database
    const { data, error } = await supabase
      .from('streams')
      .update(updateData)
      .eq('id', digitalData.id)
      .select()
      .single();

    if (error) {
      console.error("Error in updateDigital:", error);
      return { success: false, msg: "Could not update digital item", error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateDigital:", error);
    return { success: false, msg: "Could not update digital item", error: error.message };
  }
};

/**
 * Fetch all digital items with optional limit
 * @param {number} limit - Optional limit of items to fetch (defaults to 20)
 * @returns {Promise<Object>} - Object containing success status and data/error message
 */
export const fetchDigitals = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error in fetchDigitals:", error);
      return { success: false, msg: "Could not fetch digital items", error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in fetchDigitals:", error);
    return { success: false, msg: "Could not fetch digital items", error: error.message };
  }
};

/**
 * Delete a digital item (stream) by ID
 * @param {string|number} streamId - The ID of the stream to delete
 * @returns {Promise<Object>} - Object containing success status and data/error message
 */
export const deleteStream = async (streamId) => {
  try {
    if (!streamId) {
      return { success: false, msg: "Stream ID is required" };
    }

    // 1) Cleanup critic reviews (preview) and their replies for this stream
    try {
      const { data: previews, error: previewError } = await supabase
        .from('preview')
        .select('id')
        .eq('releaseId', streamId);

      if (previewError) {
        console.error("Error fetching preview rows for deleteStream:", previewError);
      } else if (previews && previews.length > 0) {
        const previewIds = previews.map(p => p.id);

        // Delete replies for these previews
        if (previewIds.length > 0) {
          const { error: replyError } = await supabase
            .from('previewsreply')
            .delete()
            .in('previewId', previewIds);

          if (replyError) {
            console.error("Error deleting previewsreply in deleteStream:", replyError);
          }

          // Delete the previews themselves
          const { error: deletePreviewError } = await supabase
            .from('preview')
            .delete()
            .in('id', previewIds);

          if (deletePreviewError) {
            console.error("Error deleting preview rows in deleteStream:", deletePreviewError);
          }
        }
      }
    } catch (cleanupError) {
      console.error("Unexpected error cleaning up preview data in deleteStream:", cleanupError);
    }

    // 2) Cleanup people reviews (dpeopreviews) and all related data for this stream
    try {
      const { data: dPeopleReviews, error: dPeopleError } = await supabase
        .from('dpeopreviews')
        .select('id')
        .eq('releaseId', streamId);

      if (dPeopleError) {
        console.error("Error fetching dpeopreviews for deleteStream:", dPeopleError);
      } else if (dPeopleReviews && dPeopleReviews.length > 0) {
        const dPeopleIds = dPeopleReviews.map(r => r.id);

        // Delete upvotes / downvotes linked to these people reviews
        if (dPeopleIds.length > 0) {
          const { error: upvoteError } = await supabase
            .from('dupvote')
            .delete()
            .in('dpeopleReviewId', dPeopleIds);

          if (upvoteError) {
            console.error("Error deleting dupvote rows in deleteStream:", upvoteError);
          }

          const { error: downvoteError } = await supabase
            .from('ddownvotes')
            .delete()
            .in('dpeopleReviewId', dPeopleIds);

          if (downvoteError) {
            console.error("Error deleting ddownvotes rows in deleteStream:", downvoteError);
          }

          // Find replies for these people reviews
          const { data: dReplies, error: dRepliesError } = await supabase
            .from('replydpeopreviews')
            .select('id')
            .in('replypreviewId', dPeopleIds);

          if (dRepliesError) {
            console.error("Error fetching replydpeopreviews in deleteStream:", dRepliesError);
          } else if (dReplies && dReplies.length > 0) {
            const replyIds = dReplies.map(r => r.id);

            // Delete likes on those replies
            if (replyIds.length > 0) {
              const { error: dLikesError } = await supabase
                .from('dplikes')
                .delete()
                .in('replydpeoplereviewId', replyIds);

              if (dLikesError) {
                console.error("Error deleting dplikes in deleteStream:", dLikesError);
              }
            }

            // Delete the reply records themselves
            const { error: deleteDRepliesError } = await supabase
              .from('replydpeopreviews')
              .delete()
              .in('id', replyIds);

            if (deleteDRepliesError) {
              console.error("Error deleting replydpeopreviews in deleteStream:", deleteDRepliesError);
            }
          }

          // Finally delete the dpeopreviews rows
          const { error: deleteDPeopleError } = await supabase
            .from('dpeopreviews')
            .delete()
            .in('id', dPeopleIds);

          if (deleteDPeopleError) {
            console.error("Error deleting dpeopreviews in deleteStream:", deleteDPeopleError);
          }
        }
      }
    } catch (cleanupError) {
      console.error("Unexpected error cleaning up dpeopreviews in deleteStream:", cleanupError);
    }

    const { error } = await supabase
      .from('streams')
      .delete()
      .eq('id', streamId);

    if (error) {
      console.error("Error in deleteStream:", error);
      return { success: false, msg: "Could not delete stream", error: error.message };
    }

    return { success: true, msg: "Stream deleted successfully" };
  } catch (error) {
    console.error("Error in deleteStream:", error);
    return { success: false, msg: "Could not delete stream", error: error.message };
  }
};



            
        
        