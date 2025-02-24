import { supabase } from "@/lib/supabase";

export const getUserPreferences = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select()
            .eq('userId', userId)
            .single();
        
        if (error) {
            return { success: false, msg: error?.message };
        }
        return { success: true, data };
    } catch (error) {
        console.log('got error', error);
        return { success: false, msg: error?.message };
    }
};

export const updateUserPreferences = async (userId, preferences) => {
    try {
        // First check if the record exists
        const { data: existingPreference } = await supabase
            .from('user_preferences')
            .select()
            .eq('userId', userId)
            .single();

        if (existingPreference) {
            // If record exists, update it
            const { error } = await supabase
                .from('user_preferences')
                .update({
                    ...preferences,
                    updated_at: new Date()
                })
                .eq('userId', userId);

            if (error) {
                return { success: false, msg: error?.message };
            }
        } else {
            // If record doesn't exist, insert new one
            const { error } = await supabase
                .from('user_preferences')
                .insert({
                    userId,
                    ...preferences,
                    updated_at: new Date()
                });

            if (error) {
                return { success: false, msg: error?.message };
            }
        }

        return { success: true, data: preferences };
    } catch (error) {
        console.log('got error', error);
        return { success: false, msg: error?.message };
    }
};