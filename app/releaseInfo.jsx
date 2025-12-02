import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';
import { fetchAverageRating, fetchPeoplesReleaseDetails } from "../services/releaseService";
import ReleaseCardInfo from "../components/releaseCardInfo";
import { useToast } from "@/contexts/ToastContext";
import CustomDotIndicator from "@/components/CutomDotIndicator";

const ReleaseInfo = () => {
    const params = useLocalSearchParams();
    const { releaseId } = params;
    const lib = params?.lib;
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [release, setRelease] = useState(null);
    const { showToast } = useToast();

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
                <CustomDotIndicator count={55} size={wp(4.5)}/>
            </View>
        );
    }

    // Render error screen if release not found
    if (!release) {
        return (
            <View style={[styles.container, styles.center]}>
                <CustomDotIndicator count={55} size={wp(4.5)}/>
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
        paddingHorizontal: wp(1), // Responsive horizontal padding
        paddingTop: hp(1), // Responsive top padding
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    notFound: {
        fontSize: hp(3), // Responsive font size
        color: theme.colors.text,
        fontWeight: theme.fonts.medium,
        textAlign: 'center',
        marginHorizontal: wp(2), // Responsive margin
    }
});