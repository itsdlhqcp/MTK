import React, { useEffect, useState } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { Text, View, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { fetchReleases } from '../../services/releaseService';
import { wp, hp } from '@/helpers/common'
import PostCard from '../../components/PostCard';
import { FlatList } from 'react-native';
import RelesaeCard from '../../components/RelesaeCard';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { fetchOtt } from '../../services/ottService';
import OttCard from '../../components/OttCard';

var limit = 0;
var limit2 = 0;
const upcoming = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('upcoming');
    // sections for relese 
    const [relese, setRelese] = useState([]);
    //section for ott 
    const [ott, setOtt] = useState([]);

    useEffect(() => {
        getReleases();
        getOtts();
    }, []);

    const getReleases = async () => {
        limit = limit + 10;
        // call api here
        console.log('limit-->>', limit);
        let res  = await fetchReleases(limit);
        // console.log('got releases data here-->>', res);
        if(res.success){
            setRelese(res.data);
        }
    };

    // fetch ott 
    const getOtts = async () => {
        limit2 = limit2 + 10;
        // call api here
        console.log('limit-->>', limit2);
        let res  = await fetchOtt(limit2);
        // console.log('got releases data here-->>', res);
        if(res.success){
            setOtt(res.data);
        }
    };

    const handleTabPress = (tabName) => {
        if (tabName !== activeTab) {
            // Vibrate for 20ms when switching tabs
            Vibration.vibrate(200);
            setActiveTab(tabName);
        }
    };

    const TabBar = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[
                    styles.tab, 
                    activeTab === 'ott' && styles.activeTab
                ]}
                onPress={() => handleTabPress('ott')}
            >
                <Text style={[
                    styles.tabText,
                    activeTab === 'ott' && styles.activeTabText
                ]}>OTT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[
                    styles.tab, 
                    activeTab === 'upcoming' && styles.activeTab
                ]}
                onPress={() => handleTabPress('upcoming')}
            >
                <Text style={[
                    styles.tabText,
                    activeTab === 'upcoming' && styles.activeTabText
                ]}>Upcoming</Text>
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        if (activeTab === 'ott') {
            return (
                <View>
                {/* streams */}
                <FlatList
                  data={ott}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listStyle}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <OttCard
                      item={item}
                      currentUser={user}
                      router={router}
                    />
                  )}
                />
            </View>
            );
        }
        return (
            <View>
                {/* posts */}
                <FlatList
                  data={relese}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listStyle}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <RelesaeCard
                      item={item}
                      currentUser={user}
                      router={router}
                    />
                  )}
                />
            </View>
        );
    };

    return (
        <ScreenWrapper bg="white">
            <TabBar />
            {renderContent()}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#cfd6e3',
        padding: 6,
        marginHorizontal: 14,
        marginTop: 8,
        borderRadius: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#000',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    listStyle: {
        padding: 10, 
        paddingHorizontal: wp(4)
    }
});

export default upcoming;