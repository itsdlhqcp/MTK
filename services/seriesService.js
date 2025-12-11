import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

/**
 * Create a new series
 * @param {Object} seriesData - Series data object
 * @returns {Promise<Object>} - Success status and data/error message
 */
export const createSeries = async (seriesData) => {
  try {
    const { data, error } = await supabase
      .from('series')
      .insert([seriesData])
      .select()
      .single();

    if (error) {
      console.error("Error in createSeries:", error);
      return { success: false, msg: "Could not create series", error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in createSeries:", error);
    return { success: false, msg: "Could not create series", error: error.message };
  }
};

/**
 * Upload multiple images for a series
 * @param {Array} imageFiles - Array of image file objects { uri, type }
 * @param {Number} seriesId - Series ID
 * @param {String} imageType - Type of image (poster, banner, gallery, etc.)
 * @returns {Promise<Object>} - Success status and uploaded image paths
 */
export const uploadSeriesImages = async (imageFiles, seriesId, imageType = 'poster') => {
  try {
    const uploadedImages = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      
      if (imageFile && typeof imageFile === "object" && imageFile.uri) {
        const fileResult = await uploadProfileImage('postImage', imageFile.uri, true);
        
        if (fileResult.success) {
          // Insert image record into series_images table
          const { data, error } = await supabase
            .from('series_images')
            .insert({
              series_id: seriesId,
              image_path: fileResult.data,
              image_order: i + 1,
              image_type: imageType
            })
            .select()
            .single();

          if (!error) {
            uploadedImages.push(data);
          } else {
            console.error(`Error saving image ${i + 1}:`, error);
          }
        } else {
          console.error(`Error uploading image ${i + 1}:`, fileResult);
        }
      }
    }

    return { success: true, data: uploadedImages };
  } catch (error) {
    console.error("Error in uploadSeriesImages:", error);
    return { success: false, msg: "Could not upload series images", error: error.message };
  }
};

/**
 * Create episodes for a series
 * @param {Array} episodes - Array of episode objects
 * @returns {Promise<Object>} - Success status and created episodes
 */
export const createSeriesEpisodes = async (episodes) => {
  try {
    if (!episodes || episodes.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from('series_episodes')
      .insert(episodes)
      .select();

    if (error) {
      console.error("Error in createSeriesEpisodes:", error);
      return { success: false, msg: "Could not create episodes", error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in createSeriesEpisodes:", error);
    return { success: false, msg: "Could not create episodes", error: error.message };
  }
};

/**
 * Fetch all series with their images and episodes
 * @param {Number} limit - Optional limit of items to fetch
 * @returns {Promise<Object>} - Success status and series data
 */
export const fetchSeries = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('series')
      .select(`
        *,
        images: series_images(*),
        episodes: series_episodes(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error in fetchSeries:", error);
      return { success: false, msg: "Could not fetch series", error: error.message };
    }

    // Sort episodes by episode_number
    if (data) {
      data.forEach(series => {
        if (series.episodes) {
          series.episodes.sort((a, b) => a.episode_number - b.episode_number);
        }
        if (series.images) {
          series.images.sort((a, b) => a.image_order - b.image_order);
        }
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in fetchSeries:", error);
    return { success: false, msg: "Could not fetch series", error: error.message };
  }
};

/**
 * Fetch a single series by ID with images and episodes
 * @param {Number} seriesId - Series ID
 * @returns {Promise<Object>} - Success status and series data
 */
export const fetchSeriesById = async (seriesId) => {
  try {
    const { data, error } = await supabase
      .from('series')
      .select(`
        *,
        images: series_images(*),
        episodes: series_episodes(*)
      `)
      .eq('id', seriesId)
      .single();

    if (error) {
      console.error("Error in fetchSeriesById:", error);
      return { success: false, msg: "Could not fetch series", error: error.message };
    }

    // Sort episodes by episode_number
    if (data && data.episodes) {
      data.episodes.sort((a, b) => a.episode_number - b.episode_number);
    }
    // Sort images by image_order
    if (data && data.images) {
      data.images.sort((a, b) => a.image_order - b.image_order);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in fetchSeriesById:", error);
    return { success: false, msg: "Could not fetch series", error: error.message };
  }
};

/**
 * Update a series
 * @param {Number} seriesId - Series ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Success status and updated data
 */
export const updateSeries = async (seriesId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('series')
      .update(updateData)
      .eq('id', seriesId)
      .select()
      .single();

    if (error) {
      console.error("Error in updateSeries:", error);
      return { success: false, msg: "Could not update series", error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateSeries:", error);
    return { success: false, msg: "Could not update series", error: error.message };
  }
};

/**
 * Delete a series by ID (also deletes related episodes and images)
 * @param {Number} seriesId - Series ID to delete
 * @returns {Promise<Object>} - Success status and data/error message
 */
export const deleteSeries = async (seriesId) => {
  try {
    if (!seriesId) {
      return { success: false, msg: "Series ID is required" };
    }

    // Delete related episodes first
    const { error: episodesError } = await supabase
      .from('series_episodes')
      .delete()
      .eq('series_id', seriesId);

    if (episodesError) {
      console.error("Error deleting series episodes:", episodesError);
      // Continue with series deletion even if episodes deletion fails
    }

    // Delete related images
    const { error: imagesError } = await supabase
      .from('series_images')
      .delete()
      .eq('series_id', seriesId);

    if (imagesError) {
      console.error("Error deleting series images:", imagesError);
      // Continue with series deletion even if images deletion fails
    }

    // Delete the series itself
    const { error } = await supabase
      .from('series')
      .delete()
      .eq('id', seriesId);

    if (error) {
      console.error("Error in deleteSeries:", error);
      return { success: false, msg: "Could not delete series", error: error.message };
    }

    return { success: true, msg: "Series deleted successfully" };
  } catch (error) {
    console.error("Error in deleteSeries:", error);
    return { success: false, msg: "Could not delete series", error: error.message };
  }
};




