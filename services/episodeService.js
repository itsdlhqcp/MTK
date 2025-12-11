import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Upload PDF file to Supabase storage
export const uploadPDF = async (fileUri) => {
  try {
    if (!fileUri) {
      throw new Error('File URI is required');
    }

    const timestamp = new Date().getTime();
    const filename = `/episodePDFs/${timestamp}.pdf`;

    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist at path: ' + fileUri);
    }

    // Read file as base64
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!fileBase64) {
      throw new Error('Failed to read file as base64');
    }

    // Convert to array buffer
    const fileData = decode(fileBase64);

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('profileImage')
      .upload(filename, fileData, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('PDF upload error:', error);
      throw error;
    }

    return {
      success: true,
      data: data.path
    };
  } catch (error) {
    console.error('PDF upload error:', error);
    return {
      success: false,
      msg: error.message || 'Failed to upload PDF',
      error
    };
  }
};

// Create or update episode (supports PDF and section-based)
export const createOrUpdateEpisode = async (episodeData) => {
  try {
    console.log("Starting createOrUpdateEpisode with data:", episodeData);

    // PDF upload is now handled per section, so we don't need to handle it here

    // Handle cover image upload if present
    if (episodeData.cover_image && typeof episodeData.cover_image === "object") {
      let isImage = episodeData.cover_image.type === "image";
      let folderName = isImage ? "postImage" : "postVideo";
      let fileResult = await uploadProfileImage(folderName, episodeData.cover_image.uri, isImage);
      if (fileResult.success) {
        episodeData.cover_image = fileResult.data;
      } else {
        return fileResult;
      }
    }

    // Prepare episode data for database
    const episodePayload = {
      body: episodeData.body || null,
      userId: episodeData.userId,
      tags: episodeData.tags ? JSON.stringify(episodeData.tags) : null,
      episode_type: episodeData.episode_type || 'regular',
      episode_title: episodeData.episode_title || null,
      episode_number: episodeData.episode_number || null,
      story_id: episodeData.story_id || null,
      pdf_file: null, // PDF files are now stored per section, not at episode level
      description: episodeData.description || null,
      cover_image: episodeData.cover_image || null,
      file: episodeData.file || null, // Keep for backward compatibility
    };

    // When updating an existing episode - include the episode id
    if (episodeData.id) {
      episodePayload.id = episodeData.id;
    }

    console.log("Sending episode data to Supabase:", episodePayload);

    // Insert or update the episode in the database
    const { data: episode, error: episodeError } = await supabase
      .from('twists')
      .upsert(episodePayload)
      .select()
      .single();

    if (episodeError) {
      console.error("Supabase error in createOrUpdateEpisode:", episodeError);
      return { success: false, msg: "Could not create or update episode", error: episodeError.message };
    }

    console.log("Episode created/updated successfully:", episode);

    // Handle section-based creation (both section_based and pdf methods) - save sections
    if ((episodeData.episode_type === 'section_based' || episodeData.episode_type === 'pdf') && episodeData.sections && Array.isArray(episodeData.sections)) {
      // Delete existing sections if updating
      if (episodeData.id) {
        await supabase
          .from('episode_sections')
          .delete()
          .eq('episode_id', episode.id);
      }

      // Upload section media files and create sections
      const sectionsToInsert = [];
      
      for (let i = 0; i < episodeData.sections.length; i++) {
        const section = episodeData.sections[i];
        const sectionData = {
          episode_id: episode.id,
          section_order: i + 1,
          text_content: section.text_content || null,
          image_file: null,
          video_file: null,
        };

        // Handle image upload for section
        if (section.image_file && typeof section.image_file === "object") {
          let imageResult = await uploadProfileImage("postImage", section.image_file.uri, true);
          if (imageResult.success) {
            sectionData.image_file = imageResult.data;
          }
        } else if (section.image_file && typeof section.image_file === "string") {
          sectionData.image_file = section.image_file;
        }

        // Handle video upload for section
        if (section.video_file && typeof section.video_file === "object") {
          let videoResult = await uploadProfileImage("postVideo", section.video_file.uri, false);
          if (videoResult.success) {
            sectionData.video_file = videoResult.data;
          }
        } else if (section.video_file && typeof section.video_file === "string") {
          sectionData.video_file = section.video_file;
        }

        // Handle PDF upload for section
        if (section.pdf_file && typeof section.pdf_file === "object") {
          let pdfResult = await uploadPDF(section.pdf_file.uri);
          if (pdfResult.success) {
            sectionData.pdf_file = pdfResult.data;
          } else {
            console.error("PDF upload failed for section:", pdfResult);
            return { success: false, msg: "Failed to upload PDF for section", error: pdfResult.msg };
          }
        } else if (section.pdf_file && typeof section.pdf_file === "string") {
          sectionData.pdf_file = section.pdf_file;
        }

        sectionsToInsert.push(sectionData);
      }

      // Insert all sections
      if (sectionsToInsert.length > 0) {
        const { error: sectionsError } = await supabase
          .from('episode_sections')
          .insert(sectionsToInsert);

        if (sectionsError) {
          console.error("Error inserting sections:", sectionsError);
          return { success: false, msg: "Episode created but failed to save sections", error: sectionsError.message };
        }
      }
    }

    return { success: true, data: episode };
  } catch (error) {
    console.error("Exception in createOrUpdateEpisode:", error);
    return { success: false, msg: "Could not create or update episode", error: error.message };
  }
};

// Fetch episode with sections
export const fetchEpisodeWithSections = async (episodeId) => {
  try {
    const { data: episode, error: episodeError } = await supabase
      .from('twists')
      .select(`
        *,
        user: users (id, name, image),
        twistLikes(*),
        twistUnlikes(*),
        tcomments(count),
        sections: episode_sections(*)
      `)
      .eq('id', episodeId)
      .single();

    if (episodeError) {
      console.error('Fetch episode error:', episodeError);
      return { success: false, msg: 'Could not fetch episode' };
    }

    // Sort sections by order
    if (episode.sections) {
      episode.sections.sort((a, b) => a.section_order - b.section_order);
    }

    return { success: true, data: episode };
  } catch (error) {
    return { success: false, msg: 'Could not fetch episode due to an exception' };
  }
};

// Fetch stories for user
export const fetchUserStories = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch stories error:', error);
      return { success: false, msg: 'Could not fetch stories' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch stories due to an exception' };
  }
};

// Create a new story
export const createStory = async (storyData) => {
  try {
    // Handle cover image upload if present
    if (storyData.cover_image && typeof storyData.cover_image === "object") {
      let fileResult = await uploadProfileImage("postImage", storyData.cover_image.uri, true);
      if (fileResult.success) {
        storyData.cover_image = fileResult.data;
      } else {
        return fileResult;
      }
    }

    const { data, error } = await supabase
      .from('stories')
      .insert({
        title: storyData.title,
        description: storyData.description || null,
        cover_image: storyData.cover_image || null,
        author_id: storyData.author_id,
        genre: storyData.genre || null,
        status: storyData.status || 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating story:", error);
      return { success: false, msg: "Could not create story", error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception in createStory:", error);
    return { success: false, msg: "Could not create story", error: error.message };
  }
};

