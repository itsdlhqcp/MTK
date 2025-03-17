import { supabase } from '../lib/supabase';

export const profileService = {
  // Get profile data for a specific user
  getProfileData: async (userId) => {
    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('Error fetching user data:', userError);
        return { success: false, message: userError.message };
      }
      
      // Fetch post count
      const { count: postCount, error: postError } = await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('userId', userId);
        
      if (postError) {
        console.error('Error counting posts:', postError);
        // Continue with user data even if post count fails
      }
      
      // Fetch friends count
      let friendsCount = 0;
      try {
        // Count friends where user was the sender
        const { count: sentCount } = await supabase
          .from('friend_requests')
          .select('*', { count: 'exact' })
          .eq('sender_id', userId)
          .eq('status', 'accepted');
          
        // Count friends where user was the receiver
        const { count: receivedCount } = await supabase
          .from('friend_requests')
          .select('*', { count: 'exact' })
          .eq('receiver_id', userId)
          .eq('status', 'accepted');
          
        friendsCount = (sentCount || 0) + (receivedCount || 0);
      } catch (friendError) {
        console.error('Error counting friends:', friendError);
        // Continue with other data even if friends count fails
      }
      
      return { 
        success: true, 
        userData, 
        postCount, 
        friendsCount 
      };
    } catch (error) {
      console.error('Error in getProfileData:', error);
      return { success: false, message: 'Failed to fetch profile data' };
    }
  },
  
  // Get posts for a specific user with pagination
  getUserPosts: async (userId, limit = 10) => {
    try {
      // Fetch posts with user info
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:userId (
            id, name, image
          )
        `)
        .eq('userId', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('Error fetching user posts:', error);
        return { success: false, message: error.message };
      }
      
      // Process the posts to include like and comment counts
      const processedPosts = data.map(post => {
        return {
          ...post,
        //   likesCount: post.likes ? post.likes.length : 0,
          commentsCount: post.comments ? post.comments.length : 0,
          // Check if the post is liked by the current user is done in the component
        };
      });
      
      return { success: true, data: processedPosts };
    } catch (error) {
      console.error('Error in getUserPosts:', error);
      return { success: false, message: 'Failed to fetch user posts' };
    }
  }
};