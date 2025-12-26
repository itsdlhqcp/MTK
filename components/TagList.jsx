import { View, Text, StyleSheet,Image } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../assets/icons';
import { hp } from '@/helpers/common';
import theme from '../constants/theme';


// Predefined gradient pairs for tags
const gradientPairs = [
    ['#FF416C', '#FF4B2B'], // Red-Orange
    ['#4776E6', '#8E54E9'], // Blue-Purple
    ['#2193b0', '#6dd5ed'], // Blue-Cyan
    ['#11998e', '#38ef7d'], // Green
    ['#8E2DE2', '#4A00E0'], // Purple
    ['#f857a6', '#ff5858'], // Pink-Red
    ['#FFD93D', '#FF8400'], // Yellow-Orange
    ['#614385', '#516395'], // Purple-Blue
];

const getGradientForTag = (tag, index) => {
    // Use modulo to cycle through gradients if we have more tags than gradients
    const gradientIndex = index % gradientPairs.length;
    return gradientPairs[gradientIndex];
};

const TagsList = ({ tags }) => {
    let parsedTags = tags;
    if (typeof tags === 'string') {
        try {
            parsedTags = JSON.parse(tags);
        } catch (e) {
            parsedTags = [];
        }
    }

    if (!parsedTags || (Array.isArray(parsedTags) && parsedTags.length === 0)) return null;

    // Hide the generic "series" tag from UI while keeping other tags
    // Also filter out non-string tags and ensure all tags are valid strings
    if (Array.isArray(parsedTags)) {
        parsedTags = parsedTags
            .filter((tag) => {
                // Only keep string tags, skip arrays, objects, null, undefined
                if (typeof tag !== 'string') return false;
                // Skip empty strings and the "series" tag
                return tag.trim() !== '' && tag.toLowerCase() !== 'series';
            })
            .map((tag) => {
                // Ensure tag is a clean string (trim whitespace)
                return typeof tag === 'string' ? tag.trim() : String(tag).trim();
            });
    }

    if (!parsedTags || (Array.isArray(parsedTags) && parsedTags.length === 0)) return null;

    return (
        <View style={styles.tagsContainer}>
            {Array.isArray(parsedTags) && parsedTags.map((tag, index) => {
                // Double-check that tag is a string before rendering
                if (typeof tag !== 'string' || !tag.trim()) {
                    return null;
                }
                
                const tagLower = tag.toLowerCase().trim();
                
                return (
                <View key={index} style={styles.tagWrapper}>
                    {tagLower === "netflix" ? (
                        <Icon name="netflix" size={hp(7)}  color={theme.colors.primaryDark} />
                    ) : tagLower === "prime" ? (
                        <Icon name="prime" size={hp(6)} color={theme.colors.primaryDark} />
                    ) : tagLower === "disney" ? (
                        <Icon name="disney" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tagLower === "hbo" ? (
                        <Icon name="hbo" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tagLower === "hulu" ? (
                        <Icon name="hulu" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tagLower === "amc" ? (
                        <Icon name="amc" size={hp(7.2)} color={theme.colors.primaryDark} />
                    ): tagLower === "zee5" ? (
                        <Icon name="zee5" size={hp(6.4)} color={theme.colors.primaryDark} />
                    ): tagLower === "sonyliv" ? (
                        <Icon name="sonyliv" size={hp(6)} color={theme.colors.primaryDark} />
                    ): tagLower === "paramountplus" ? (
                        <Icon name="paramountplus" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tagLower === "appletvplus" ? (
                        <Icon name="appletvplus" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tagLower === "hotstar" ? (
                        <Icon name="hotstar" size={hp(6)} style={{marginVertical: hp(0.5)}} color={theme.colors.primaryDark} />
                    ): tagLower === "voot" ? (
                        <Icon name="voot" size={hp(5.8)} style={{marginVertical: hp(0.5)}} color={theme.colors.primaryDark} />
                    ): tagLower === "aha" ? (
                        <Icon name="aha" size={hp(6)} style={{marginVertical: hp(0.5)}} color={theme.colors.primaryDark} />
                    ): tagLower === "sunnxt" ? (
                        <Icon name="sunnxt" size={hp(6)} style={{marginVertical: hp(0.5)}} color={theme.colors.primaryDark} />
                    ) : tagLower === "appletv" ? (
                        <Image 
                        source={{ uri: 'https://img.icons8.com/3d-fluency/94/apple-tv.png' }}
                        style={styles.appleTvImage}
                        resizeMode="contain"
                    />
                    ): tagLower === "paramountx" ? (
                        <Image 
                       // source={{ uri: 'https://img.icons8.com/clouds/100/paramount-plus.png' }}
                        source={{ uri: 'https://img.icons8.com/doodle/48/paramount-plus.png' }}
                        style={styles.paraImage}
                        resizeMode="contain"
                    />
                    ): tagLower === "peacocktv" ? (
                        <Image 
                        source={{ uri: 'https://img.icons8.com/doodle/48/peacock-tv.png' }}
                       // source={{ uri: 'https://img.icons8.com/doodle/48/paramount-plus.png' }}
                        style={styles.appleTvImage}
                        resizeMode="contain"
                    />
                    )  : (
                        <LinearGradient
                            colors={getGradientForTag(tag, index)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.tagPill}
                        >
                            <Text style={[styles.tagPillText, { color: 'white' }]}>
                                {tag}
                            </Text>
                        </LinearGradient>
                    )}
                </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    tagsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        // Remove borderWidth as we're using gradient background
    },
    tagPillText: {
        fontSize: hp(1.4),
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    appleTvImage: {
        width: hp(7), // Matching the size with other icons
        height: hp(7),
    },
    tagWrapper: {
        marginHorizontal: 5, 
    },
    paraImage: {
        width: hp(8), // Matching the size with other icons
        height: hp(8),
    }
});

export default TagsList;  