import { supabase } from "../lib/supabase";

export const fetchUserReviews = async (userId) => {
    try {
      // Query to get reviews by the current user with corresponding release details
      const { data, error } = await supabase
        .from('peoplesReview')
        .select(`
          id,
          text,
          favour,
          created_at,
          userRating,
          cupOfTea,
          release: releases(id, rDate, body, file)
        `)
        .eq('userId', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error in fetchUserReviews:", error);
        return { success: false, msg: "Could not fetch your reviews", error: error.message };
      }
      
      // Transform data to include release details in a more accessible format
      const formattedData = data.map(review => ({
        id: review.id,
        text: review.text,
        created_at: review.created_at,
        userRating: review.userRating,
        topOfTea: review.topOfTea,
        releaseId: review.release?.id,
        releaseDate: review.release?.rDate,
        releaseBody: review.release?.body,
        releasePoster: review.release?.file,
        favour: review.favour,
        original_table: 'peoplesReview'
      }));
      
      return { success: true, data: formattedData };
    } catch (error) {
      console.error("Error in fetchUserReviews:", error);
      return { success: false, msg: "Could not fetch your reviews", error: error.message };
    }
  };
  
  export const fetchUserReviewForRelease = async (userId, releaseId) => {
    try {
      const { data, error } = await supabase
        .from('peoplesReview')
        .select(`
          id,
          text,
          favour,
          created_at,
          userRating,
          topOfTea,
          release: releases(id, body)
        `)
        .eq('userId', userId)
        .eq('releaseId', releaseId)
        .single();
      
      if (error) {
        console.error("Error in fetchUserReviewForRelease:", error);
        return { success: false, msg: "Could not fetch your review", error: error.message };
      }
      
      const formattedData = {
        id: data.id,
        text: data.text,
        created_at: data.created_at,
        userRating: data.userRating,
        topOfTea: data.topOfTea,
        releaseId: data.release?.id,
        releaseBody: data.release?.body,
        releasePoster: data.release?.file,
        favour: data.favour
      };
      
      return { success: true, data: formattedData };
    } catch (error) {
      console.error("Error in fetchUserReviewForRelease:", error);
      return { success: false, msg: "Could not fetch your review", error: error.message };
    }
  };

  // FETCH REVIEWS FOR THE DIGITAL USERS

  export const fetchUserDreviews = async (userId) => {
    try {
      // Query to get reviews by the current user with corresponding release details
      const { data, error } = await supabase
        .from('dpeopreviews')
        .select(`
          id,
          text,
          favour,
          created_at,
          userRating,
          cupOfTea,
          stream: streams(id, rDate, body, file)
        `)
        .eq('userId', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error in fetchUserReviews:", error);
        return { success: false, msg: "Could not fetch your reviews", error: error.message };
      }
      
      // Transform data to include release details in a more accessible format
      const formattedData = data.map(review => ({
        id: review.id,
        text: review.text,
        created_at: review.created_at,
        userRating: review.userRating,
        topOfTea: review.topOfTea,
        releaseId: review.stream?.id,
        releaseDate: review.stream?.rDate,
        releaseBody: review.stream?.body,
        releasePoster: review.stream?.file,
        favour: review.favour,
        original_table: 'dpeopreviews'
      }));
      
      return { success: true, data: formattedData };
    } catch (error) {
      console.error("Error in fetchUserReviews:", error);
      return { success: false, msg: "Could not fetch your reviews", error: error.message };
    }
  };
  
  export const fetchUserDreviewForRelease = async (userId, releaseId) => {
    try {
      const { data, error } = await supabase
        .from('dpeopreviews')
        .select(`
          id,
          text,
          created_at,
          userRating,
          topOfTea,
          favour,
          stream: streams(id, body)
        `)
        .eq('userId', userId)
        .eq('releaseId', releaseId)
        .single();
      
      if (error) {
        console.error("Error in fetchUserReviewForRelease:", error);
        return { success: false, msg: "Could not fetch your review", error: error.message };
      }
      
      const formattedData = {
        id: data.id,
        text: data.text,
        created_at: data.created_at,
        userRating: data.userRating,
        topOfTea: data.topOfTea,
        releaseId: data.stream?.id,
        releaseBody: data.stream?.body,
        releasePoster: data.stream?.file,
        favour: data.favour
      };
      
      return { success: true, data: formattedData };
    } catch (error) {
      console.error("Error in fetchUserReviewForRelease:", error);
      return { success: false, msg: "Could not fetch your review", error: error.message };
    }
  };