import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';
import { Text } from "react-native";
import Loading from "../components/Loading";
import { fetchAverageRating, fetchPeoplesReleaseDetails } from "../services/releaseService";
import moment from 'moment/moment';
import ReleaseCardInfo from "../components/releaseCardInfo";
import { useToast } from "@/contexts/ToastContext";
// import { BannerAd, BannerAdSize, MobileAds, TestIds } from 'react-native-google-mobile-ads';

const ReleaseInfo = () => {
    const params = useLocalSearchParams();
    const { releaseId } = params;
    const lib = params?.lib;
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [release, setRelease] = useState(null);
    const { showToast } = useToast();
    // const [adLoaded, setAdLoaded] = useState(false);
    // const [adsInitialized, setAdsInitialized] = useState(false);
    // const [adFailedToLoad, setAdFailedToLoad] = useState(false);

    // Use test ad unit ID for development
    // const adUnitId = __DEV__ 
    //     ? TestIds.BANNER 
    //     : 'ca-app-pub-7806969239829181/8002029935';
    
    // Ad size - using anchored adaptive banner for better compatibility
    // const adSize = BannerAdSize.ANCHORED_ADAPTIVE_BANNER;

    // Initialize Mobile Ads SDK
    // useEffect(() => {
    //     let isMounted = true;
        
    //     async function initializeMobileAds() {
    //         try {
    //             await MobileAds().initialize();
    //             if (isMounted) {
    //                 setAdsInitialized(true);
    //                 console.log("Mobile Ads SDK initialized successfully");
                    
    //                 // Log whether we're using test ads
    //                 console.log(`Using ${__DEV__ ? 'TEST' : 'PRODUCTION'} ads: ${adUnitId}`);
    //             }
    //         } catch (error) {
    //             console.error("Failed to initialize Mobile Ads SDK:", error);
    //             if (isMounted) {
    //                 setAdsInitialized(true); // Still mark as initialized to avoid blocking UI
    //             }
    //         }
    //     }
        
    //     initializeMobileAds();
        
    //     return () => {
    //         isMounted = false;
    //     };
    // }, [adUnitId]);

    useEffect(() => {
        let isMounted = true;
        
        async function loadReleaseData() {
            try {
                // Fetch the release and its reviews
                const res = await fetchPeoplesReleaseDetails(releaseId);
          
                // Fetch the average rating separately
               const avgRes = await fetchAverageRating(releaseId, release?.sconnectedId);
          
                if (res.success && isMounted) {
                    const releaseData = res.data;
          
                    // Add the averageRating to the release object
                    const releaseWithRating = {
                        ...releaseData,
                        averageRating: avgRes.success ? avgRes.average : null,
                    };
          
                    setRelease(releaseWithRating);
                } else if (isMounted) {
                    showToast('success', 'Failed to fetch release details!! - Network Problem');
                }
            } catch (error) {
                console.error('Error fetching release details:', error);
                if (isMounted) {
                    Alert.alert('Error', 'Something went wrong while fetching release details');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        
        loadReleaseData();
        
        return () => {
            isMounted = false;
        };
    }, [releaseId]);
      
    const handleRedirectToDetails = () => {
        if (!release?.id) return null;
        router.push({ 
            pathname: 'releasePeopleSection/releasePeopleDetails', 
            params: { releaseId: release.id } 
        });
    };

    const handlePeopleReadReviews = () => {
        if (!release?.id) return null;
        router.push({pathname: 'releasePeopleSection/releasePeopleDetails', params: {releaseId: release.id,  lib: lib }});
    }

    const handleReadReviews = () => {
        if (!release?.id) return null;
        router.push({pathname: 'releaseDetails', params: {releaseId: release.id}});
    }

    const peoplesReviewCount = release?.peoplesReview?.length || 0;

    // Render loading screen
    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <Loading />
            </View>
        );
    }

    // Render error screen if release not found
    if (!release) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.notFound}>Release not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <View style={styles.container}>
                <ReleaseCardInfo
                    item={release}
                    router={router}
                    handlePeopleReadReviews={handlePeopleReadReviews}
                    handleReadReviews={handleReadReviews}
                    peoplesReviewCount={peoplesReviewCount}
                />
            </View>
            
            {/* Banner Ad Component */}
            {/* <View style={styles.bannerContainer}>
                {adsInitialized && (
                    <BannerAd
                        unitId={adUnitId}
                        size={adSize}
                        requestOptions={{
                            requestNonPersonalizedAdsOnly: true,
                            keywords: ['film'],
                        }}
                        onAdLoaded={() => {
                            setAdLoaded(true);
                            setAdFailedToLoad(false);
                            console.log("Ad loaded successfully");
                        }}
                        onAdFailedToLoad={(error) => {
                            console.error("Ad failed to load:", error);
                            setAdFailedToLoad(true);
                        }}
                    />
                )}
                {(!adLoaded || adFailedToLoad) && adsInitialized && (
                    <View style={[styles.adPlaceholder, styles.bannerSize]}>
                        <Text style={styles.placeholderText}>
                            {adFailedToLoad 
                                ? "No ads available at this time." 
                                : "Loading advertisement..."}
                        </Text>
                        <Text style={styles.smallText}>
                            {adFailedToLoad && __DEV__ 
                                ? "Using test ads in development mode." 
                                : adFailedToLoad 
                                    ? "New ad units may take 20+ minutes to serve ads." 
                                    : ""}
                        </Text>
                    </View>
                )}
            </View> */}
        </View>
    );
};

export default ReleaseInfo;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#121212',
    },
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    notFound: {
        fontSize: hp(2.5),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium
    },
    // Ad display styles
    bannerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        paddingBottom: 5,
    },
    adPlaceholder: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(200, 200, 200, 0.2)',
        borderRadius: 4,
        padding: 10,
    },
    bannerSize: {
        height: 140, 
        maxWidth: 728, 
    },
    placeholderText: {
        color: theme.colors.text || '#FFFFFF',
        fontSize: hp(1.8),
    },
    smallText: {
        fontSize: hp(1.2),
        marginTop: 4,
        opacity: 0.7,
        color: theme.colors.text || '#FFFFFF',
    }
});