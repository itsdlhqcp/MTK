import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';
import { fetchAverageRating, fetchPeoplesReleaseDetails } from "../services/ottService";
import StreamCardInfo from "../components/streamCardInfo";
import { useToast } from "../contexts/ToastContext";
import CustomDotIndicator from "../components/CutomDotIndicator";

const ReleaseInfo = () => {
    const { streamId } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [release, setRelease] = useState(null);
    const { showToast } = useToast();

    useEffect(() => {
        let isMounted = true;
        
        const getReleaseDetails = async () => {
            try {
                // Fetch the release and its reviews
                const res = await fetchPeoplesReleaseDetails(streamId);
            
                // Fetch the average rating separately
                const avgRes = await fetchAverageRating(streamId);
            
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
        };
        
        getReleaseDetails();
        
        return () => {
            isMounted = false;
        };
    }, [streamId]);

    const handlePeopleReadReviews = () => {
        if (!release?.id) return null;
        router.push({pathname: 'streamPeopleSection/streamPeopleDetails', params: {streamId: release.id}});
    }

    const handleReadReviews = () => {
        if (!release?.id) return null;
        router.push({pathname: 'streamDetails', params: {streamId: release.id}});
    }

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

    const peoplesReviewCount = release?.dpeopreviews?.length || 0;

    return (
        <View style={styles.mainContainer}>
            <View style={styles.container}>
                <StreamCardInfo
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