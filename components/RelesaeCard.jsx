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
            router.push({ pathname: 'releasePeopleSection/releasePeopleDetails', params: { releaseId: item.id } });
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


// import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import RenderHtml from 'react-native-render-html'
// import moment from 'moment/moment'
// import { LinearGradient } from 'expo-linear-gradient'

// const ReleaseCard = ({
//     item,
//     router,
//     hasShadow = true,
//     showReviewButton = true,
// }) => {
//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 2
//         },
//         shadowOpacity: 0.25,
//         shadowRadius: 6,
//         elevation: 1
//     }

//     const handleReadReviews = () => {
//         if (!item?.id) return null;
//         router.push({ pathname: 'releasePeopleSection/releasePeopleDetails', params: { releaseId: item.id } });
//     }

//     const createdAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';

//     const renderRating = () => {
//         const rating = item?.defRating || 0;
//         const filledStars = Math.floor(rating);
        
//         return (
//             <View style={styles.ratingContainer}>
//                 {[...Array(5)].map((_, index) => {
//                     const isYellow = index < filledStars;
//                     return (
//                         <Text 
//                             key={index} 
//                             style={[
//                                 styles.star,
//                                 { color: isYellow ? theme.colors.star || '#FFD700' : '#FFFFFF' }
//                             ]}
//                         >
//                             {isYellow ? '★' : '☆'}
//                         </Text>
//                     );
//                 })}
//                 <Text style={styles.ratingText}>
//                     {rating.toFixed(1)}/5
//                 </Text>
//             </View>
//         );
//     }

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(2.3),
//             textAlign: 'left',
//             fontWeight: '600'
//         },
//         b: {
//             color: 'white',
//             fontWeight: 'bold'
//         }
//     }

//     const peoplesReviewCount = item?.peoplesReview?.[0]?.count || 0;

//     return (
//         <View style={[styles.container, hasShadow && shadowStyle]}>
//             <View style={styles.imageContainer}>
//                 {item?.file?.includes('postImage') && (
//                     <Image
//                         source={getSupabaseFileUrl(item.file)}
//                         style={styles.postMedia}
//                         resizeMode="cover"
//                     />
//                 )}
                
//                 {/* Radial vignette effect */}
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 1, y: 1}}
//                 />
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 0, y: 1}}
//                 />
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 1, y: 0}}
//                 />
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 0, y: 0}}
//                 />

//                 <View style={styles.overlay}>
//                     {/* Top section with rating */}
//                     <View style={styles.topContainer}>
//                         {renderRating()}
//                     </View>

//                     {/* Middle section with title */}
//                     <View style={styles.contentContainer}>
//                         <View style={styles.titleContainer}>
//                             {item?.body && (
//                                 <RenderHtml
//                                     contentWidth={wp(90)}
//                                     source={{ html: item.body }}
//                                     tagsStyles={titleTagsStyles}
//                                 />
//                             )}
//                         </View>
//                     </View>

//                     {/* Bottom section with date and review button */}
//                     <View style={styles.bottomContainer}>
//                         <Text style={styles.releaseDate}>
//                             {createdAt || 'N/A'}
//                         </Text>

//                         {showReviewButton && (
//                             <View style={styles.reviewSection}>
//                                 <TouchableOpacity 
//                                     style={styles.reviewButton}
//                                     onPress={handleReadReviews}
//                                 >
//                                     <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
//                                 </TouchableOpacity>
//                                 <View style={styles.reviewCountBadge}>
//                                     <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
//                                 </View>
//                             </View>
//                         )}
//                     </View>
//                 </View>
                
//                 {/* White horizontal line at the bottom */}
//                 <View style={styles.whiteLine} />
//             </View>
//         </View>
//     )
// }

// export default ReleaseCard

// const styles = StyleSheet.create({
//     container: {
//         marginBottom: 15,
//         backgroundColor: 'white',
//         overflow: 'hidden',
//         height: hp(26),
//         position: 'relative',
//         width: '100%'
//     },
//     imageContainer: {
//         width: '100%',
//         height: '100%',
//         position: 'relative',
//         overflow: 'hidden',
//     },
//     postMedia: {
//         height: '100%',
//         width: '100%'
//     },
//     radialVignette: {
//         ...StyleSheet.absoluteFillObject,
//         opacity: 0.7,
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.2)',
//         justifyContent: 'space-between',
//         padding: 10
//     },
//     topContainer: {
//         flexDirection: 'row',
//         justifyContent: 'flex-start',
//         alignItems: 'flex-start',
//         width: '100%',
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     star: {
//         fontSize: hp(2.2),
//         marginRight: 2
//     },
//     ratingText: {
//         color: 'white',
//         marginLeft: 5,
//         fontSize: hp(1.7),
//         fontWeight: '500'
//     },
//     contentContainer: {
//         alignItems: 'flex-start',
//         justifyContent: 'center',
//         flex: 1
//     },
//     titleContainer: {
//         maxWidth: '100%',
//         alignItems: 'flex-start',
//     },
//     bottomContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         width: '100%'
//     },
//     releaseDate: {
//         color: theme.colors.silver || '#C0C0C0',
//         fontSize: hp(2.4),
//         fontWeight: '500'
//     },
//     reviewSection: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         position: 'relative'
//     },
//     reviewButton: {
//         backgroundColor: 'black',
//         paddingHorizontal: 20,
//         paddingVertical: 8,
//         borderRadius: 8
//     },
//     reviewButtonText: {
//         color: 'white',
//         fontWeight: 'bold',
//         fontSize: hp(1.8)
//     },
//     reviewCountBadge: {
//         backgroundColor: theme.colors.primary || '#007AFF',
//         borderRadius: 12,
//         minWidth: 21,
//         height: 21,
//         justifyContent: 'center',
//         alignItems: 'center',
//         position: 'absolute',
//         right: -12,
//         top: -12,
//         paddingHorizontal: 8
//     },
//     reviewCountText: {
//         color: 'white',
//         fontSize: hp(1.6),
//         fontWeight: 'bold'
//     },
//     whiteLine: {
//         position: 'absolute',
//         bottom: 0,
//         alignSelf: 'center',
//         width: '97%',
//         height: 0.6,
//         backgroundColor: 'white',
//     }
// })


// import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import RenderHtml from 'react-native-render-html'
// import Icon from '../assets/icons';
// import moment from 'moment/moment'

// const ReleaseCard = ({
//     item,
//     router,
//     hasShadow = true,
//     showReviewButton = true,
// }) => {
//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 2
//         },
//         shadowOpacity: 0.25,
//         shadowRadius: 6,
//         elevation: 1
//     }

//     const handleReadReviews = () => {
//         if (!item?.id) return null;
//         router.push({pathname: 'releaseDetails', params: {releaseId: item.id}});
//     }

//     const handlePeopleReadReviews = () => {
//         if (!item?.id) return null;
//         router.push({pathname: 'releasePeopleSection/releasePeopleDetails', params: {releaseId: item.id}});
//     }

//     const createdAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';

//     const renderRating = () => {
//         const rating = item?.defRating || 0;
//         const stars = Array(5).fill(0).map((_, index) => (
//             <Text key={index} style={styles.star}>
//                 {index < Math.floor(rating) ? '★' : '☆'}
//             </Text>
//         ));
//         return (
//             <View style={styles.ratingContainer}>
//                 {stars}
//                 <Text style={styles.ratingText}>{rating}/5</Text>
//             </View>
//         );
//     }

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(2.3),
//             textAlign: 'center'
//         },
//         b: {
//             color: 'white',
//             fontWeight: 'bold'
//         }
//     }

//     const reviewCount = item?.reviews?.[0]?.count || 0;
//    const peoplesReviewCount =  item?.peoplesReview?.[0]?.count || 0;

//     return (
//         <View style={[styles.container, hasShadow && shadowStyle]}>
//             {item?.file?.includes('postImage') && (
//                 <Image
//                     source={getSupabaseFileUrl(item.file)}
//                     style={styles.postMedia}
//                     resizeMode="cover"
//                 />
//             )}
            
//             <View style={styles.overlay}>
//                 {renderRating()}
//                 <View style={styles.contentContainer}>
//                     <View style={styles.titleContainer}>
//                         {item?.body && (
//                             <RenderHtml
//                                 contentWidth={wp(100)}
//                                 source={{html: item.body}}
//                                 tagsStyles={titleTagsStyles}
//                             />
//                         )}
//                     </View>
//                     <Text style={styles.releaseDate}>
//                         {createdAt || 'N/A'}
//                     </Text>

//                     <View style={styles.box}>
                    
//                     {showReviewButton && (
//                         <View style={styles.reviewSection}>
//                             <TouchableOpacity 
//                                 style={styles.reviewButton}
//                                 // onPress={handleReadReviews}
//                                 onPress={handlePeopleReadReviews}
//                             >
//                                 <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
//                             </TouchableOpacity>
//                             <View style={styles.reviewCountBadge}>
//                                 {/* <Text style={styles.reviewCountText}>{reviewCount}</Text>  peoplesReviewCount */}
//                                 <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
//                             </View>
//                         </View>
//                     )}

                

//                 </View>
//                 </View>
//             </View>
//         </View>
//     )
// }

// export default ReleaseCard

// const styles = StyleSheet.create({
//     container: {
//         marginBottom: 15,
//         borderRadius: theme.radius.xxl * 1.1,
//         backgroundColor: 'white',
//         overflow: 'hidden',
//         height: hp(26),
//         position: 'relative'
//     },
//     postMedia: {
//         height: '100%',
//         width: '100%'
//     },
//     overlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         backgroundColor: 'rgba(0,0,0,0.3)',
//         padding: 15
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 'auto'
//     },
//     star: {
//         color: '#FFD700',
//         fontSize: hp(2),
//         marginRight: 2
//     },
//     ratingText: {
//         color: 'white',
//         marginLeft: 5,
//         fontSize: hp(1.8)
//     },
//     contentContainer: {
//         alignItems: 'center'
//     },
//     titleContainer: {
//         maxWidth: '100%',
//         alignItems: 'center',
//         marginBottom: 5
//     },
//     releaseDate: {
//         color: 'red',
//         fontSize: hp(2),
//         marginBottom: 10,
//         fontWeight: '400'
//     },
//     reviewSection: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         position: 'relative'
//     },
//     reviewButton: {
//         backgroundColor: 'black',
//         paddingHorizontal: 20,
//         paddingVertical: 8,
//         borderRadius: 8
//     },
//     reviewButtonText: {
//         color: 'white',
//         fontWeight: 'bold',
//         fontSize: hp(1.8)
//     },
//     reviewCountBadge: {
//         backgroundColor: theme.colors.primary || '#007AFF',
//         borderRadius: 12,
//         minWidth: 21,
//         height: 21,
//         justifyContent: 'center',
//         alignItems: 'center',
//         position: 'absolute',
//         right: -12,
//         top: -12,
//         paddingHorizontal: 8
//     },
//     reviewCountText: {
//         color: 'white',
//         fontSize: hp(1.6),
//         fontWeight: 'bold'
//     },
//     reviewCountBadge2: {
       
//         borderRadius: 12,
//         minWidth: 21,
//         height: 21,
//         justifyContent: 'center',
//         alignItems: 'center',
//         position: 'absolute',
//         right: -12,
//         top: -12,
//         paddingHorizontal: 8
//     },
//     box: {
//        flexDirection: 'row',
//        gap: 24
//     }
// })








// {showReviewButton && (
//     <View style={styles.reviewSection}>
//         <TouchableOpacity 
//             // style={styles.reviewButton}
//             onPress={handlePeopleReadReviews}
//         >
//             {/* <Text style={styles.reviewButtonText}>PEOPLES REVIEWS</Text> */}
//             <Icon name="comment01" size={hp(2)} color={theme.colors.primaryDark} />
//         </TouchableOpacity>
//         <View style={styles.reviewCountBadge2}>
//             <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
//         </View>
//     </View>
// )}