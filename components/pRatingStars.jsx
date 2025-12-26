import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';

const PratingStars = ({ rating = 0, showRatingText = true, starSize, textStyle, isLoading = false }) => {
    const animatedValues = useRef(
        Array(5).fill(0).map(() => new Animated.Value(0.3))
    ).current;

    useEffect(() => {
        if (isLoading) {
            // Create staggered animation for each star
            const animations = animatedValues.map((animValue, index) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(index * 100),
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animValue, {
                            toValue: 0.3,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                    ])
                );
            });
            
            Animated.parallel(animations).start();
        } else {
            // Reset animations when loading is complete
            animatedValues.forEach(animValue => {
                animValue.setValue(1);
            });
        }
    }, [isLoading]);

    if (isLoading || rating === undefined || rating === null) {
        const skeletonStars = Array(5).fill(0).map((_, index) => {
            const opacity = animatedValues[index].interpolate({
                inputRange: [0.3, 1],
                outputRange: [0.3, 0.8],
            });

            return (
                <Animated.Text 
                    key={index} 
                    style={[
                        styles.star, 
                        starSize && { fontSize: starSize },
                        { opacity }
                    ]}
                >
                    ☆
                </Animated.Text>
            );
        });

        return (
            <View style={styles.ratingContainer}>
                {skeletonStars}
                {showRatingText && (
                    <View style={[styles.skeletonText, starSize && { height: starSize * 0.6 }]} />
                )}
            </View>
        );
    }

    const stars = Array(5).fill(0).map((_, index) => (
        <Text key={index} style={[styles.star, starSize && { fontSize: starSize }]}>
            {index < Math.floor(rating) ? '★' : '☆'}
        </Text>
    ));

    return (
        <View style={styles.ratingContainer}>
            {stars}
            {showRatingText && (
                <Text style={[styles.ratingText, textStyle]}>
                    {rating}/5
                </Text>
            )}
        </View>
    );
};

export default PratingStars;

const styles = StyleSheet.create({
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        color: theme.colors.star,  // #00C26F #de571a'
        fontSize: hp(2),
        marginRight: 2
    },
    ratingText: {
        color: 'white', // Changed to white for dark theme #de571a
        marginLeft: 5,
        fontSize: hp(1.5)
    },
    skeletonText: {
        width: wp(8),
        height: hp(1.5),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        marginLeft: 5,
    }
});