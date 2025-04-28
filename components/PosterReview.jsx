import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { hp } from '@/helpers/common';
import theme from '../constants/theme';
import moment from 'moment/moment';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { getSupabaseFileUrl } from '../services/userProfileImage';

// Component for generating the poster view
const PosterReview = React.forwardRef(({ item }, ref) => {
    const createdAt = item?.rDate ? moment(item.rDate).format('MMM D YYYY') : '';
    const extractYear = item?.rDate ? moment(item.rDate).format('YYYY') : '';
    
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
                    
                    {/* Our Rating */}
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingLabel}>our</Text>
                        <View style={styles.starsContainer}>
                            {Array(5).fill(0).map((_, index) => (
                                <Text key={`our-${index}`} style={styles.star}>
                                    {index < Math.floor(item?.defRating || 0) ? '★' : '☆'}
                                </Text>
                            ))}
                        </View>
                    </View>
                    
                    {/* User Rating */}
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingLabel}>user Rating</Text>
                        <View style={styles.starsContainer}>
                            {Array(5).fill(0).map((_, index) => (
                                <Text key={`user-${index}`} style={styles.star}>
                                    {index < Math.floor(item?.averageRating || 0) ? '★' : '☆'}
                                </Text>
                            ))}
                        </View>
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
    },
    starsContainer: {
        flexDirection: 'row',
    },
    star: {
        color: theme.colors.star,
        fontSize: hp(2.2),
        marginRight: 2,
    },
    reviewCount: {
        fontSize: hp(2),
        color: '#FFFFFF',
        opacity: 0.8,
        marginTop: 8,
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

export default PosterReview;