import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View, Image, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from '../assets/icons';
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';
import { Text } from "react-native";
import Loading from "../components/Loading";
import { fetchPeoplesReleaseDetails } from "../services/releaseService";
import RenderHtml from 'react-native-render-html';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment/moment';
import { getSupabaseFileUrl } from "../services/imageService";
import ReleaseCardInfo from "../components/releaseCardInfo";
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
// import { AdMobBanner } from 'expo-ads-admob';

const ReleaseInfo = () => {
    const { releaseId } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [release, setRelease] = useState(null);

    const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-7806969239829181/8002029935'; 

    // console.log("releaseId", release.filel);

    useEffect(() => {
        getReleaseDetails();
    }, []);

    const getReleaseDetails = async () => {
        setLoading(true);
        try {
            let res = await fetchPeoplesReleaseDetails(releaseId);
            if (res.success) {
                setRelease(res.data);
            } else {
                Alert.alert('Error', res.msg || 'Failed to fetch release details');
            }
        } catch (error) {
            console.error('Error fetching release details:', error);
            Alert.alert('Error', 'Something went wrong while fetching release details');
        } finally {
            setLoading(false);
        }
    };

    const handleRedirectToDetails = () => {
        if (!release?.id) return null;
        router.push({ 
            pathname: 'releasePeopleSection/releasePeopleDetails', 
            params: { releaseId: release.id } 
        });
    };

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
    };

    const formattedDate = release?.rDate ? moment(release.rDate).format('MMM D') : '';

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <Loading />
            </View>
        );
    }

    if (!release) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.notFound}>Release not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* <View style={styles.header}>
                <Text style={styles.pageTitle}>Release Information</Text>
            </View> */}
            
            {/* <TouchableOpacity 
                style={styles.detailsButton}
                onPress={handleRedirectToDetails}
              >
                <Text style={styles.buttonText}>Read Reviews</Text>
                <Icon name="chevronup" size={hp(2)} color={theme.colors.background} />
            </TouchableOpacity> */}

              <ReleaseCardInfo
                  item={release}
                  router={router}
                />


                <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                    keywords: ['clothing', 'fashion', 'apparel', 'shoes', 'style'], // 💡 Targeting clothing-related ads
                }}
                />
              {/* <AdMobBanner
                bannerSize="smartBannerPortrait"
                adUnitID="ca-app-pub-3940256099942544/6300978111" // Test Banner ID
                servePersonalizedAds
                onDidFailToReceiveAdWithError={(err) => console.log(err)}
             /> */}

        </View>
    );
};

export default ReleaseInfo;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: wp(4),
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: hp(3),
    },
    pageTitle: {
        fontSize: hp(2.8),
        fontWeight: theme.fonts.bold,
        color: theme.colors.bmw,
    },
    notFound: {
        fontSize: hp(2.5),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium
    },
    imageContainer: {
        width: '100%',
        height: hp(50),
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        marginBottom: hp(3),
        position: 'relative'
    },
    image: {
        width: '100%',
        height: '100%',
       
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    radialVignette: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.7,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-end',
        padding: 10
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
        maxWidth: '90%',
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
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.assent,
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(4),
        borderRadius: theme.radius.lg,
        alignSelf: 'center',
        width: '100%',
        maxWidth: wp(80),
        marginTop: hp(2)
    },
    buttonText: {
        color: theme.colors.background,
        fontWeight: theme.fonts.medium,
        fontSize: hp(2),
        marginRight: wp(2)
    }
});