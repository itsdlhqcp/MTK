import { supabase } from "@/lib/supabase";

export const getUserPreferences = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('userId', userId)
            .single();
        
        if (error) {
            // If no record found, return success with null data
            if (error.code === 'PGRST116') {
                return { 
                    success: true, 
                    data: {
                        genere: [],
                        languages: [],
                        is_new_user: false
                    }, 
                    msg: 'No preferences found' 
                };
            }
            return { success: false, msg: error?.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.log('getUserPreferences error:', error);
        return { success: false, msg: error?.message };
    }
};

export const updateUserPreferences = async (userId, preferences) => {
    try {
        // First check if the record exists
        const { data: existingPreference, error: selectError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('userId', userId)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            // If error is not "no rows returned", throw it
            return { success: false, msg: selectError.message };
        }

        const now = new Date().toISOString();

        if (existingPreference) {
            // If record exists, update it
            const { data, error } = await supabase
                .from('user_preferences')
                .update({
                    ...preferences,
                    updated_at: now
                })
                .eq('userId', userId)
                .select()
                .single();

            if (error) {
                return { success: false, msg: error.message };
            }
            return { success: true, data, msg: 'Preferences updated successfully' };
        } else {
            // If record doesn't exist, insert new one
            const { data, error } = await supabase
                .from('user_preferences')
                .insert({
                    userId,
                    ...preferences,
                    created_at: now,
                    updated_at: now
                })
                .select()
                .single();

            if (error) {
                return { success: false, msg: error.message };
            }
            return { success: true, data, msg: 'Preferences created successfully' };
        }
    } catch (error) {
        console.log('updateUserPreferences error:', error);
        return { success: false, msg: error?.message };
    }
};

export const deleteUserPreferences = async (userId) => {
    try {
        const { error } = await supabase
            .from('user_preferences')
            .delete()
            .eq('userId', userId);

        if (error) {
            return { success: false, msg: error.message };
        }
        return { success: true, msg: 'Preferences deleted successfully' };
    } catch (error) {
        console.log('deleteUserPreferences error:', error);
        return { success: false, msg: error?.message };
    }
};

export const getUserPreferencesHistory = async (userId, limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('userId', userId)
            .order('updated_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            return { success: false, msg: error.message };
        }
        return { success: true, data };
    } catch (error) {
        console.log('getUserPreferencesHistory error:', error);
        return { success: false, msg: error?.message };
    }
};

export const validatePreferences = (preferences) => {
    const errors = [];
    
    const genres = Array.isArray(preferences.genere) ? preferences.genere : [];
    const languages = Array.isArray(preferences.languages) ? preferences.languages : [];
    
    if (genres.length < 2) {
        errors.push('At least 2 genres must be selected');
    }
    
    if (languages.length < 2) {
        errors.push('At least 2 languages must be selected');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const getPreferencesStatistics = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('genere, languages, created_at, updated_at')
            .eq('userId', userId)
            .single();
        
        if (error) {
            return { success: false, msg: error.message };
        }
        
        const stats = {
            totalGenres: data.genere ? data.genere.length : 0,
            totalLanguages: data.languages ? data.languages.length : 0,
            createdAt: data.created_at,
            lastUpdated: data.updated_at,
            hasPreferences: !!(data.genere?.length && data.languages?.length)
        };
        
        return { success: true, data: stats };
    } catch (error) {
        console.log('getPreferencesStatistics error:', error);
        return { success: false, msg: error?.message };
    }
};

// Utility function to compare two preference objects
export const comparePreferences = (current, original) => {
    if (!current || !original) return true;
    
    const currentGenres = Array.isArray(current.genere) ? [...current.genere].sort() : [];
    const originalGenres = Array.isArray(original.genere) ? [...original.genere].sort() : [];
    const currentLanguages = Array.isArray(current.languages) ? [...current.languages].sort() : [];
    const originalLanguages = Array.isArray(original.languages) ? [...original.languages].sort() : [];
    
    const genresChanged = JSON.stringify(currentGenres) !== JSON.stringify(originalGenres);
    const languagesChanged = JSON.stringify(currentLanguages) !== JSON.stringify(originalLanguages);
    
    return genresChanged || languagesChanged;
};

// Utility function to get default preferences
export const getDefaultPreferences = () => {
    return {
        genere: [],
        languages: [],
        is_new_user: false
    };
};

// Batch update function for multiple users (admin functionality)
export const batchUpdatePreferences = async (updates) => {
    try {
        const results = [];
        
        for (const update of updates) {
            const result = await updateUserPreferences(update.userId, update.preferences);
            results.push({
                userId: update.userId,
                ...result
            });
        }
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        
        return {
            success: failureCount === 0,
            results,
            summary: {
                total: results.length,
                successful: successCount,
                failed: failureCount
            }
        };
    } catch (error) {
        console.log('batchUpdatePreferences error:', error);
        return { success: false, msg: error?.message };
    }
};