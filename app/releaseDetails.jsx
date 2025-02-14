import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router"
import { StyleSheet, Text } from "react-native";
import Input from '../components/Input'
import { fetchReleaseDetails } from "../services/releaseService";
import { View } from "react-native";
import { hp, wp } from '../helpers/common'
import theme from '../constants/theme'
import { ScrollView } from "react-native";
import { useAuth } from '../contexts/AuthContext'
import ReleaeCard from '../components/RelesaeCard'
import Loading from "../components/Loading";

const  ReleaseDetails = () => {
    const {releaseId} = useLocalSearchParams(); 
    const {user} = useAuth();
    const router = useRouter()
    const [startLoading, setStartLoading] = useState(false);
    const inputRef = useRef(null); 
    const commentRef = useRef(null);
    const [release, setRelease] = useState(null);

    useEffect(() => {
        getReleaseDetails();
    }, []);

    const getReleaseDetails = async () => {
        // fetch release details 
        let res = await fetchReleaseDetails(releaseId);
        console.log('fetched release details:', res);
        if(res.success) setRelease(res.data); 
        setStartLoading(false);
    };

    if(startLoading) return <View style={styles.center}><Loading/></View>;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                <ReleaeCard
                    item={release} 
                    currentUser={user}
                    router={router} 
                    hasShadow={false}
                    showReviewButton={false}
                />

                {/* review input here */}

                <View style={styles.inputContainer}>
                        <Input
                            inputRef={inputRef}
                            placeholder="Type your review here....."
                            placeholderTextColor={theme.colors.textLight}
                            containerStyle={{flex:1, height: hp(6.2), borderRadius: theme.radius.xl}}
                            onChangeText={value=> commentRef.current = value}
                        />
                </View>

            </ScrollView>
        </View>
    )
}

export default ReleaseDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: Math.round(wp(7))
    },
    list: {
        paddingHorizontal: Math.round(wp(4))
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    notFound: {
        fontSize: Math.round(hp(2.5)),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium
    },
    loading: {
        height: Math.round(hp(5.8)),
        width: Math.round(hp(5.8)),
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: 1.3 }]
    },
    sendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.8,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous',
        height: Math.round(hp(5.8)),
        width: Math.round(hp(5.8))
    },
    replySendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primaryDark,
        borderRadius: theme.radius.sm,
        borderCurve: 'continuous',
        height: Math.round(hp(4.8)),
        width: Math.round(hp(4.8))
    },
    headerTitle: {
        fontSize: Math.round(hp(2.2)),
        color: theme.colors.text,
        fontWeight: theme.fonts.semiBold
    },
    closeButton: {
        padding: Math.round(wp(2)),
        marginRight: Math.round(wp(2))
    },
    noComments: {
        alignHorizontal: 'center',
        justifyContent: 'center',
        marginLeft: "22px"
        
    },
    replyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        marginHorizontal: 10,
        marginLeft: 50 
    },
    replyContainer: {
        marginLeft: 50,
        marginTop: 5
    }
})