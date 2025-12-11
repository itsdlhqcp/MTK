import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';

// Dynamic route handler that checks if post is an episode and routes accordingly
const PostRoute = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPostType();
  }, [id]);

  const checkPostType = async () => {
    try {
      if (!id) {
        router.replace('/home');
        return;
      }

      // Fetch post to check if it's an episode
      const { data, error } = await supabase
        .from('twists')
        .select('cover_image, episode_type')
        .eq('id', id)
        .single();

      if (error || !data) {
        // If post not found, try regular post details
        router.replace({
          pathname: '/twistDetails',
          params: { postId: id }
        });
        return;
      }

      // Check if it's an episode (has cover_image and is pdf/section_based)
      const isEpisode = data.cover_image && 
                       (data.episode_type === 'pdf' || data.episode_type === 'section_based');

      if (isEpisode) {
        // Route to episode details page
        router.replace({
          pathname: '/episodeDetails',
          params: { episodeId: id }
        });
      } else {
        // Route to regular twist details page
        router.replace({
          pathname: '/twistDetails',
          params: { postId: id }
        });
      }
    } catch (error) {
      console.error('Error checking post type:', error);
      // Fallback to twist details
      router.replace({
        pathname: '/twistDetails',
        params: { postId: id }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper bg="#121212">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </ScreenWrapper>
    );
  }

  return null;
};

export default PostRoute;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});




