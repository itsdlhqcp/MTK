import { supabase } from '../lib/supabase';

export const friendRequestService = {
  // Send a friend request to another user
  sendRequest: async (receiverId) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const senderId = userData.user.id;
      
      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .maybeSingle();
        
      if (existingRequest) {
        return { 
          success: false, 
          message: 'You Already placed a friend request' 
        };
      }
      
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          status: 'pending'
        })
        .select();
        
      if (error) {
        console.error('Error sending friend request:', error);
        return { success: false, message: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error in sendRequest:', error);
      return { success: false, message: 'Failed to send request' };
    }
  },
  
  // Get all friend requests for the current user
  getRequests: async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      // Get incoming requests
      const { data: incomingRequests, error: incomingError } = await supabase
        .from('friend_requests')
        .select(`
          id,
          status,
          created_at,
          sender:sender_id(id, name, image)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending');
        
      // Get outgoing requests
      const { data: outgoingRequests, error: outgoingError } = await supabase
        .from('friend_requests')
        .select(`
          id,
          status,
          created_at,
          receiver:receiver_id(id, name, image)
        `)
        .eq('sender_id', userId)
        .eq('status', 'pending');
        
      if (incomingError || outgoingError) {
        console.error('Error fetching requests:', incomingError || outgoingError);
        return { success: false };
      }
      
      return { 
        success: true, 
        data: {
          incoming: incomingRequests || [],
          outgoing: outgoingRequests || []
        }
      };
    } catch (error) {
      console.error('Error in getRequests:', error);
      return { success: false, message: 'Failed to fetch requests' };
    }
  },
  
  // Accept a friend request
  acceptRequest: async (requestId) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      // First verify this user is the receiver of the request
      const { data: request } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('receiver_id', userId)
        .single();
        
      if (!request) {
        return { success: false, message: 'Request not found or not authorized' };
      }
      
      // Update the request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
        
      if (updateError) {
        console.error('Error accepting request:', updateError);
        return { success: false, message: updateError.message };
      }
      
      // Create a conversation between the two users
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          user1_id: request.sender_id,
          user2_id: request.receiver_id
        })
        .select()
        .single();
        
      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        return { success: false, message: conversationError.message };
      }
      
      return { success: true, data: conversation };
    } catch (error) {
      console.error('Error in acceptRequest:', error);
      return { success: false, message: 'Failed to accept request' };
    }
  },
  
  // Reject a friend request
  rejectRequest: async (requestId) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      // Verify this user is the receiver
      const { data: request } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('receiver_id', userId)
        .single();
        
      if (!request) {
        return { success: false, message: 'Request not found or not authorized' };
      }
      
      // Update the request status
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
        
      if (error) {
        console.error('Error rejecting request:', error);
        return { success: false, message: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in rejectRequest:', error);
      return { success: false, message: 'Failed to reject request' };
    }
  },
  
  // Get list of friends (accepted requests)
  getFriends: async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      // Get friends where user was the sender
      const { data: sentRequests, error: sentError } = await supabase
        .from('friend_requests')
        .select(`
          receiver:receiver_id(id, name, image, bio)
        `)
        .eq('sender_id', userId)
        .eq('status', 'accepted');
        
      // Get friends where user was the receiver
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friend_requests')
        .select(`
          sender:sender_id(id, name, image, bio)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'accepted');
        
      if (sentError || receivedError) {
        console.error('Error fetching friends:', sentError || receivedError);
        return { success: false };
      }
      
      // Combine and format the results
      const friends = [
        ...(sentRequests?.map(req => req.receiver) || []),
        ...(receivedRequests?.map(req => req.sender) || [])
      ];
      
      return { success: true, data: friends };
    } catch (error) {
      console.error('Error in getFriends:', error);
      return { success: false, message: 'Failed to fetch friends' };
    }
  },
  
  // Check if users are friends
  checkFriendship: async (otherUserId) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      const { data, error } = await supabase
        .from('friend_requests')
        .select('status')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking friendship:', error);
        return { success: false, message: error.message };
      }
      
      if (!data) {
        return { success: true, status: 'none' };
      }
      
      return { success: true, status: data.status };
    } catch (error) {
      console.error('Error in checkFriendship:', error);
      return { success: false, message: 'Failed to check friendship status' };
    }
  },



     // Get friends count for current user
  getFriendsCount: async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      // Count friends where user was the sender
      const { count: sentCount, error: sentError } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact' })
        .eq('sender_id', userId)
        .eq('status', 'accepted');
        
      // Count friends where user was the receiver
      const { count: receivedCount, error: receivedError } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact' })
        .eq('receiver_id', userId)
        .eq('status', 'accepted');
        
      if (sentError || receivedError) {
        console.error('Error counting friends:', sentError || receivedError);
        return { success: false, message: 'Failed to count friends' };
      }
      
      const totalCount = (sentCount || 0) + (receivedCount || 0);
      
      return { success: true, count: totalCount };
    } catch (error) {
      console.error('Error in getFriendsCount:', error);
      return { success: false, message: 'Failed to count friends' };
    }
  }

};

