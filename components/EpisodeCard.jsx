import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import { getSupabaseFileUrl } from '../services/imageService';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EpisodeCard = ({ item, onPress, style, showDescription = false, showTitleOverCard = false }) => {
  const coverImageUrl = item?.cover_image 
    ? getSupabaseFileUrl(item.cover_image)?.uri 
    : null;

  const episodeTitle = item?.episode_title || item?.body?.substring(0, 30) || 'Untitled Episode';
  const description = item?.description || '';
  // For section-based episodes, show "Chapter's", otherwise show "Episode's"
  const isSectionBased = item?.episode_type === 'section_based';
  const episodeLabel = isSectionBased ? "Chapter's" : "Episode's";
  const episodeNumber = item?.episode_number ? `${item.episode_number} ${episodeLabel}` : '';

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {coverImageUrl ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Cover</Text>
          </View>
        )}
        
        {/* Gradient overlay at bottom */}
        {coverImageUrl && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradientOverlay}
          />
        )}
        
        {/* Episode number badge */}
        {episodeNumber && (
          <View style={styles.episodeBadge}>
            <Text style={styles.episodeBadgeText}>{episodeNumber}</Text>
          </View>
        )}
        
        {/* Title overlay at bottom of card */}
        {showTitleOverCard && (
          <View style={styles.titleOverlay}>
            <Text style={styles.titleOverlayText} numberOfLines={2}>
              {episodeTitle}
            </Text>
          </View>
        )}
      </View>

      {/* Title and description - Only show if title is not over card */}
      {!showTitleOverCard && (
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {episodeTitle}
          </Text>
          {showDescription && description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default EpisodeCard;

const styles = StyleSheet.create({
  container: {
    width: wp(30), // ~30% of screen width for 3 items per row (can be overridden by style prop)
    marginBottom: hp(2),
  },
  imageContainer: {
    width: '100%',
    height: hp(20),
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2D2D2D',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: hp(1.4),
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  episodeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  episodeBadgeText: {
    color: '#FFFFFF',
    fontSize: hp(1.2),
    fontWeight: '600',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(1),
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
  },
  titleOverlayText: {
    color: '#FFFFFF',
    fontSize: hp(1.5),
    fontWeight: '600',
    textAlign: 'center',
  },
  textContainer: {
    marginTop: hp(1),
    paddingHorizontal: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: '#AAAAAA',
    fontSize: hp(1.3),
    lineHeight: hp(1.8),
  },
});

