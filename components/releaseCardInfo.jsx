import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native'
import React from 'react'
import { wp, hp } from '@/helpers/common'
import theme from '../constants/theme'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import RenderHtml from 'react-native-render-html'
import Icon from '../assets/icons';
import moment from 'moment/moment'

const ReleaseCardInfo = ({
    item,
    router,
    hasShadow = true,
    showReviewButton = true,
}) => {
    const shadowStyle = {
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 1
    }

    const handleReadReviews = () => {
        if (!item?.id) return null;
        router.push({pathname: 'releaseDetails', params: {releaseId: item.id}});
    }

    const handlePeopleReadReviews = () => {
        if (!item?.id) return null;
        router.push({pathname: 'releasePeopleSection/releasePeopleDetails', params: {releaseId: item.id}});
    }

    const createdAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';

    const renderRating = () => {
        const rating = item?.defRating || 0;
        const stars = Array(5).fill(0).map((_, index) => (
            <Text key={index} style={styles.star}>
                {index < Math.floor(rating) ? '★' : '☆'}
            </Text>
        ));
        return (
            <View style={styles.ratingContainer}>
                {stars}
                <Text style={styles.ratingText}>{rating}/5</Text>
            </View>
        );
    }

    const titleTagsStyles = {
        div: {
            color: 'white',
            fontSize: hp(2.3),
            textAlign: 'center'
        },
        b: {
            color: 'white',
            fontWeight: 'bold'
        }
    }

    const peoplesReviewCount = item?.peoplesReview?.length || 0;

    // Film details to display
    const filmDetails = [
        { label: 'Language', value: item?.lang || 'N/A' },
        { label: 'Genre', value: item?.genre || 'N/A' },
        { label: 'Duration', value: item?.duration || 'N/A' },
        { label: 'Director', value: item?.director || 'N/A' },
        { label: 'Writer', value: item?.writer || 'N/A' },
        { label: 'Music', value: item?.music || 'N/A' },
        { label: 'DOP', value: item?.dop || 'N/A' },
        { label: 'Editor', value: item?.edit || 'N/A' },
        { label: 'Cast', value: item?.cast || 'N/A' },
    ];

    return (
        <View style={styles.mainContainer}>
            {/* Original Card - Keeping the original design intact */}
            <View style={[styles.container, hasShadow && shadowStyle]}>
                {item?.file?.includes('postImage') && (
                    <Image
                        source={getSupabaseFileUrl(item.file)}
                        style={styles.postMedia}
                        resizeMode="cover"
                    />
                )}
                
                <View style={styles.overlay}>
                    {renderRating()}
                    <View style={styles.contentContainer}>
                        <View style={styles.titleContainer}>
                            {item?.body && (
                                <RenderHtml
                                    contentWidth={wp(100)}
                                    source={{html: item.body}}
                                    tagsStyles={titleTagsStyles}
                                />
                            )}
                        </View>
                        <Text style={styles.releaseDate}>
                            {createdAt || 'N/A'}
                        </Text>

                        <View style={styles.box}>
                            {showReviewButton && (
                                <View style={styles.reviewSection}>
                                    <TouchableOpacity 
                                        style={styles.reviewButton}
                                        onPress={handlePeopleReadReviews}
                                    >
                                        <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
                                    </TouchableOpacity>
                                    <View style={styles.reviewCountBadge}>
                                        <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
                                    </View>
                                </View>
                            )}

                            {showReviewButton && (
                                <View style={styles.reviewSection}>
                                    <TouchableOpacity 
                                        onPress={handleReadReviews}
                                    >
                                        <Icon name="plus" size={hp(3.5)} color={theme.colors.assent} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* New Film Details Section below the original card */}
            <View style={[styles.detailsContainer, hasShadow && shadowStyle]}>
                <Text style={styles.detailsTitle}>Film Details</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.detailsScrollView}>
                    {filmDetails.map((detail, index) => (
                        <View key={index} style={styles.detailCard}>
                            <Text style={styles.detailLabel}>{detail.label}</Text>
                            <Text style={styles.detailValue}>{detail.value}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    )
}

export default ReleaseCardInfo

const styles = StyleSheet.create({
    mainContainer: {
        marginBottom: 20,
    },
    container: {
        marginBottom: 10,
        borderRadius: theme.radius.xxl * 1.1,
        backgroundColor: '#121212', // Dark background (Instagram-like)
        overflow: 'hidden',
        height: hp(26),
        position: 'relative'
    },
    postMedia: {
        height: '100%',
        width: '100%'
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', // Slightly darker overlay
        padding: 15
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 'auto'
    },
    star: {
        color: '#FFD700',
        fontSize: hp(2),
        marginRight: 2
    },
    ratingText: {
        color: 'white',
        marginLeft: 5,
        fontSize: hp(1.8)
    },
    contentContainer: {
        alignItems: 'center'
    },
    titleContainer: {
        maxWidth: '100%',
        alignItems: 'center',
        marginBottom: 5
    },
    releaseDate: {
        color: theme.colors.assent || '#FF3B30', // Using primary color for date
        fontSize: hp(2),
        marginBottom: 10,
        fontWeight: '400'
    },
    reviewSection: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative'
    },
    reviewButton: {
        backgroundColor: '#262626', // Dark button (Instagram-like)
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8
    },
    reviewButtonText: {
        color: theme.colors.assent || '#FF3B30', // Using primary color for text
        fontWeight: 'bold',
        fontSize: hp(1.8)
    },
    reviewCountBadge: {
        backgroundColor: theme.colors.bmw || '#0095F6', // Using secondary primary dark color
        borderRadius: 12,
        minWidth: 21,
        height: 21,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: -12,
        top: -12,
        paddingHorizontal: 8
    },
    reviewCountText: {
        color: 'white',
        fontSize: hp(1.3),
        fontWeight: 'bold'
    },
    box: {
        flexDirection: 'row',
        gap: 24
    },
    
    // Styles for the new film details section - Dark theme
    detailsContainer: {
        backgroundColor: '#121212', // Dark background (Instagram-like)
        borderRadius: theme.radius.md,
        padding: 12,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#262626' // Dark border (Instagram-like)
    },
    detailsTitle: {
        fontSize: hp(2),
        fontWeight: 'bold',
        color: theme.colors.assent || '#FF3B30', // Using primary color for title
        marginBottom: 8,
        marginLeft: 5
    },
    detailsScrollView: {
        flexGrow: 0
    },
    detailCard: {
        backgroundColor: '#262626', // Dark card background (Instagram-like)
        borderRadius: theme.radius.md,
        padding: 10,
        marginRight: 10,
        minWidth: wp(28),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#363636' // Slightly lighter border
    },
    detailLabel: {
        color: theme.colors.assent || '#FF3B30', // Using primary color for label
        fontSize: hp(1.6),
        fontWeight: 'bold',
        marginBottom: 4
    },
    detailValue: {
        color: '#FFFFFF', // White text on dark background
        fontSize: hp(1.5),
        textAlign: 'center'
    }
})