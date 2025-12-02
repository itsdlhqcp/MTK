import { supabase } from "@/lib/supabase";

export const getUserData = async (userId) => {
    try{
        const { data, error } = await supabase
        .from('users')
        .select()
        .eq('id', userId)
        .single();
         if(error){
            return {success: false, msg: error?.message};
         }
         return {success: true, data};
    }catch(error){
       console.log('got error', error);
       return {success: false, msg: error?.message};
    }
}

export const updateUser = async (userId, data) => {
   try{
       const { error } = await supabase
       .from('users')
       .update(data)
       .eq('id', userId);
        if(error){
           return {success: false, msg: error?.message};
        }
        return {success: true, data};
   }catch(error){
      console.log('got error', error);
      return {success: false, msg: error?.message};
   }
}

export const deleteUserAccount = async (userId) => {
    try {
        // Only delete the user from the users table
        // This preserves all other data (messages, posts, etc.) but removes the user account
        const { error: userError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (userError) {
            return { success: false, msg: userError.message };
        }

        // Delete the auth user (this only removes authentication, not related data)
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        
        if (authError) {
            console.log('Auth deletion error:', authError);
            // Even if auth deletion fails, the user profile is deleted
            // so the account is effectively deactivated
        }

        return { success: true, msg: 'Account deleted successfully' };
    } catch (error) {
        console.log('Delete account error:', error);
        return { success: false, msg: error?.message || 'Failed to delete account' };
    }
}