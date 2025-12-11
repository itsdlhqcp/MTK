import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import EpisodeCard from './EpisodeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARDS_PER_ROW = 3;
// Calculate card width: screen width - horizontal padding (wp(8) = 4% left + 4% right) - gaps between cards
const CARD_WIDTH = (SCREEN_WIDTH - wp(8) - (wp(2) * (CARDS_PER_ROW - 1))) / CARDS_PER_ROW;

const EpisodeGrid = ({ 
  title, 
  episodes = [], 
  onEpisodePress, 
  style,
  maxItems = 6 // Default to 6 items (2 rows of 3)
}) => {
  if (!episodes || episodes.length === 0) {
    return null;
  }

  // Limit to maxItems
  const displayEpisodes = episodes.slice(0, maxItems);
  
  // Group episodes into rows
  const rows = [];
  for (let i = 0; i < displayEpisodes.length; i += CARDS_PER_ROW) {
    rows.push(displayEpisodes.slice(i, i + CARDS_PER_ROW));
  }

  // Use reduced top margin for "Top Picks for You" section
  const containerStyle = title === 'Top Picks for You' 
    ? [styles.containerReducedTop, style]
    : [styles.container, style];

  return (
    <View style={containerStyle}>
      {/* Section Header */}
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}

      {/* Grid Rows */}
      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((episode, colIndex) => (
              <EpisodeCard
                key={episode?.id || `${rowIndex}-${colIndex}`}
                item={episode}
                onPress={() => onEpisodePress && onEpisodePress(episode)}
                style={[
                  styles.gridCard,
                  colIndex < row.length - 1 && styles.cardWithMargin
                ]}
                showDescription={true}
              />
            ))}
            {/* Fill empty spaces if row is incomplete */}
            {row.length < CARDS_PER_ROW && Array.from({ length: CARDS_PER_ROW - row.length }).map((_, index) => (
              <View key={`empty-${index}`} style={[styles.gridCard, styles.emptyCard]} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default EpisodeGrid;

const styles = StyleSheet.create({
  container: {
    marginVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  containerReducedTop: {
    marginTop: -hp(2.5),
    marginBottom: hp(2),
    paddingHorizontal: wp(4),
  },
  title: {
    color: '#FFFFFF',
    fontSize: hp(2.2),
    fontWeight: 'bold',
    marginBottom: hp(1.5),
  },
  gridContainer: {
    gap: hp(1.5),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: wp(2),
  },
  gridCard: {
    width: CARD_WIDTH,
  },
  cardWithMargin: {
    marginRight: 0,
  },
  emptyCard: {
    opacity: 0,
  },
});

