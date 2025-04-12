import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { wp, hp } from '@/helpers/common'
import theme from '../constants/theme'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import RenderHtml from 'react-native-render-html'
import moment from 'moment/moment'
import { LinearGradient } from 'expo-linear-gradient'

const ReleaseCard = ({
    item,
    router,
    hasShadow = true,
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

    const createdAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';

        const handleCardPress = () => {
           if (!item?.id) return null;
            router.push({ pathname: 'releaseInfo', params: { releaseId: item.id } });
    }

    const renderRating = () => {
        const rating = item?.defRating || 0;
        const filledStars = Math.floor(rating);
        
        return (
            <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, index) => {
                    const isYellow = index < filledStars;
                    return (
                        <Text 
                            key={index} 
                            style={[
                                styles.star,
                                { color: isYellow ? theme.colors.star || '#FFD700' : '#FFFFFF' }
                            ]}
                        >
                            {isYellow ? '★' : '☆'}
                        </Text>
                    );
                })}
                <Text style={styles.ratingText}>
                    {rating.toFixed(1)}/5
                </Text>
            </View>
        );
    }

    const titleTagsStyles = {
        div: {
             color: 'white',
             fontSize: hp(3.7),
             textAlign: 'left',
             fontWeight: '600'
        },
        b: {
              color: 'white',
              fontSize: hp(2.5),
              textAlign: 'left',
              fontWeight: 'bold'
        }
    }

    return (
        <TouchableOpacity
          style={[styles.container, hasShadow && shadowStyle]}
           onPress={handleCardPress}
           activeOpacity={0.9}
         >
            <View style={styles.imageContainer}>
                {item?.file?.includes('postImage') && (
                    <Image
                        source={getSupabaseFileUrl(item.file)}
                        style={styles.postMedia}
                        resizeMode="cover"
                    />
                )}
                
                {/* Radial vignette effect */}
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                    style={styles.radialVignette}
                    start={{x: 0.5, y: 0.5}}
                    end={{x: 1, y: 1}}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                    style={styles.radialVignette}
                    start={{x: 0.5, y: 0.5}}
                    end={{x: 0, y: 1}}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                    style={styles.radialVignette}
                    start={{x: 0.5, y: 0.5}}
                    end={{x: 1, y: 0}}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                    style={styles.radialVignette}
                    start={{x: 0.5, y: 0.5}}
                    end={{x: 0, y: 0}}
                />

                <View style={styles.overlay}>
                    {/* Top section with rating */}
                    <View style={styles.topContainer}>
                        {renderRating()}
                    </View>

                    {/* Bottom section with title and date */}
                    <View style={styles.bottomContainer}>
                        <View style={styles.titleDateContainer}>
                            {item?.body && (
                                <RenderHtml
                                    contentWidth={wp(90)}
                                    source={{ html: item.body }}
                                    tagsStyles={titleTagsStyles}
                                />
                            )}
                            <Text style={styles.releaseDate}>
                                {createdAt || 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.emptySpace} />
                    </View>
                </View>
                
                {/* White horizontal line at the bottom */}
                <View style={styles.whiteLine} />
            </View>
        </TouchableOpacity>
    )
}

export default ReleaseCard

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        backgroundColor: 'red',
        overflow: 'hidden',
        height: hp(30),
        position: 'relative',
        width: '100%'
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    postMedia: {
        height: '100%',
        width: '100%'
    },
    radialVignette: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.7,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'space-between',
        padding: 10
    },
    topContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        width: '100%',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        fontSize: hp(2.2),
        marginRight: 2
    },
    ratingText: {
        color: 'white',
        marginLeft: 5,
        fontSize: hp(1.7),
        fontWeight: '500'
    },
    bottomContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
        paddingBottom: 10,
    },
    titleDateContainer: {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        maxWidth: '80%',
    },
    emptySpace: {
        width: 40,
    },
    releaseDate: {
        color: theme.colors.silver || '#C0C0C0',
        fontSize: hp(2.4),
        fontWeight: '500',
        marginTop: 2
    },
    whiteLine: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        width: '97%',
        height: 0.6,
        backgroundColor: 'white',
    }
})