import { supabase } from "../lib/supabase";

// Modified to support pagination for user reviews
export const fetchUserReviews = async (userId, page = 1, pageSize = 10) => {
  try {
    // Calculate offset for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // First get the total count for pagination info
    const { count, error: countError } = await supabase
      .from('peoplesReview')
      .select('id', { count: 'exact' })
      .eq('userId', userId);
      
    if (countError) {
      console.error("Error counting reviews:", countError);
      return { success: false, msg: "Could not count reviews", error: countError.message };
    }

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
      .order('created_at', { ascending: false })
      .range(from, to);
    
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
    
    // Return with pagination metadata
    return { 
      success: true, 
      data: formattedData,
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
        hasMore: to < count - 1
      }
    };
  } catch (error) {
    console.error("Error in fetchUserReviews:", error);
    return { success: false, msg: "Could not fetch your reviews", error: error.message };
  }
};

// Modified to support pagination for digital reviews
export const fetchUserDreviews = async (userId, page = 1, pageSize = 10) => {
  try {
    // Calculate offset for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // First get the total count for pagination info
    const { count, error: countError } = await supabase
      .from('dpeopreviews')
      .select('id', { count: 'exact' })
      .eq('userId', userId);
      
    if (countError) {
      console.error("Error counting digital reviews:", countError);
      return { success: false, msg: "Could not count digital reviews", error: countError.message };
    }

    // Query to get reviews by the current user with corresponding stream details
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
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error("Error in fetchUserDreviews:", error);
      return { success: false, msg: "Could not fetch your reviews", error: error.message };
    }
    
    // Transform data to include stream details in a more accessible format
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
    
    // Return with pagination metadata
    return { 
      success: true, 
      data: formattedData,
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
        hasMore: to < count - 1
      }
    };
  } catch (error) {
    console.error("Error in fetchUserDreviews:", error);
    return { success: false, msg: "Could not fetch your reviews", error: error.message };
  }
};

// Helper function to fetch both types of reviews with pagination and merge them
export const fetchAllUserReviews = async (userId, page = 1, pageSize = 10) => {
  try {
    // Fetch both types of reviews with half the page size for each
    const halfPageSize = Math.ceil(pageSize / 2);
    
    const [reviewsResult, dreviewsResult] = await Promise.all([
      fetchUserReviews(userId, page, halfPageSize),
      fetchUserDreviews(userId, page, halfPageSize)
    ]);
    
    let allReviews = [];
    let totalCount = 0;
    
    if (reviewsResult.success) {
      allReviews = [...allReviews, ...reviewsResult.data];
      totalCount += reviewsResult.pagination.total;
    } else {
      console.error('Failed to load reviews:', reviewsResult.msg);
    }
    
    if (dreviewsResult.success) {
      allReviews = [...allReviews, ...dreviewsResult.data];
      totalCount += dreviewsResult.pagination.total;
    } else {
      console.error('Failed to load dreviews:', dreviewsResult.msg);
    }
    
    // Sort by created_at date, newest first
    allReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Trim to ensure we don't exceed pageSize
    if (allReviews.length > pageSize) {
      allReviews = allReviews.slice(0, pageSize);
    }
    
    return { 
      success: true, 
      data: allReviews,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount
      }
    };
  } catch (error) {
    console.error('Error loading all reviews:', error);
    return { success: false, msg: "Could not fetch reviews", error: error.message };
  }
};

// Fetch "now showing" theatre releases and "now streaming" digital releases that user hasn't reviewed
export const fetchRateNowSuggestions = async (userId) => {
  try {
    if (!userId) {
      return { success: false, msg: 'User ID is required' };
    }

    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // Fetch "now showing" theatre releases (releases where rDate <= today and (endDate is null or endDate >= today))
    // We fetch more than needed and filter client-side for endDate logic
    const { data: theatreReleasesRaw, error: theatreError } = await supabase
      .from('releases')
      .select(`
        id,
        body,
        rDate,
        endDate,
        file,
        filel,
        sconnectedId
      `)
      .lte('rDate', today)
      .order('rDate', { ascending: false })
      .limit(20);
    
    // Filter client-side: keep only releases where endDate is null or endDate >= today
    const todayDate = new Date(today);
    const theatreReleases = (theatreReleasesRaw || []).filter(release => {
      if (!release.endDate) return true;
      const endDate = new Date(release.endDate);
      return endDate >= todayDate;
    });

    if (theatreError) {
      console.error('Error fetching theatre releases:', theatreError);
    }

    // Fetch "now streaming" digital releases (streams where rDate <= today and (endDate is null or endDate >= today))
    // We fetch more than needed and filter client-side for endDate logic
    const { data: digitalReleasesRaw, error: digitalError } = await supabase
      .from('streams')
      .select(`
        id,
        body,
        rDate,
        endDate,
        file,
        filel
      `)
      .lte('rDate', today)
      .order('rDate', { ascending: false })
      .limit(20);
    
    // Filter client-side: keep only releases where endDate is null or endDate >= today
    const todayDateForDigital = new Date(today);
    const digitalReleases = (digitalReleasesRaw || []).filter(release => {
      if (!release.endDate) return true;
      const endDate = new Date(release.endDate);
      return endDate >= todayDateForDigital;
    });

    if (digitalError) {
      console.error('Error fetching digital releases:', digitalError);
    }

    // Get user's reviewed release/stream IDs
    const [theatreReviews, digitalReviews] = await Promise.all([
      supabase
        .from('peoplesReview')
        .select('releaseId')
        .eq('userId', userId),
      supabase
        .from('dpeopreviews')
        .select('releaseId')
        .eq('userId', userId)
    ]);

    const reviewedTheatreIds = new Set(
      (theatreReviews.data || []).map(r => r.releaseId)
    );
    const reviewedDigitalIds = new Set(
      (digitalReviews.data || []).map(r => r.releaseId)
    );

    // Filter out releases user has already reviewed
    const availableTheatre = (theatreReleases || [])
      .filter(release => !reviewedTheatreIds.has(release.id))
      .slice(0, 1)
      .map(release => ({
        ...release,
        type: 'theatre',
        releaseId: release.id
      }));

    const availableDigital = (digitalReleases || [])
      .filter(release => !reviewedDigitalIds.has(release.id))
      .slice(0, 1)
      .map(release => ({
        ...release,
        type: 'digital',
        releaseId: release.id
      }));

    // Combine and return up to 2 suggestions
    const suggestions = [...availableTheatre, ...availableDigital].slice(0, 2);

    return {
      success: true,
      data: suggestions
    };
  } catch (error) {
    console.error('Error fetching rate now suggestions:', error);
    return { success: false, msg: 'Could not fetch suggestions', error: error.message };
  }
};

// Keep the single review fetch functions unchanged
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