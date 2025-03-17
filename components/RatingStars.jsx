import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { hp } from '@/helpers/common';

const RatingStars = ({ rating = 0, showRatingText = true, starSize, textStyle }) => {
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

export default RatingStars;

const styles = StyleSheet.create({
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        color: '#FFD700',
        fontSize: hp(2),
        marginRight: 2
    },
    ratingText: {
        color: '#ffffff', // Changed to white for dark theme #de571a
        marginLeft: 5,
        fontSize: hp(1.8)
    }
});