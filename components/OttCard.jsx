import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { wp, hp } from '@/helpers/common'
import theme from '../constants/theme'
import moment from 'moment/moment'
import RenderHtml from 'react-native-render-html'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import TagsList from './TagList'

const OttCard = ({
    item,
    router,
    hasShadow = true,
}) => {
    const [userRating, setUserRating] = useState(0);
    const [clickCount, setClickCount] = useState(0);

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
        router.push({ pathname: 'postDetails', params: { postId: item.id } });
    }

    const handleCardPress = () => {
        const newClickCount = clickCount + 0.5;
        setClickCount(newClickCount);
        const newRating = newClickCount % 5 === 0 ? 5 : newClickCount % 5;
        setUserRating(newRating);
    }

    const rDate = item?.rDate ? moment(item.rDate).format('MMM DD') : '';

    const renderRating = () => {
        const rating = userRating || item?.defRating || 0;
        const filledStars = Math.floor(rating);
        
        return (
            <TouchableOpacity style={styles.ratingContainer} onPress={handleCardPress}>
                {[...Array(5)].map((_, index) => {
                    const isYellow = index < filledStars;
                    return (
                        <Text 
                            key={index} 
                            style={[
                                styles.star,
                                { color: isYellow ? '#FFD700' : '#FFFFFF' }
                            ]}
                        >
                            {isYellow ? '★' : '☆'}
                        </Text>
                    );
                })}
                <Text style={[styles.ratingValue, { color: '#FF0000' }]}>
                    {rating.toFixed(1)}/5
                </Text>
            </TouchableOpacity>
        );
    }

    const titleTagsStyles = {
        div: {
            color: 'white',
            fontSize: hp(2.5),
            textAlign: 'center',
            fontWeight: 'bold'
        },
        p: {
            color: 'white',
            fontSize: hp(2.5),
            textAlign: 'center',
            fontWeight: 'bold'
        }
    }

    return (
        <View style={[styles.container, hasShadow && shadowStyle]}>
            <TouchableOpacity 
                style={styles.imageContainer}
                onPress={handleCardPress}
            >
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
                        {item?.body && (
                            <RenderHtml
                                contentWidth={wp(100)}
                                source={{ html: item.body }}
                                tagsStyles={titleTagsStyles}
                            />
                        )}

                        <Text style={styles.releaseDate}>
                            {rDate}
                        </Text>

                        <TagsList tags={item?.tags} />
                    </View>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.reviewButton}
                onPress={handleReadReviews}
            >
                <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: theme.radius.lg,
        borderBottomRightRadius: theme.radius.lg,
        backgroundColor: 'black',
        overflow: 'hidden',
        height: hp(30),
        padding: 6
    },
    imageContainer: {
        width: '100%',
        height: '90%',
        position: 'relative',
    },
    postMedia: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'space-between',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    star: {
        fontSize: hp(2.2),
        marginRight: 2,
    },
    ratingValue: {
        marginLeft: 5,
        fontSize: hp(1.8),
        fontWeight: '600',
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    releaseDate: {
        color: 'white',
        fontSize: hp(1.8),
        marginTop: hp(0.5),
    },
    reviewButton: {
        backgroundColor: 'black',
        height: '10%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: hp(1.8),
    },
});

export default OttCard