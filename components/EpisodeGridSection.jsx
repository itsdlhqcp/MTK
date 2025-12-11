import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import EpisodeCard from './EpisodeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EpisodeGridSection = ({ 
  title, 
  episodes = [], 
  onEpisodePress, 
  onSeeAllPress,
  showSeeAll = true,
  style 
}) => {
  if (!episodes || episodes.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showSeeAll && episodes.length > 4 && (
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={onSeeAllPress}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Scrollable Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
        bounces={false}
        nestedScrollEnabled={true}
        decelerationRate="fast"
        scrollEventThrottle={16}
        directionalLockEnabled={true}
      >
        {episodes.map((episode, index) => (
          <EpisodeCard
            key={episode?.id || index}
            item={episode}
            onPress={() => onEpisodePress && onEpisodePress(episode)}
            style={[
              styles.episodeCard,
              index === episodes.length - 1 && styles.lastCard
            ]}
            showDescription={false}
            showTitleOverCard={title === 'Newly Released'}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default EpisodeGridSection;

const styles = StyleSheet.create({
  container: {
    marginVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  title: {
    color: '#FFFFFF',
    fontSize: hp(2.2),
    fontWeight: 'bold',
    flex: 1,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingRight: wp(4),
    gap: wp(2.5),
  },
  episodeCard: {
    marginRight: wp(2.5),
  },
  lastCard: {
    marginRight: 0,
  },
});

