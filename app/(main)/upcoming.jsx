import React, { useEffect, useState } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Vibration } from 'react-native';
import { fetchReleases } from '../../services/releaseService';
import { wp, hp } from '@/helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { fetchOtt } from '../../services/ottService'; 
import ReleaseList from '../../components/ReleaseList';
import OttList from '../../components/OttList';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import theme from '../../constants/theme';

const ITEMS_PER_PAGE = 4;

const upcoming = () => {
    const { user, setAuth } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('upcoming');

    const [releases, setReleases] = useState([]);
    const [releasesLoading, setReleasesLoading] = useState(false);
    const [hasMoreReleases, setHasMoreReleases] = useState(true);
    const [releasesPage, setReleasesPage] = useState(1);

       // OTT state
       const [otts, setOtts] = useState([]);
       const [ottsLoading, setOttsLoading] = useState(false);
       const [hasMoreOtts, setHasMoreOtts] = useState(true);
       const [ottsPage, setOttsPage] = useState(1);

    // Handle real-time release updates
    const handleReleaseEvent = (payload) => {
        // Handle new release
        if (payload.eventType === 'INSERT' && payload?.new?.id) {
            setReleases(prevReleases => [payload.new, ...prevReleases]);
        }
        
        // Handle release deletion
        if (payload.eventType === 'DELETE' && payload.old.id) {
            setReleases(prevReleases => 
                prevReleases.filter(release => release.id !== payload.old.id)
            );
        }
        
        // Handle release update
        if (payload.eventType === 'UPDATE' && payload.new.id) {
            setReleases(prevReleases => 
                prevReleases.map(release => 
                    release.id === payload.new.id ? payload.new : release
                )
            );
        }
    };

    // Handle real-time OTT updates
    const handleOttEvent = (payload) => {
        // Handle new OTT
        if (payload.eventType === 'INSERT' && payload?.new?.id) {
            setOtts(prevOtts => [payload.new, ...prevOtts]);
        }
        
        // Handle OTT deletion
        if (payload.eventType === 'DELETE' && payload.old.id) {
            setOtts(prevOtts => 
                prevOtts.filter(ott => ott.id !== payload.old.id)
            );
        }
        
        // Handle OTT update
        if (payload.eventType === 'UPDATE' && payload.new.id) {
            setOtts(prevOtts => 
                prevOtts.map(ott => 
                    ott.id === payload.new.id ? payload.new : ott
                )
            );
        }
    };

    // Set up Supabase real-time subscriptions
    useEffect(() => {
        const releaseChannel = supabase
            .channel('releases')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'releases' },
                handleReleaseEvent
            )
            .subscribe();

        const ottChannel = supabase
            .channel('streams')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'streams' },
                handleOttEvent
            )
            .subscribe();

        // Initial data fetch
        getReleases();
        getOtts();

        return () => {
            supabase.removeChannel(releaseChannel);
            supabase.removeChannel(ottChannel);
        };
    }, []);

// Fetch releases with pagination
const getReleases = async () => {
    if (releasesLoading || !hasMoreReleases) return;
    
    try {
        setReleasesLoading(true);
        const res = await fetchReleases(releasesPage * ITEMS_PER_PAGE);
        
        if (res.success) {
            if (res.data.length === releases.length) {
                setHasMoreReleases(false);
            }
            
            setReleases(prevReleases => {
                const newReleases = res.data.filter(
                    newRelease => !prevReleases.some(
                        existingRelease => existingRelease.id === newRelease.id
                    )
                );
                return [...prevReleases, ...newReleases];
            });
            
            setReleasesPage(prev => prev + 1);
        } else {
            Alert.alert('Error', 'Failed to fetch releases');
        }
    } catch (error) {
        console.error('Error fetching releases:', error);
        Alert.alert('Error', 'Something went wrong while fetching releases');
    } finally {
        setReleasesLoading(false);
    }
};

// Fetch OTT platforms with pagination
const getOtts = async () => {
    if (ottsLoading || !hasMoreOtts) return;
    
    try {
        setOttsLoading(true);
        const res = await fetchOtt(ottsPage * ITEMS_PER_PAGE);
        
        if (res.success) {
            if (res.data.length === otts.length) {
                setHasMoreOtts(false);
            }
            
            setOtts(prevOtts => {
                const newOtts = res.data.filter(
                    newOtt => !prevOtts.some(
                        existingOtt => existingOtt.id === newOtt.id
                    )
                );
                return [...prevOtts, ...newOtts];
            });
            
            setOttsPage(prev => prev + 1);
        } else {
            Alert.alert('Error', 'Failed to fetch OTT platforms');
        }
    } catch (error) {
        console.error('Error fetching OTT platforms:', error);
        Alert.alert('Error', 'Something went wrong while fetching OTT platforms');
    } finally {
        setOttsLoading(false);
    }
};

    const handleTabPress = (tabName) => {
        if (tabName !== activeTab) {
            // Vibrate for 20ms when switching tabs
            Vibration.vibrate(200);
            setActiveTab(tabName);
        }
    };

    // const TabBar = () => (
    //     <View style={styles.tabContainer}>
    //         <TouchableOpacity 
    //             style={[
    //                 styles.tab, 
    //                 activeTab === 'upcoming' && styles.activeTab
    //             ]}
    //             onPress={() => handleTabPress('upcoming')}
    //         >
    //             <Text style={[
    //                 styles.tabText,
    //                 activeTab === 'upcoming' && styles.activeTabText
    //             ]}>THEATRE</Text>
    //         </TouchableOpacity>
    //         <TouchableOpacity 
    //             style={[
    //                 styles.tab, 
    //                 activeTab === 'ott' && styles.activeTab
    //             ]}
    //             onPress={() => handleTabPress('ott')}
    //         >
    //             <Text style={[
    //                 styles.tabText,
    //                 activeTab === 'ott' && styles.activeTabText
    //             ]}>DIGITAL</Text>
    //         </TouchableOpacity>
    //     </View>
    // );


    const TabBar = () => (
        <View style={styles.tabContainer}>
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
                ]}>THEATRE</Text>
            </TouchableOpacity>
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
                ]}>DIGITAL</Text>
            </TouchableOpacity>
        </View>
    );

    // console.log('here are the Otts which are rendered', otts);
    const renderContent = () => {
        if (activeTab === 'ott') {
            return (
                <View>
                {/* streams */}
                <OttList
                  streams={otts}
                  currentUser={user}
                  router={router}
                  loading={ottsLoading}
                  hasMore={hasMoreOtts}
                  onLoadMore={getOtts}
               />
            </View>
            );
        }
        return (
            <View>
                {/* releases rendering */}
               <ReleaseList
                  releases={releases}
                  currentUser={user}
                  router={router}
                  loading={releasesLoading}
                  hasMore={hasMoreReleases}
                  onLoadMore={getReleases}
               />
            </View>
        );
    };

    // bg={"#121212"}
    return (
        <ScreenWrapper bg="black">
            <TabBar />
            {renderContent()}
        </ScreenWrapper>
      
    );
};

const styles = StyleSheet.create({
    // tabContainer: {
    //     flexDirection: 'row',
    //     backgroundColor: 'transparent',
    //     padding: 6,
    //     marginHorizontal: 14,
    //     marginTop: 4,
    //     borderRadius: 8,
    // },
    // tab: {
    //     flex: 1,
    //     paddingVertical: 12,
    //     alignItems: 'center',
    //     borderRadius: 44,
    //   //  backgroundColor: '#2C2C2E #E50914'
    // },
    // activeTab: {
    //     backgroundColor: '#FFCC00',
    //     shadowColor: 'rgba(255, 255, 255, 0.1)',
    //     shadowOffset: {
    //         width: 0,
    //         height: 2,
    //     },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 3,
    //     elevation: 3,
    // },
    // tabText: {
    //     fontSize: 16,
    //     color: '#B3B3B3',
    // },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#000000',
        width: '100%',
        height: 50,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#FFFFFF',
    },
    tabText: {
        fontSize: 16,
        color: '#777777',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    activeTabText: {
        color: '#E50914',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
       
    },
    listStyle: {
        padding: 18, 
        paddingHorizontal: wp(4)
      
    }
});

export default upcoming;