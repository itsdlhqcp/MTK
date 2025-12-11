import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import { getSupabaseFileUrl } from '../services/imageService';
import { router } from 'expo-router';
import RenderHtml from 'react-native-render-html';

const RateNowSuggestionCard = ({ suggestion }) => {
  const handleRateNow = () => {
    if (!suggestion?.releaseId) return;

    if (suggestion.type === 'digital') {
      // Navigate to stream details page with openReview param
      router.push({
        pathname: 'streamPeopleSection/streamPeopleDetails',
        params: {
          streamId: suggestion.releaseId,
          openReview: 'true'
        }
      });
    } else {
      // Navigate to release details page with openReview param
      router.push({
        pathname: 'releasePeopleSection/releasePeopleDetails',
        params: {
          releaseId: suggestion.releaseId,
          openReview: 'true'
        }
      });
    }
  };

  const titleTagsStyles = {
    body: {
      color: '#FFFFFF',
      fontSize: hp(1.8),
      fontWeight: '600',
      textAlign: 'center',
    },
    p: {
      margin: 0,
      padding: 0,
      textAlign: 'center',
    },
  };

  return (
    <View style={styles.card}>
      {/* Poster Image */}
      {(suggestion.file || suggestion.filel) && (
        <Image
          source={getSupabaseFileUrl(suggestion.filel || suggestion.file)}
          style={styles.posterImage}
          resizeMode="cover"
        />
      )}
      
      {/* Gradient Overlay */}
      <View style={styles.overlay}>
        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          {suggestion.body && (
            <View style={styles.titleContainer}>
              <RenderHtml
                contentWidth={wp(70)}
                source={{ html: suggestion.body }}
                tagsStyles={titleTagsStyles}
              />
            </View>
          )}

          {/* Type Badge */}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {suggestion.type === 'digital' ? 'DIGITAL' : 'THEATRE'}
            </Text>
          </View>

          {/* Rate Now Button */}
          <TouchableOpacity
            style={styles.rateButton}
            onPress={handleRateNow}
            activeOpacity={0.8}
          >
            <Text style={styles.rateButtonText}>Rate Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RateNowSuggestionCard;

const styles = StyleSheet.create({
  card: {
    width: wp(46),
    height: hp(28),
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: wp(1.5),
    marginBottom: hp(1),
    backgroundColor: '#1a1a1a',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    padding: wp(3),
  },
  content: {
    alignItems: 'center',
  },
  titleContainer: {
    marginBottom: hp(1),
    alignItems: 'center',
    width: '100%',
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.3),
    borderRadius: 4,
    marginBottom: hp(1),
    alignSelf: 'center',
  },
  badgeText: {
    color: '#FF0000',
    fontSize: hp(1.1),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(6),
    paddingVertical: hp(0.8),
    borderRadius: 8,
    alignSelf: 'center',
  },
  rateButtonText: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
    fontWeight: '600',
  },
});

