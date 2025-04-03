import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { wp, hp } from '@/helpers/common'
import theme from '../constants/theme'
import moment from 'moment/moment'
import RenderHtml from 'react-native-render-html'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import TagsList from './TagList'
import { LinearGradient } from 'expo-linear-gradient'

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

    const handleCardPress = () => {
        // Navigate to reviews on card press
        if (!item?.id) return null;
        router.push({ pathname: 'streamPeopleSection/streamPeopleDetails', params: { streamId: item.id } });
        
        // Also update rating as before
        // const newClickCount = clickCount + 0.5;
        // setClickCount(newClickCount);
        // const newRating = newClickCount % 5 === 0 ? 5 : newClickCount % 5;
        // setUserRating(newRating);
    }

    const rDate = item?.rDate ? moment(item.rDate).format('MMM DD') : '';

    const renderRating = () => {
        const rating = userRating || item?.defRating || 0;
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
                                { color: isYellow ? theme.colors.star : '#FFFFFF' }
                            ]}
                        >
                            {isYellow ? '★' : '☆'}
                        </Text>
                    );
                })}
                <Text style={[styles.ratingValue, { color: theme.colors.primaryDark }]}>
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
        p: {
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
                    {/* Top section with rating and tags */}
                    <View style={styles.topContainer}>
                        {renderRating()}
                        <View style={styles.tagsContainer}>
                            <TagsList tags={item?.tags} />
                        </View>
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
                                {rDate}
                            </Text>
                        </View>
                        <View style={styles.emptySpace} />
                    </View>
                </View>
                
                {/* White horizontal line at the bottom of the image */}
                <View style={styles.whiteLine} />
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        backgroundColor: 'red',
        height: hp(30),
        width: '100%',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    postMedia: {
        width: '100%',
        height: '100%',
    },
    radialVignette: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.7,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)', // Reduced opacity since we have vignette now
        justifyContent: 'space-between',
    },
    topContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
    },
    bottomContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
        paddingBottom: 10,
    },
    titleDateContainer: {
        paddingLeft: 10,
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        maxWidth: '80%',
    },
    emptySpace: {
        width: 40,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    tagsContainer: {
        alignSelf: 'flex-start',
        padding: 8,
    },
    star: {
        fontSize: hp(2.2),
        marginRight: 2,
    },
    ratingValue: {
        marginLeft: 5,
        fontSize: hp(1.7),
        fontWeight: '500',
    },
    releaseDate: {
        color: theme.colors.silver,
        fontSize: hp(2.4),
        marginTop: 2,
        textAlign: 'left',
        fontWeight: '500'
    },
    // New style for white horizontal line
    whiteLine: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        width: '97%',
        height: 0.6, // Line thickness
        backgroundColor: 'white',
    },
});

export default OttCard

// import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React, { useState } from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import moment from 'moment/moment'
// import RenderHtml from 'react-native-render-html'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TagsList from './TagList'
// import { LinearGradient } from 'expo-linear-gradient'

// const OttCard = ({
//     item,
//     router,
//     hasShadow = true,
// }) => {
//     const [userRating, setUserRating] = useState(0);
//     const [clickCount, setClickCount] = useState(0);

//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 2
//         },
//         shadowOpacity: 0.25,
//         shadowRadius: 6,
//         elevation: 1
//     }

//     const handleCardPress = () => {
//         // Navigate to reviews on card press
//         if (!item?.id) return null;
//         router.push({ pathname: 'streamPeopleSection/streamPeopleDetails', params: { streamId: item.id } });
        
//         // Also update rating as before
//         // const newClickCount = clickCount + 0.5;
//         // setClickCount(newClickCount);
//         // const newRating = newClickCount % 5 === 0 ? 5 : newClickCount % 5;
//         // setUserRating(newRating);
//     }

//     const rDate = item?.rDate ? moment(item.rDate).format('MMM DD') : '';

//     const renderRating = () => {
//         const rating = userRating || item?.defRating || 0;
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
//                                 { color: isYellow ? '#de571a' : '#FFFFFF' }
//                             ]}
//                         >
//                             {isYellow ? '★' : '☆'}
//                         </Text>
//                     );
//                 })}
//                 <Text style={[styles.ratingValue, { color: '#00ac62' }]}>
//                     {rating.toFixed(1)}/5
//                 </Text>
//             </View>
//         );
//     }

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(3.2),
//             textAlign: 'left',
//             fontWeight: '500'
//         },
//         p: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'left',
//             fontWeight: 'bold'
//         }
//     }

//     return (
//         <TouchableOpacity 
//             style={[styles.container, hasShadow && shadowStyle]}
//             onPress={handleCardPress}
//             activeOpacity={0.9}
//         >
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
//                     {/* Top section with rating and tags */}
//                     <View style={styles.topContainer}>
//                         {renderRating()}
//                         <View style={styles.tagsContainer}>
//                             <TagsList tags={item?.tags} />
//                         </View>
//                     </View>

//                     {/* Bottom section with title and date */}
//                     <View style={styles.bottomContainer}>
//                         <View style={styles.titleDateContainer}>
//                             {item?.body && (
//                                 <RenderHtml
//                                     contentWidth={wp(90)}
//                                     source={{ html: item.body }}
//                                     tagsStyles={titleTagsStyles}
//                                 />
//                             )}
//                             <Text style={styles.releaseDate}>
//                                 {rDate}
//                             </Text>
//                         </View>
//                         <View style={styles.emptySpace} />
//                     </View>
//                 </View>
//             </View>
//         </TouchableOpacity>
//     )
// }

// const styles = StyleSheet.create({
//     container: {
//         marginBottom: 8,
//         backgroundColor: 'red',
//         height: hp(30),
//         width: '100%',
//     },
//     imageContainer: {
//         width: '100%',
//         height: '100%',
//         position: 'relative',
//         overflow: 'hidden',
//     },
//     postMedia: {
//         width: '100%',
//         height: '100%',
//     },
//     radialVignette: {
//         ...StyleSheet.absoluteFillObject,
//         opacity: 0.7,
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.2)', // Reduced opacity since we have vignette now
//         justifyContent: 'space-between',
//     },
//     topContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//         width: '100%',
//     },
//     bottomContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-end',
//         width: '100%',
//         paddingBottom: 10,
//     },
//     titleDateContainer: {
//         paddingLeft: 10,
//         alignItems: 'flex-start',
//         justifyContent: 'flex-end',
//         maxWidth: '80%',
//     },
//     emptySpace: {
//         width: 40,
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 8,
//     },
//     tagsContainer: {
//         alignSelf: 'flex-start',
//         padding: 8,
//     },
//     star: {
//         fontSize: hp(2.2),
//         marginRight: 2,
//     },
//     ratingValue: {
//         marginLeft: 5,
//         fontSize: hp(1.7),
//         fontWeight: '500',
//     },
//     releaseDate: {
//         color: 'white',
//         fontSize: hp(2.4),
//         marginTop: 2,
//         textAlign: 'left',
//     },
// });

// export default OttCard

// import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React, { useState } from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import moment from 'moment/moment'
// import RenderHtml from 'react-native-render-html'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TagsList from './TagList'

// const OttCard = ({
//     item,
//     router,
//     hasShadow = true,
// }) => {
//     const [userRating, setUserRating] = useState(0);
//     const [clickCount, setClickCount] = useState(0);

//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 2
//         },
//         shadowOpacity: 0.25,
//         shadowRadius: 6,
//         elevation: 1
//     }

//     const handleCardPress = () => {
//         // Navigate to reviews on card press
//         if (!item?.id) return null;
//         router.push({ pathname: 'streamPeopleSection/streamPeopleDetails', params: { streamId: item.id } });
        
//         // Also update rating as before
//         const newClickCount = clickCount + 0.5;
//         setClickCount(newClickCount);
//         const newRating = newClickCount % 5 === 0 ? 5 : newClickCount % 5;
//         setUserRating(newRating);
//     }

//     const rDate = item?.rDate ? moment(item.rDate).format('MMM DD') : '';

//     const renderRating = () => {
//         const rating = userRating || item?.defRating || 0;
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
//                                 { color: isYellow ? '#de571a' : '#FFFFFF' }
//                             ]}
//                         >
//                             {isYellow ? '★' : '☆'}
//                         </Text>
//                     );
//                 })}
//                 <Text style={[styles.ratingValue, { color: '#FF0000' }]}>
//                     {rating.toFixed(1)}/5
//                 </Text>
//             </View>
//         );
//     }

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'left',
//             fontWeight: 'bold'
//         },
//         p: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'left',
//             fontWeight: 'bold'
//         }
//     }

//     return (
//         <TouchableOpacity 
//             style={[styles.container, hasShadow && shadowStyle]}
//             onPress={handleCardPress}
//             activeOpacity={0.9}
//         >
//             <View style={styles.imageContainer}>
//                 {item?.file?.includes('postImage') && (
//                     <Image
//                         source={getSupabaseFileUrl(item.file)}
//                         style={styles.postMedia}
//                         resizeMode="cover"
//                     />
//                 )}

//                 <View style={styles.overlay}>
//                     {/* Top section with rating and tags */}
//                     <View style={styles.topContainer}>
//                         {renderRating()}
//                         <View style={styles.tagsContainer}>
//                             <TagsList tags={item?.tags} />
//                         </View>
//                     </View>

//                     {/* Bottom section with title and date */}
//                     <View style={styles.bottomContainer}>
//                         <View style={styles.titleDateContainer}>
//                             {item?.body && (
//                                 <RenderHtml
//                                     contentWidth={wp(90)}
//                                     source={{ html: item.body }}
//                                     tagsStyles={titleTagsStyles}
//                                 />
//                             )}
//                             <Text style={styles.releaseDate}>
//                                 {rDate}
//                             </Text>
//                         </View>
//                         <View style={styles.emptySpace} />
//                     </View>
//                 </View>
//             </View>
//         </TouchableOpacity>
//     )
// }

// const styles = StyleSheet.create({
//     container: {
//         marginBottom: 8,
//       //  borderRadius: theme.radius.lg,
//         backgroundColor: 'red',
//      //   overflow: 'hidden',
//         height: hp(30),
//         width: '100%',
//        // padding: 6
//     },
//     imageContainer: {
//         width: '100%',
//         height: '100%',
//         position: 'relative',
//     },
//     postMedia: {
//         width: '100%',
//         height: '100%',
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.4)',
//         justifyContent: 'space-between',
//     },
//     topContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//         width: '100%',
//     },
//     bottomContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-end',
//         width: '100%',
//         paddingBottom: 10,
//     },
//     titleDateContainer: {
//         paddingLeft: 10,
//         alignItems: 'flex-start',
//         justifyContent: 'flex-end',
//         maxWidth: '80%',
//     },
//     emptySpace: {
//         width: 40,
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 8,
//     },
//     tagsContainer: {
//         alignSelf: 'flex-start',
//         padding: 8,
//     },
//     star: {
//         fontSize: hp(2.2),
//         marginRight: 2,
//     },
//     ratingValue: {
//         marginLeft: 5,
//         fontSize: hp(1.8),
//         fontWeight: '600',
//     },
//     releaseDate: {
//         color: 'white',
//         fontSize: hp(1.8),
//         marginTop: 2,
//         textAlign: 'left',
//     },
// });

// export default OttCard

// import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React, { useState } from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import moment from 'moment/moment'
// import RenderHtml from 'react-native-render-html'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TagsList from './TagList'

// const OttCard = ({
//     item,
//     router,
//     hasShadow = true,
// }) => {
//     const [userRating, setUserRating] = useState(0);
//     const [clickCount, setClickCount] = useState(0);

//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 2
//         },
//         shadowOpacity: 0.25,
//         shadowRadius: 6,
//         elevation: 1
//     }

//     const handleCardPress = () => {
//         // Navigate to reviews on card press
//         if (!item?.id) return null;
//         router.push({ pathname: 'streamPeopleSection/streamPeopleDetails', params: { streamId: item.id } });
        
//         // Also update rating as before
//         const newClickCount = clickCount + 0.5;
//         setClickCount(newClickCount);
//         const newRating = newClickCount % 5 === 0 ? 5 : newClickCount % 5;
//         setUserRating(newRating);
//     }

//     const rDate = item?.rDate ? moment(item.rDate).format('MMM DD') : '';

//     const renderRating = () => {
//         const rating = userRating || item?.defRating || 0;
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
//                                 { color: isYellow ? '#FFD700' : '#FFFFFF' }
//                             ]}
//                         >
//                             {isYellow ? '★' : '☆'}
//                         </Text>
//                     );
//                 })}
//                 <Text style={[styles.ratingValue, { color: '#FF0000' }]}>
//                     {rating.toFixed(1)}/5
//                 </Text>
//             </View>
//         );
//     }

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'center',
//             fontWeight: 'bold'
//         },
//         p: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'center',
//             fontWeight: 'bold'
//         }
//     }

//     return (
//         <TouchableOpacity 
//             style={[styles.container, hasShadow && shadowStyle]}
//             onPress={handleCardPress}
//             activeOpacity={0.9}
//         >
//             <View style={styles.imageContainer}>
//                 {item?.file?.includes('postImage') && (
//                     <Image
//                         source={getSupabaseFileUrl(item.file)}
//                         style={styles.postMedia}
//                         resizeMode="cover"
//                     />
//                 )}

//                 <View style={styles.overlay}>
//                     {/* Top section with rating and tags */}
//                     <View style={styles.topContainer}>
//                         {renderRating()}
//                         <View style={styles.tagsContainer}>
//                             <TagsList tags={item?.tags} />
//                         </View>
//                     </View>

//                     {/* Content in the middle */}
//                     <View style={styles.contentContainer}>
//                         {item?.body && (
//                             <RenderHtml
//                                 contentWidth={wp(100)}
//                                 source={{ html: item.body }}
//                                 tagsStyles={titleTagsStyles}
//                             />
//                         )}

//                         <Text style={styles.releaseDate}>
//                             {rDate}
//                         </Text>
//                     </View>
                    
//                     {/* Bottom empty space where button was */}
//                     <View style={styles.bottomSpace} />
//                 </View>
//             </View>
//         </TouchableOpacity>
//     )
// }

// const styles = StyleSheet.create({
//     container: {
//         marginBottom: 15,
//         borderRadius: theme.radius.lg,
//         backgroundColor: 'black',
//         overflow: 'hidden',
//         height: hp(30),
//         padding: 6
//     },
//     imageContainer: {
//         width: '100%',
//         height: '100%',
//         position: 'relative',
//     },
//     postMedia: {
//         width: '100%',
//         height: '100%',
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.4)',
//         justifyContent: 'space-between',
//     },
//     topContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//         width: '100%',
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 8,
//     },
//     tagsContainer: {
//         alignSelf: 'flex-start',
//         padding: 8,
//     },
//     star: {
//         fontSize: hp(2.2),
//         marginRight: 2,
//     },
//     ratingValue: {
//         marginLeft: 5,
//         fontSize: hp(1.8),
//         fontWeight: '600',
//     },
//     contentContainer: {
//         alignItems: 'center',
//         justifyContent: 'center'
//     },
//     releaseDate: {
//         color: 'white',
//         fontSize: hp(1.8),
//         marginTop: hp(0.5),
//     },
//     bottomSpace: {
//         height: hp(3), // Space at the bottom for balance
//     }
// });

// export default OttCard

// import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React, { useState } from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import moment from 'moment/moment'
// import RenderHtml from 'react-native-render-html'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TagsList from './TagList'

// const OttCard = ({
//     item,
//     router,
//     hasShadow = true,
// }) => {
//     const [userRating, setUserRating] = useState(0);
//     const [clickCount, setClickCount] = useState(0);
//     // console.log('item', item);

//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 2
//         },
//         shadowOpacity: 0.25,
//         shadowRadius: 6,
//         elevation: 1
//     }

//     // const handleReadReviews = () => {
//     //     if (!item?.id) return null;
//     //     router.push({ pathname: 'streamDetails', params: { streamId: item.id } });
//     // }

    

//     const handleReadReviews = () => {
//         if (!item?.id) return null;
//         router.push({ pathname: 'streamPeopleSection/streamPeopleDetails', params: { streamId: item.id } });
//     }

//     const handleCardPress = () => {
//         const newClickCount = clickCount + 0.5;
//         setClickCount(newClickCount);
//         const newRating = newClickCount % 5 === 0 ? 5 : newClickCount % 5;
//         setUserRating(newRating);
//     }

//     const rDate = item?.rDate ? moment(item.rDate).format('MMM DD') : '';

//     const renderRating = () => {
//         const rating = userRating || item?.defRating || 0;
//         const filledStars = Math.floor(rating);
        
//         return (
//             <TouchableOpacity style={styles.ratingContainer} onPress={handleCardPress}>
//                 {[...Array(5)].map((_, index) => {
//                     const isYellow = index < filledStars;
//                     return (
//                         <Text 
//                             key={index} 
//                             style={[
//                                 styles.star,
//                                 { color: isYellow ? '#FFD700' : '#FFFFFF' }
//                             ]}
//                         >
//                             {isYellow ? '★' : '☆'}
//                         </Text>
//                     );
//                 })}
//                 <Text style={[styles.ratingValue, { color: '#FF0000' }]}>
//                     {rating.toFixed(1)}/5
//                 </Text>
//             </TouchableOpacity>
//         );
//     }

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'center',
//             fontWeight: 'bold'
//         },
//         p: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'center',
//             fontWeight: 'bold'
//         }
//     }

//     return (
//         <View style={[styles.container, hasShadow && shadowStyle]}>
//             <TouchableOpacity 
//                 style={styles.imageContainer}
//                 onPress={handleCardPress}
//             >
//                 {item?.file?.includes('postImage') && (
//                     <Image
//                         source={getSupabaseFileUrl(item.file)}
//                         style={styles.postMedia}
//                         resizeMode="cover"
//                     />
//                 )}

//                 <View style={styles.overlay}>
//                     {renderRating()}

//                     <View style={styles.contentContainer}>
//                         {item?.body && (
//                             <RenderHtml
//                                 contentWidth={wp(100)}
//                                 source={{ html: item.body }}
//                                 tagsStyles={titleTagsStyles}
//                             />
//                         )}

//                         <Text style={styles.releaseDate}>
//                             {rDate}
//                         </Text>

//                         <TagsList tags={item?.tags} />
//                     </View>
//                 </View>
//             </TouchableOpacity>

//             <TouchableOpacity
//                 style={styles.reviewButton}
//                 onPress={handleReadReviews}
//             >
//                 <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
//             </TouchableOpacity>
//         </View>
//     )
// }

// const styles = StyleSheet.create({
//     container: {
//         marginBottom: 15,
//         borderTopLeftRadius: 4,
//         borderTopRightRadius: 4,
//         borderBottomLeftRadius: theme.radius.lg,
//         borderBottomRightRadius: theme.radius.lg,
//         backgroundColor: 'black',
//         overflow: 'hidden',
//         height: hp(30),
//         padding: 6
//     },
//     imageContainer: {
//         width: '100%',
//         height: '90%',
//         position: 'relative',
//     },
//     postMedia: {
//         width: '100%',
//         height: '100%',
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.4)',
//         justifyContent: 'space-between',
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 8,
//     },
//     star: {
//         fontSize: hp(2.2),
//         marginRight: 2,
//     },
//     ratingValue: {
//         marginLeft: 5,
//         fontSize: hp(1.8),
//         fontWeight: '600',
//     },
//     contentContainer: {
//         alignItems: 'center',
//         justifyContent: 'center'
//     },
//     releaseDate: {
//         color: 'white',
//         fontSize: hp(1.8),
//         marginTop: hp(0.5),
//     },
//     reviewButton: {
//         backgroundColor: 'black',
//         height: '10%',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     reviewButtonText: {
//         color: 'white',
//         fontWeight: 'bold',
//         fontSize: hp(1.8),
//     },
// });

// export default OttCard