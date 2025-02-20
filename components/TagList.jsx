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

    if (!tags) return null;

    return (
        <View style={styles.tagsContainer}>
            {Array.isArray(parsedTags) && parsedTags.map((tag, index) => (
                <View key={index} style={styles.tagWrapper}>
                    {tag.toLowerCase() === "netflix" ? (
                        <Icon name="netflix" size={hp(7)}  color={theme.colors.primaryDark} />
                    ) : tag.toLowerCase() === "prime" ? (
                        <Icon name="prime" size={hp(6)} color={theme.colors.primaryDark} />
                    ) : tag.toLowerCase() === "disney" ? (
                        <Icon name="disney" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "hbo" ? (
                        <Icon name="hbo" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "hulu" ? (
                        <Icon name="hulu" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "amc" ? (
                        <Icon name="amc" size={hp(7.2)} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "zee5" ? (
                        <Icon name="zee5" size={hp(6.4)} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "sonyliv" ? (
                        <Icon name="sonyliv" size={hp(6)} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "paramountplus" ? (
                        <Icon name="paramountplus" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "appletvplus" ? (
                        <Icon name="appletvplus" size={hp(7)} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "hotstar" ? (
                        <Icon name="hotstar" size={hp(6)} style={{marginVertical: hp(0.5)}} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "voot" ? (
                        <Icon name="voot" size={hp(5.8)} style={{marginVertical: hp(0.5)}} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "aha" ? (
                        <Icon name="aha" size={hp(6)} style={{marginVertical: hp(0.5)}} color={theme.colors.primaryDark} />
                    ): tag.toLowerCase() === "sunnxt" ? (
                        <Icon name="sunnxt" size={hp(6)} style={{marginVertical: hp(0.5)}} color={theme.colors.primaryDark} />
                    ) : tag.toLowerCase() === "appletv" ? (
                        <Image 
                        source={{ uri: 'https://img.icons8.com/3d-fluency/94/apple-tv.png' }}
                        style={styles.appleTvImage}
                        resizeMode="contain"
                    />
                    ): tag.toLowerCase() === "paramountx" ? (
                        <Image 
                       // source={{ uri: 'https://img.icons8.com/clouds/100/paramount-plus.png' }}
                        source={{ uri: 'https://img.icons8.com/doodle/48/paramount-plus.png' }}
                        style={styles.paraImage}
                        resizeMode="contain"
                    />
                    ): tag.toLowerCase() === "peacocktv" ? (
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
            ))}
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