// import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native'
// import React from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import RenderHtml from 'react-native-render-html'
// import Icon from '../assets/icons';
// import moment from 'moment/moment';
// import { LinearGradient } from 'expo-linear-gradient';

// const ReleaseCardInfo = ({
//     item,
//     handlePeopleReadReviews,
//     handleReadReviews,
//     peoplesReviewCount,
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

//     const createdAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';

//     const extractYear = item?.rDate ? moment(item.rDate).format('YYYY') : '';

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

//     // Film details to display
//     const filmDetails = [
//         { label: 'Language', value: item?.lang || 'N/A' },
//         { label: 'Genre', value: item?.genre || 'N/A' },
//         { label: 'Duration', value: item?.duration || 'N/A' },
//         { label: 'Director', value: item?.director || 'N/A' },
//         { label: 'Writer', value: item?.writer || 'N/A' },
//         { label: 'Music', value: item?.music || 'N/A' },
//         { label: 'DOP', value: item?.dop || 'N/A' },
//         { label: 'Editor', value: item?.edit || 'N/A' },
//         { label: 'Cast', value: item?.cast || 'N/A' },
//     ];

//     return (
//         <View style={styles.mainContainer}>
//             {/* Original Card */}
//             <View style={[styles.container, hasShadow && shadowStyle]}>
//                      {item?.file?.includes('postImage') && (
//                 <Image
//                     source={getSupabaseFileUrl(item.filel)}
//                     style={styles.postMedia}
//                     resizeMode="cover"
//                 />
//             )}

//             {/* Gradient Overlay only at the bottom */}
//             <LinearGradient
//                 colors={['transparent', 'rgba(0,0,0,0.8)']}
//                 style={styles.bottomFadeOverlay}
//             />
                
//                 {/* CONTENTS UNDER THE ORIGINAL CARD */}
//                 <View style={styles.overlay}>
//                     {renderRating()}
//                     <View style={styles.contentContainer}>

//                   {/* start of card details */}
//                         <View style={styles.innerContent}>
//                             {item?.body && (
//                                 <RenderHtml
//                                     contentWidth={wp(100)}
//                                     source={{html: item.body}}
//                                     tagsStyles={titleTagsStyles}
//                                 />
//                             )}
//                            <Text style={styles.releaseDate}>
//                             {extractYear || 'N/A'}
//                         </Text>
//                         </View>
//                         <Text style={styles.releaseDate}>
//                            Release: {createdAt || 'N/A'}
//                         </Text>

//                         {item.sconnectedId ? (
//                         <Text style={styles.releaseDate}>
//                             Status: Now Streaming 
//                         </Text>
//                                 ) : (
//                                     <Text style={styles.releaseDate}>
//                             Status: Now Showing on Theatres
//                         </Text>
//                                 )}
//                  {/* end of card details */}

//                         <View style={styles.box}>
//                             {showReviewButton && (
//                                 <View style={styles.reviewSection}>
//                                     <TouchableOpacity 
//                                         style={styles.reviewButton}
//                                         onPress={handlePeopleReadReviews}
//                                     >
//                                         <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
//                                     </TouchableOpacity>
//                                     <View style={styles.reviewCountBadge}>
//                                         <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
//                                     </View>
//                                 </View>
//                             )}

//                             {showReviewButton && (
//                                 <View style={styles.reviewSection}>
//                                     <TouchableOpacity 
//                                         onPress={handleReadReviews}
//                                     >
//                                         <Icon name="plus" size={hp(3.5)} color={theme.colors.blue} />
//                                     </TouchableOpacity>
//                                 </View>
//                             )}
//                         </View>
//                     </View>
//                 </View>
//             </View>

//             {/* New Film Details Section below the original card */}
//             <View style={styles.detailsContainerOuter}>
//             <View style={[styles.detailsContainer, hasShadow && shadowStyle]}>
//                 <Text style={styles.detailsTitle}>Film Details</Text>
//                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.detailsScrollView}>
//                     {filmDetails.map((detail, index) => (
//                         <View key={index} style={styles.detailCard}>
//                             <Text style={styles.detailLabel}>{detail.label}</Text>
//                             <Text style={styles.detailValue}>{detail.value}</Text>
//                         </View>
//                     ))}
//                 </ScrollView>
//             </View>
//             </View>
//         </View>
//     )
// }

// export default ReleaseCardInfo

// const styles = StyleSheet.create({
//     mainContainer: {
//         marginBottom: 20,
//     },
//     container: {
//         marginBottom: 10,
//         backgroundColor: '#121212', 
//         overflow: 'hidden',
//         height: hp(67),
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
//         color: "white" || '#FF3B30',
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
//         backgroundColor: '#262626', 
//         paddingHorizontal: 20,
//         paddingVertical: 8,
//         borderRadius: 8
//     },
//     reviewButtonText: {
//         color: theme.colors.blue || '#FF3B30', 
//         fontWeight: 'bold',
//         fontSize: hp(1.8)
//     },
//     reviewCountBadge: {
//         backgroundColor: theme.colors.blue || '#0095F6', 
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
//         fontSize: hp(1.3),
//         fontWeight: 'bold'
//     },
//     box: {
//         flexDirection: 'row',
//         gap: 24,
//         paddingTop: 6
//     },
//     // Styles for the new film details section - Dark theme
//     detailsContainer: {
//         backgroundColor: '#121212', 
//         borderRadius: theme.radius.md,
//         padding: 12,
//         marginTop: 1,
//         borderWidth: 1,
//         borderColor: '#262626' 
//     },
//     detailsTitle: {
//         fontSize: hp(2),
//         fontWeight: 'bold',
//         color: theme.colors.blue || '#FF3B30', 
//         marginBottom: 8,
//         marginLeft: 5
//     },
//     detailsScrollView: {
//         flexGrow: 0
//     },
//     detailCard: {
//         backgroundColor: '#262626', 
//         borderRadius: theme.radius.md,
//         padding: 10,
//         marginRight: 10,
//         minWidth: wp(28),
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#363636' 
//     },
//     detailLabel: {
//         color: theme.colors.blue || '#FF3B30', 
//         fontSize: hp(1.6),
//         fontWeight: 'bold',
//         marginBottom: 4
//     },
//     detailValue: {
//         color: '#FFFFFF', 
//         fontSize: hp(1.5),
//         textAlign: 'center'
//     },
//     detailsContainerOuter:{
//         paddingHorizontal: wp(0.8),
//     },
//     bottomFadeOverlay: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         height: hp(55), 
//         zIndex: 1,
//     },
//     contentContainer: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         padding: 15,
//         zIndex: 2,
//         alignItems: 'center',
//     },
//     innerContent: {
//         alignItems: 'center',
//         gap: 10,
//         flexDirection: 'row',
//     },
    
// })


import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native'
import React from 'react'
import { wp, hp } from '@/helpers/common'
import theme from '../constants/theme'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import RenderHtml from 'react-native-render-html'
import Icon from '../assets/icons'
import moment from 'moment/moment'
import { LinearGradient } from 'expo-linear-gradient'

const ReleaseCardInfo = ({
    item,
    handlePeopleReadReviews,
    handleReadReviews,
    peoplesReviewCount,
    hasShadow = true,
    showReviewButton = true,
}) => {
    const shadowStyle = {
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    }

    const createdAt = item?.rDate ? moment(item.rDate).format('MMM D YYYY') : '';
    const extractYear = item?.rDate ? moment(item.rDate).format('YYYY') : '';

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

    // New function to render user rating with visual meter
    const renderUserRating = () => {
        const userRating = item?.averageRating || 0;
        const formattedRating = Number(userRating.toFixed(1));
        
        // Calculate percentage for the progress bar
        const percentage = (formattedRating / 5) * 100;
        
        // Determine color based on rating
        let ratingColor = '#FF3B30'; // Red for low ratings
        if (formattedRating >= 3.5) {
            ratingColor = '#34C759'; // Green for high ratings
        } else if (formattedRating >= 2.5) {
            ratingColor = '#FF9500'; // Orange for medium ratings
        } else if (formattedRating >= 4.6) {
            ratingColor = theme.colors.bmw; // Yellow for low ratings
        }
        
        return (
            <View style={styles.ratingoutxpanel}>
            <View style={styles.userRatingContainer}>
                <View style={styles.userRatingHeader}>
                    <Icon name="user" size={hp(2)} color="white" />
                    <Text style={styles.userRatingTitle}>User Rating</Text>
                </View>
                
                <View style={styles.ratingMeterContainer}>
                    <View style={styles.ratingMeterBackground}>
                        <View 
                            style={[
                                styles.ratingMeterFill, 
                                { width: `${percentage}%`, backgroundColor: ratingColor }
                            ]} 
                        />
                    </View>
                    
                    <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
                        <Text style={styles.ratingBadgeText}>{formattedRating}</Text>
                    </View>
                </View>
            </View>
            </View>
        );
    }

    const titleTagsStyles = {
        div: {
            color: 'white',
            fontSize: hp(2.5),
            textAlign: 'center',
            fontWeight: 'bold'
        },
        b: {
            color: 'white',
            fontWeight: 'bold'
        }
    }

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
            {/* Main Card */}
            <View style={[styles.container, hasShadow && shadowStyle]}>
                {/* Poster Image */}
                {item?.file?.includes('postImage') ? (
                    <Image
                        source={getSupabaseFileUrl(item.filel)}
                        style={styles.postMedia}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.fallbackImage} />
                )}

                {/* Enhanced Gradient Overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradientOverlay}
                />
                
                {/* Content Overlay */}
                <View style={styles.overlay}>
                    {/* Rating Stars - Top Left */}
                    {renderRating()}
                    
                    {/* Bottom Content */}
                    <View style={styles.bottomContent}>
                        {/* Title and Year */}
                        <View style={styles.titleContainer}>
                            {item?.body ? (
                                <RenderHtml
                                    contentWidth={wp(100)}
                                    source={{html: item.body}}
                                    tagsStyles={titleTagsStyles}
                                />
                            ) : null}
                            {/* <Text style={styles.yearText}>{extractYear || 'N/A'}</Text> */}
                        </View>
                        
                        {/* Release Info */}
                        <Text style={styles.releaseInfo}>
                            Release: {createdAt || 'N/A'}
                        </Text>
                        
                        {/* Status */}
                        <Text style={styles.statusText}>
                            Status: {item.sconnectedId ? 'Now Streaming' : 'Now Showing on Theatres'}
                        </Text>

                       
                        
                        {/* Action Buttons */}
                        {showReviewButton && (
                            <View style={styles.actionButtons}>
                                {/* Read Reviews Button */}
                                <View style={styles.reviewButtonContainer}>
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
                                
                                {/* Add Review Button */}
                                <TouchableOpacity 
                                    style={styles.addButton}
                                    onPress={handleReadReviews}
                                >
                                    <Icon name="plus" size={hp(3)} color={theme.colors.blue} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>

             {/* User Rating - Enhanced UI */}
             {renderUserRating()}

            {/* Film Details Section */}
            <View style={styles.detailsContainerOuter}>
                <View style={[styles.detailsContainer, hasShadow && shadowStyle]}>
                    <Text style={styles.detailsTitle}>Film Details</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.detailsScrollView}
                        contentContainerStyle={styles.detailsScrollContent}
                    >
                        {filmDetails.map((detail, index) => (
                            <View key={index} style={styles.detailCard}>
                                <Text style={styles.detailLabel}>{detail.label}</Text>
                                <Text style={styles.detailValue}>{detail.value}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </View>
    )
}

export default ReleaseCardInfo

const styles = StyleSheet.create({
    mainContainer: {
        marginBottom: 20,
        width: '100%',
    },
    container: {
        marginBottom: 12,
        backgroundColor: '#121212',
        overflow: 'hidden',
        height: hp(67),
        position: 'relative',
        borderRadius: 12,
    },
    postMedia: {
        height: '100%',
        width: '100%',
    },
    fallbackImage: {
        height: '100%',
        width: '100%',
        backgroundColor: '#1a1a1a',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: hp(60),
        zIndex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: 16,
        justifyContent: 'space-between',
        zIndex: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
    },
    star: {
        color: theme.colors.star,   // #FFD700 yellow star
        fontSize: hp(2.2),
        marginRight: 2,
    },
    ratingText: {
        color: 'white',
        marginLeft: 5,
        fontSize: hp(1.8),
        fontWeight: '600',
    },
    bottomContent: {
        alignItems: 'center',
        width: '100%',
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    yearText: {
        color: 'white',
        fontSize: hp(2.2),
        fontWeight: '600',
        marginTop: 4,
    },
    releaseInfo: {
        color: 'white',
        fontSize: hp(1.8),
        marginBottom: 6,
        fontWeight: '400',
    },
    statusText: {
        color: 'white',
        fontSize: hp(1.8),
        marginBottom: 16,
        fontWeight: '500',
    },
    // User Rating Styles
    userRatingContainer: {
        width: '100%',
        backgroundColor: 'rgba(38, 38, 38, 0.8)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#363636',
    },
    userRatingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userRatingTitle: {
        color: 'white',
        fontSize: hp(1.8),
        fontWeight: '600',
        marginLeft: 6,
    },
    ratingMeterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingMeterBackground: {
        flex: 1,
        height: hp(1.2),
        backgroundColor: '#3A3A3C',
        borderRadius: 6,
        overflow: 'hidden',
        marginRight: 10,
    },
    ratingMeterFill: {
        height: '100%',
        borderRadius: 6,
    },
    ratingBadge: {
        width: hp(3.5),
        height: hp(3.5),
        borderRadius: hp(1.75),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    ratingBadgeText: {
        color: 'white',
        fontSize: hp(1.6),
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginTop: 4,
    },
    reviewButtonContainer: {
        position: 'relative',
    },
    reviewButton: {
        backgroundColor: '#262626',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#363636',
    },
    reviewButtonText: {
        color: theme.colors.blue || '#0095F6',
        fontWeight: 'bold',
        fontSize: hp(1.8),
    },
    reviewCountBadge: {
        backgroundColor: theme.colors.blue || '#0095F6',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: -12,
        top: -12,
        paddingHorizontal: 8,
    },
    reviewCountText: {
        color: 'white',
        fontSize: hp(1.3),
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: '#262626',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#363636',
    },
    
    // Film Details Section
    detailsContainerOuter: {
        paddingHorizontal: wp(0.8),
    },
    detailsContainer: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#262626',
    },
    detailsTitle: {
        fontSize: hp(2.2),
        fontWeight: 'bold',
        color: theme.colors.blue || '#0095F6',
        marginBottom: 12,
        marginLeft: 4,
    },
    detailsScrollView: {
        flexGrow: 0,
    },
    detailsScrollContent: {
        paddingRight: 12,
        paddingBottom: 4,
    },
    detailCard: {
        backgroundColor: '#262626',
        borderRadius: 10,
        padding: 12,
        marginRight: 12,
        minWidth: wp(28),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#363636',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    detailLabel: {
        color: theme.colors.blue || '#0095F6',
        fontSize: hp(1.6),
        fontWeight: 'bold',
        marginBottom: 6,
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: hp(1.5),
        textAlign: 'center',
    },
    ratingoutxpanel: {
        paddingHorizontal: wp(0.8),
    }
})

// import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native'
// import React from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import RenderHtml from 'react-native-render-html'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { LinearGradient } from 'expo-linear-gradient'

// const ReleaseCardInfo = ({
//     item,
//     handlePeopleReadReviews,
//     handleReadReviews,
//     peoplesReviewCount,
//     hasShadow = true,
//     showReviewButton = true,
// }) => {
//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 4
//         },
//         shadowOpacity: 0.3,
//         shadowRadius: 8,
//         elevation: 5
//     }

//     const createdAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
//     const extractYear = item?.rDate ? moment(item.rDate).format('YYYY') : '';

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
//             fontSize: hp(2.5),
//             textAlign: 'center',
//             fontWeight: 'bold'
//         },
//         b: {
//             color: 'white',
//             fontWeight: 'bold'
//         }
//     }

//     // Film details to display
//     const filmDetails = [
//         { label: 'Language', value: item?.lang || 'N/A' },
//         { label: 'Genre', value: item?.genre || 'N/A' },
//         { label: 'Duration', value: item?.duration || 'N/A' },
//         { label: 'Director', value: item?.director || 'N/A' },
//         { label: 'Writer', value: item?.writer || 'N/A' },
//         { label: 'Music', value: item?.music || 'N/A' },
//         { label: 'DOP', value: item?.dop || 'N/A' },
//         { label: 'Editor', value: item?.edit || 'N/A' },
//         { label: 'Cast', value: item?.cast || 'N/A' },
//     ];

//     return (
//         <View style={styles.mainContainer}>
//             {/* Main Card */}
//             <View style={[styles.container, hasShadow && shadowStyle]}>
//                 {/* Poster Image */}
//                 {item?.file?.includes('postImage') ? (
//                     <Image
//                         source={getSupabaseFileUrl(item.filel)}
//                         style={styles.postMedia}
//                         resizeMode="cover"
//                     />
//                 ) : (
//                     <View style={styles.fallbackImage} />
//                 )}

//                 {/* Enhanced Gradient Overlay */}
//                 <LinearGradient
//                     colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
//                     style={styles.gradientOverlay}
//                 />
                
//                 {/* Content Overlay */}
//                 <View style={styles.overlay}>
//                     {/* Rating Stars - Top Left */}
//                     {renderRating()}
                    
//                     {/* Bottom Content */}
//                     <View style={styles.bottomContent}>
//                         {/* Title and Year */}
//                         <View style={styles.titleContainer}>
//                             {item?.body ? (
//                                 <RenderHtml
//                                     contentWidth={wp(100)}
//                                     source={{html: item.body}}
//                                     tagsStyles={titleTagsStyles}
//                                 />
//                             ) : null}
//                             <Text style={styles.yearText}>{extractYear || 'N/A'}</Text>
//                         </View>
                        
//                         {/* Release Info */}
//                         <Text style={styles.releaseInfo}>
//                             Release: {createdAt || 'N/A'}
//                         </Text>
                        
//                         {/* Status averageRating*/}
//                         <Text style={styles.statusText}>
//                             Status: {item.sconnectedId ? 'Now Streaming' : 'Now Showing on Theatres'}
//                         </Text>

//                         <Text style={styles.statusText}>
//                             User Rating: {Number(item.averageRating.toFixed(1))} 
//                         </Text>
                        
//                         {/* Action Buttons */}
//                         {showReviewButton && (
//                             <View style={styles.actionButtons}>
//                                 {/* Read Reviews Button */}
//                                 <View style={styles.reviewButtonContainer}>
//                                     <TouchableOpacity 
//                                         style={styles.reviewButton}
//                                         onPress={handlePeopleReadReviews}
//                                     >
//                                         <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
//                                     </TouchableOpacity>
//                                     <View style={styles.reviewCountBadge}>
//                                         <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
//                                     </View>
//                                 </View>
                                
//                                 {/* Add Review Button */}
//                                 <TouchableOpacity 
//                                     style={styles.addButton}
//                                     onPress={handleReadReviews}
//                                 >
//                                     <Icon name="plus" size={hp(3)} color={theme.colors.blue} />
//                                 </TouchableOpacity>
//                             </View>
//                         )}
//                     </View>
//                 </View>
//             </View>

//             {/* Film Details Section */}
//             <View style={styles.detailsContainerOuter}>
//                 <View style={[styles.detailsContainer, hasShadow && shadowStyle]}>
//                     <Text style={styles.detailsTitle}>Film Details</Text>
//                     <ScrollView 
//                         horizontal 
//                         showsHorizontalScrollIndicator={false} 
//                         style={styles.detailsScrollView}
//                         contentContainerStyle={styles.detailsScrollContent}
//                     >
//                         {filmDetails.map((detail, index) => (
//                             <View key={index} style={styles.detailCard}>
//                                 <Text style={styles.detailLabel}>{detail.label}</Text>
//                                 <Text style={styles.detailValue}>{detail.value}</Text>
//                             </View>
//                         ))}
//                     </ScrollView>
//                 </View>
//             </View>
//         </View>
//     )
// }

// export default ReleaseCardInfo

// const styles = StyleSheet.create({
//     mainContainer: {
//         marginBottom: 20,
//         width: '100%',
//     },
//     container: {
//         marginBottom: 12,
//         backgroundColor: '#121212',
//         overflow: 'hidden',
//         height: hp(67),
//         position: 'relative',
//         borderRadius: 12,
//     },
//     postMedia: {
//         height: '100%',
//         width: '100%',
//     },
//     fallbackImage: {
//         height: '100%',
//         width: '100%',
//         backgroundColor: '#1a1a1a',
//     },
//     gradientOverlay: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         height: hp(60),
//         zIndex: 1,
//     },
//     overlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         padding: 16,
//         justifyContent: 'space-between',
//         zIndex: 2,
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         alignSelf: 'flex-start',
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 16,
//     },
//     star: {
//         color: theme.colors.star,   // #FFD700 yellow star
//         fontSize: hp(2.2),
//         marginRight: 2,
//     },
//     ratingText: {
//         color: 'white',
//         marginLeft: 5,
//         fontSize: hp(1.8),
//         fontWeight: '600',
//     },
//     bottomContent: {
//         alignItems: 'center',
//         width: '100%',
//     },
//     titleContainer: {
//         alignItems: 'center',
//         marginBottom: 8,
//     },
//     yearText: {
//         color: 'white',
//         fontSize: hp(2.2),
//         fontWeight: '600',
//         marginTop: 4,
//     },
//     releaseInfo: {
//         color: 'white',
//         fontSize: hp(1.8),
//         marginBottom: 6,
//         fontWeight: '400',
//     },
//     statusText: {
//         color: 'white',
//         fontSize: hp(1.8),
//         marginBottom: 16,
//         fontWeight: '500',
//     },
//     actionButtons: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 20,
//         marginTop: 4,
//     },
//     reviewButtonContainer: {
//         position: 'relative',
//     },
//     reviewButton: {
//         backgroundColor: '#262626',
//         paddingHorizontal: 20,
//         paddingVertical: 10,
//         borderRadius: 8,
//         borderWidth: 1,
//         borderColor: '#363636',
//     },
//     reviewButtonText: {
//         color: theme.colors.blue || '#0095F6',
//         fontWeight: 'bold',
//         fontSize: hp(1.8),
//     },
//     reviewCountBadge: {
//         backgroundColor: theme.colors.blue || '#0095F6',
//         borderRadius: 12,
//         minWidth: 24,
//         height: 24,
//         justifyContent: 'center',
//         alignItems: 'center',
//         position: 'absolute',
//         right: -12,
//         top: -12,
//         paddingHorizontal: 8,
//     },
//     reviewCountText: {
//         color: 'white',
//         fontSize: hp(1.3),
//         fontWeight: 'bold',
//     },
//     addButton: {
//         backgroundColor: '#262626',
//         width: 44,
//         height: 44,
//         borderRadius: 22,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#363636',
//     },
    
//     // Film Details Section
//     detailsContainerOuter: {
//         paddingHorizontal: wp(0.8),
//     },
//     detailsContainer: {
//         backgroundColor: '#121212',
//         borderRadius: 12,
//         padding: 16,
//         borderWidth: 1,
//         borderColor: '#262626',
//     },
//     detailsTitle: {
//         fontSize: hp(2.2),
//         fontWeight: 'bold',
//         color: theme.colors.blue || '#0095F6',
//         marginBottom: 12,
//         marginLeft: 4,
//     },
//     detailsScrollView: {
//         flexGrow: 0,
//     },
//     detailsScrollContent: {
//         paddingRight: 12,
//         paddingBottom: 4,
//     },
//     detailCard: {
//         backgroundColor: '#262626',
//         borderRadius: 10,
//         padding: 12,
//         marginRight: 12,
//         minWidth: wp(28),
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#363636',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     detailLabel: {
//         color: theme.colors.blue || '#0095F6',
//         fontSize: hp(1.6),
//         fontWeight: 'bold',
//         marginBottom: 6,
//     },
//     detailValue: {
//         color: '#FFFFFF',
//         fontSize: hp(1.5),
//         textAlign: 'center',
//     },
// })