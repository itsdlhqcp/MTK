import { View, Text, StyleSheet, Share, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';
import moment from 'moment/moment';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { getSupabaseFileUrl } from '../services/userProfileImage';

// Component for generating the poster view
const PosterReview = React.forwardRef(({ item, avgRating }, ref) => {
    const createdAt = item?.rDate ? moment(item.rDate).format('MMM D YYYY') : '';
    const extractYear = item?.rDate ? moment(item.rDate).format('YYYY') : '';
    
    // Function to handle sharing
    const handleShare = async () => {
        // Only share if we have a valid rating
        if (avgRating?.average) {
            try {
                const title = item?.body ? item.body.replace(/<[^>]*>?/gm, '') : "Movie";
                await Share.share({
                    message: `Check out ${title} on PlotTwist! Users rated it ${avgRating?.average}/5.0 with ${item?.peoplesReview?.length || 0} reviews.`,
                    title: `PlotTwist - ${title}`
                });
            } catch (error) {
                console.error("Error sharing:", error);
            }
        }
    };
    
    return (
        <View ref={ref} style={styles.container}>
            {/* Top section with image */}
            <View style={styles.imageContainer}>
                {item?.filel && (
                    <Image 
                        source={getSupabaseFileUrl(item.filel)} 
                        style={styles.image} 
                        resizeMode="cover"
                    />
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                />
                <View style={styles.titleOverlay}>
                    <Text style={styles.titleText}>
                        {item?.body ? item.body.replace(/<[^>]*>?/gm, '') : ""}
                    </Text>
                    <Text style={styles.infoText}>
                        {extractYear} • {item?.duration || 'N/A'} • {item?.lang || 'N/A'}
                    </Text>
                    <View style={styles.divider} />
                    
                    {/* User Rating */}
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingLabel}>Rating</Text>
                        <View style={styles.starsContainer}>
                            {Array(5).fill(0).map((_, index) => (
                                <Text key={`user-${index}`} style={styles.star}>
                                    {index < avgRating?.average ? '★' : '☆'}
                                </Text>
                            ))}
                        </View>
                        <Text style={styles.ratingValue}>
                            {avgRating?.average}/5.0
                        </Text>
                    </View>
                    
                    <Text style={styles.reviewCount}>
                        {item?.peoplesReview?.length || 0} Reviews
                    </Text>
                    
                </View>
            </View>
            
            {/* Footer branding */}
            <View style={styles.footer}>
                <Text style={styles.appName}>PlotTwist</Text>
                <Text style={styles.downloadText}>Download Now</Text>
            </View>
        </View>
    );
});

export default PosterReview;

const styles = StyleSheet.create({
    container: {
        width: 600,
        height: 800,
        backgroundColor: '#000',
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 400,
    },
    titleOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    titleText: {
        fontSize: hp(3),
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    infoText: {
        fontSize: hp(2),
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: 16,
    },
    divider: {
        height: 2,
        width: 100,
        backgroundColor: theme.colors.blue,
        marginBottom: 16,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingLabel: {
        width: 100,
        fontSize: hp(2),
        color: '#FFFFFF',
        opacity: 0.9,
        marginRight: wp(3), 
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: wp(3), 
    },
    star: {
        color: theme.colors.star,
        fontSize: hp(2.2),
        marginRight: 1,
    },
    ratingValue: {
        fontSize: hp(1.8),
        color: '#FFFFFF',
        opacity: 0.9,
    },
    reviewCount: {
        fontSize: hp(2),
        color: '#FFFFFF',
        opacity: 0.8,
        marginTop: 8,
    },
    shareButton: {
        backgroundColor: theme.colors.blue,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginTop: 16,
        alignSelf: 'flex-start',
    },
    shareButtonText: {
        color: '#FFFFFF',
        fontSize: hp(2),
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#000',
    },
    appName: {
        fontSize: hp(2.4),
        fontWeight: 'bold',
        color: theme.colors.red,
    },
    downloadText: {
        fontSize: hp(2),
        color: '#FFFFFF',
    }
});