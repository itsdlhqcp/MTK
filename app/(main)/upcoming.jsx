// import React, { useEffect, useState } from 'react';
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { Text, View, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
// import { fetchReleases } from '../../services/releaseService';
// import { wp, hp } from '@/helpers/common'
// import { useAuth } from '../../contexts/AuthContext';
// import { useRouter } from 'expo-router';
// import { fetchOtt } from '../../services/ottService';
// import ReleaseList from '../../components/ReleaseList';
// import OttList from '../../components/OttList';

// var limit = 0;
// var limit2 = 0;
// const ITEMS_PER_PAGE = 5;  

// const upcoming = () => {
//     const {user, setAuth} = useAuth();
//     const router = useRouter();
//     const [activeTab, setActiveTab] = useState('upcoming');
//     // sections for relese 
//     const [relese, setRelese] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [hasMore, setHasMore] = useState(true);
//     const [page, setPage] = useState(1);
//     //section for ott 
//     const [ott, setOtt] = useState([]);

//      // Initial load
//      useEffect(() => {
//         getReleases();
//         getOtts();
//     }, []);

//     // const getReleases = async () => {
//     //     limit = limit + 5;
//     //     // call api here
//     //     console.log('limit-->>', limit);
//     //     let res  = await fetchReleases(limit);
//     //     // console.log('got releases data here-->>', res);
//     //     if(res.success){
//     //         setRelese(res.data);
//     //     }
//     // };

//     const getReleases = async () => {
//         if (loading || !hasMore) return;
        
//         try {
//             setLoading(true);
//             const limit = page * ITEMS_PER_PAGE;
//             const res = await fetchReleases(limit);
            
//             if (res.success) {
//                 // Check if we've reached the end
//                 // If the API returns the same number of items as we already have,
//                 // we've reached the end
//                 // if (res.data.length === releases.length) {
//                 //     setHasMore(false);
//                 //     return;
//                 // }
                
//                 // Append new releases, avoiding duplicates
//                 // setReleases(prevReleases => {
//                 //     const newReleases = res.data.filter(
//                 //         newRelease => !prevReleases.some(
//                 //             existingRelease => existingRelease.id === newRelease.id
//                 //         )
//                 //     );
//                 //     return [...prevReleases, ...newReleases];
//                 // });
                
//                 setPage(prev => prev + 1);
//             } else {
//                 console.error('Failed to fetch releases');
//                 // You can add your preferred error handling here
//             }
//         } catch (error) {
//             console.error('Error fetching releases:', error);
//             // You can add your preferred error handling here
//         } finally {
//             setLoading(false);
//         }
//     };

//     // fetch ott 
//     const getOtts = async () => {
//         limit2 = limit2 + 5;
//         // call api here
//         console.log('limit-->>', limit2);
//         let res  = await fetchOtt(limit2);
//         // console.log('got releases data here-->>', res);
//         if(res.success){
//             setOtt(res.data);
//         }
//     };



// import React, { useEffect, useState } from 'react';
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { Text, View, TouchableOpacity, StyleSheet, Alert, Vibration } from 'react-native';
// import { fetchReleases } from '../../services/releaseService';
// import { wp, hp } from '@/helpers/common';
// import { useAuth } from '../../contexts/AuthContext';
// import { useRouter } from 'expo-router';
// import { fetchOtt } from '../../services/ottService';
// import ReleaseList from '../../components/ReleaseList';
// import OttList from '../../components/OttList';
// import { supabase } from '../../lib/supabase';

// const ITEMS_PER_PAGE = 4;

// const upcoming = () => {
//     const { user, setAuth } = useAuth();
//     const router = useRouter();
//     const [activeTab, setActiveTab] = useState('upcoming');

//     // Releases state
//     const [releases, setReleases] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [hasMore, setHasMore] = useState(true);
//     const [page, setPage] = useState(1);

//     // OTT state
//     const [otts, setOtts] = useState([]);
//     const [ottLoading, setOttLoading] = useState(false);

//     // Handle real-time release updates
//     const handleReleaseEvent = (payload) => {
//         // Handle new release
//         if (payload.eventType === 'INSERT' && payload?.new?.id) {
//             setReleases(prevReleases => [payload.new, ...prevReleases]);
//         }
        
//         // Handle release deletion
//         if (payload.eventType === 'DELETE' && payload.old.id) {
//             setReleases(prevReleases => 
//                 prevReleases.filter(release => release.id !== payload.old.id)
//             );
//         }
        
//         // Handle release update
//         if (payload.eventType === 'UPDATE' && payload.new.id) {
//             setReleases(prevReleases => 
//                 prevReleases.map(release => 
//                     release.id === payload.new.id ? payload.new : release
//                 )
//             );
//         }
//     };

//     // Handle real-time OTT updates
//     const handleOttEvent = (payload) => {
//         // Handle new OTT
//         if (payload.eventType === 'INSERT' && payload?.new?.id) {
//             setOtts(prevOtts => [payload.new, ...prevOtts]);
//         }
        
//         // Handle OTT deletion
//         if (payload.eventType === 'DELETE' && payload.old.id) {
//             setOtts(prevOtts => 
//                 prevOtts.filter(ott => ott.id !== payload.old.id)
//             );
//         }
        
//         // Handle OTT update
//         if (payload.eventType === 'UPDATE' && payload.new.id) {
//             setOtts(prevOtts => 
//                 prevOtts.map(ott => 
//                     ott.id === payload.new.id ? payload.new : ott
//                 )
//             );
//         }
//     };

//     // Set up Supabase real-time subscriptions
//     useEffect(() => {
//         const releaseChannel = supabase
//             .channel('releases')
//             .on('postgres_changes',
//                 { event: '*', schema: 'public', table: 'releases' },
//                 handleReleaseEvent
//             )
//             .subscribe();

//         const ottChannel = supabase
//             .channel('streams')
//             .on('postgres_changes',
//                 { event: '*', schema: 'public', table: 'streams' },
//                 handleOttEvent
//             )
//             .subscribe();

//         // Initial data fetch
//         getReleases();
//         getOtts();

//         return () => {
//             supabase.removeChannel(releaseChannel);
//             supabase.removeChannel(ottChannel);
//         };
//     }, []);

//     // Fetch releases with pagination
//     const getReleases = async () => {
//         if (loading || !hasMore) return;
        
//         try {
//             setLoading(true);
//             const res = await fetchReleases(page * ITEMS_PER_PAGE);
            
//             if (res.success) {
//                 // Check if we've reached the end
//                 if (res.data.length === releases.length) {
//                     setHasMore(false);
//                 }
                
//                 // Append new releases, avoiding duplicates
//                 setReleases(prevReleases => {
//                     const newReleases = res.data.filter(
//                         newRelease => !prevReleases.some(
//                             existingRelease => existingRelease.id === newRelease.id
//                         )
//                     );
//                     return [...prevReleases, ...newReleases];
//                 });
                
//                 setPage(prev => prev + 1);
//             } else {
//                 Alert.alert('Error', 'Failed to fetch releases');
//             }
//         } catch (error) {
//             console.error('Error fetching releases:', error);
//             Alert.alert('Error', 'Something went wrong while fetching releases');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Fetch OTT platforms
//     const getOtts = async () => {
//         try {
//             setOttLoading(true);
//             const res = await fetchOtt();
//             if (res.success) {
//                 setOtts(res.data);
//             } else {
//                 Alert.alert('Error', 'Failed to fetch OTT platforms');
//             }
//         } catch (error) {
//             console.error('Error fetching OTT platforms:', error);
//             Alert.alert('Error', 'Something went wrong while fetching OTT platforms');
//         } finally {
//             setOttLoading(false);
//         }
//     };

//     const handleTabPress = (tabName) => {
//         if (tabName !== activeTab) {
//             // Vibrate for 20ms when switching tabs
//             Vibration.vibrate(200);
//             setActiveTab(tabName);
//         }
//     };

//     const TabBar = () => (
//         <View style={styles.tabContainer}>
//             <TouchableOpacity 
//                 style={[
//                     styles.tab, 
//                     activeTab === 'ott' && styles.activeTab
//                 ]}
//                 onPress={() => handleTabPress('ott')}
//             >
//                 <Text style={[
//                     styles.tabText,
//                     activeTab === 'ott' && styles.activeTabText
//                 ]}>OOOO</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//                 style={[
//                     styles.tab, 
//                     activeTab === 'upcoming' && styles.activeTab
//                 ]}
//                 onPress={() => handleTabPress('upcoming')}
//             >
//                 <Text style={[
//                     styles.tabText,
//                     activeTab === 'upcoming' && styles.activeTabText
//                 ]}>TTTTT</Text>
//             </TouchableOpacity>
//         </View>
//     );


//     const renderContent = () => {
//         if (activeTab === 'ott') {
//             return (
//                 <View>
//                 {/* streams */}
//                 <OttList
//                   streams={otts}
//                   currentUser={user}     
//                   router={router}
//                />
               
//             </View>
//             );
//         }
//         return (
//             <View>
//                 {/* releases rendering */}
//                <ReleaseList
//                   releases={releases}
//                   currentUser={user}     
//                   router={router}
//                />
//             </View>
//         );
//     };

//     return (
//         <ScreenWrapper bg="white">
//             <TabBar />
//             {renderContent()}
//         </ScreenWrapper>
//     );
// };

// const styles = StyleSheet.create({
//     tabContainer: {
//         flexDirection: 'row',
//         backgroundColor: '#cfd6e3',
//         padding: 6,
//         marginHorizontal: 14,
//         marginTop: 8,
//         borderRadius: 8,
//     },
//     tab: {
//         flex: 1,
//         paddingVertical: 12,
//         alignItems: 'center',
//         borderRadius: 6,
//     },
//     activeTab: {
//         backgroundColor: '#ffffff',
//         shadowColor: '#000',
//         shadowOffset: {
//             width: 0,
//             height: 2,
//         },
//         shadowOpacity: 0.1,
//         shadowRadius: 3,
//         elevation: 3,
//     },
//     tabText: {
//         fontSize: 16,
//         color: '#666',
//     },
//     activeTabText: {
//         color: '#000',
//         fontWeight: '600',
//     },
//     contentContainer: {
//         flex: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingTop: 80,
//     },
//     listStyle: {
//         padding: 10, 
//         paddingHorizontal: wp(4)
//     }
// });

// export default upcoming;










































































































































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

const ITEMS_PER_PAGE = 3;

const upcoming = () => {
    const { user, setAuth } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('ott');

    // Releases state
    // const [releases, setReleases] = useState([]);
    // const [loading, setLoading] = useState(false);
    // const [hasMore, setHasMore] = useState(true);
    // const [page, setPage] = useState(1);

    const [releases, setReleases] = useState([]);
    const [releasesLoading, setReleasesLoading] = useState(false);
    const [hasMoreReleases, setHasMoreReleases] = useState(true);
    const [releasesPage, setReleasesPage] = useState(1);

    // // OTT state
    // const [otts, setOtts] = useState([]);
    // const [ottLoading, setOttLoading] = useState(false);

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
                ]}>THEATRE</Text>
            </TouchableOpacity>
        </View>
    );


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