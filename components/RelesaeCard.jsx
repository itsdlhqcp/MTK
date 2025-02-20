import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { wp, hp } from '@/helpers/common'
import theme from '../constants/theme'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import RenderHtml from 'react-native-render-html'
import Icon from '../assets/icons';
import moment from 'moment/moment'

const ReleaseCard = ({
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
        router.push({pathname: 'releasePeopleDetails', params: {releaseId: item.id}});
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

    const reviewCount = item?.reviews?.[0]?.count || 0;
   const peoplesReviewCount =  item?.peoplesReview?.[0]?.count || 0;

    return (
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
                        Release Date: {createdAt || 'N/A'}
                    </Text>

                    <View style={styles.box}>
                    
                    {showReviewButton && (
                        <View style={styles.reviewSection}>
                            <TouchableOpacity 
                                style={styles.reviewButton}
                                onPress={handleReadReviews}
                            >
                                <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
                            </TouchableOpacity>
                            <View style={styles.reviewCountBadge}>
                                <Text style={styles.reviewCountText}>{reviewCount}</Text>
                            </View>
                        </View>
                    )}

                  {showReviewButton && (
                        <View style={styles.reviewSection}>
                            <TouchableOpacity 
                                // style={styles.reviewButton}
                                onPress={handlePeopleReadReviews}
                            >
                                {/* <Text style={styles.reviewButtonText}>PEOPLES REVIEWS</Text> */}
                                <Icon name="comment01" size={hp(2)} color={theme.colors.primaryDark} />
                            </TouchableOpacity>
                            <View style={styles.reviewCountBadge2}>
                                <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
                            </View>
                        </View>
                    )}

                </View>
                </View>
            </View>
        </View>
    )
}

export default ReleaseCard

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        borderRadius: theme.radius.xxl * 1.1,
        backgroundColor: 'white',
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
        backgroundColor: 'rgba(0,0,0,0.3)',
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
        color: 'white',
        fontSize: hp(1.8),
        marginBottom: 10
    },
    reviewSection: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative'
    },
    reviewButton: {
        backgroundColor: 'black',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8
    },
    reviewButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: hp(1.8)
    },
    reviewCountBadge: {
        backgroundColor: theme.colors.primary || '#007AFF',
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
        fontSize: hp(1.6),
        fontWeight: 'bold'
    },
    reviewCountBadge2: {
       
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
    box: {
       flexDirection: 'row',
       gap: 24
    }
})