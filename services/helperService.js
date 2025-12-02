import { supabase } from '../lib/supabase';

export const userService = {
  // Get user id by username
  getUserIdByName: async (username) => {
    try {
      if (!username) return null;
      
      // Fetch user data based on name
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('name', username)
        .single();
        
      if (error) {
        console.error('Error fetching user by name:', error);
        return null;
      }
      
      return data ? data.id : null;
    } catch (error) {
      console.error('Error in getUserIdByName:', error);
      return null;
    }
  },
  
  // Get complete user object by username
  getUserByName: async (username) => {
    try {
      if (!username) return null;
      
      // Fetch user data based on name
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', username)
        .single();
        
      if (error) {
        console.error('Error fetching user by name:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserByName:', error);
      return null;
    }
  }
};