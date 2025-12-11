import React, { useEffect, useState, useMemo } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Vibration, Pressable, Modal } from 'react-native';
import { fetchReleases } from '../../services/releaseService';
import { wp, hp } from '@/helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { fetchOtt } from '../../services/ottService'; 
import { fetchSeries } from '../../services/seriesService';
import ReleaseList from '../../components/ReleaseList';
import OttList from '../../components/OttList';
import { supabase } from '../../lib/supabase';
import { NetworkUtils } from '../../utils/network';
import theme from '../../constants/theme';
import Icon from '../../assets/icons';
import { useToast } from '../../contexts/ToastContext';

const ITEMS_PER_PAGE = 30;

const upcoming = () => {
    const { user, setAuth } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [digitalSubTab, setDigitalSubTab] = useState('ALL'); // New state for digital sub-tabs
    const [showFilterModal, setShowFilterModal] = useState(false);

    const [releases, setReleases] = useState([]);
    const [releasesLoading, setReleasesLoading] = useState(false);
    const [hasMoreReleases, setHasMoreReleases] = useState(true);
    const [releasesPage, setReleasesPage] = useState(1);

       // OTT state
       const [otts, setOtts] = useState([]);
       const [ottsLoading, setOttsLoading] = useState(false);
       const [hasMoreOtts, setHasMoreOtts] = useState(true);
       const [ottsPage, setOttsPage] = useState(1);
       
       // Series state
       const [series, setSeries] = useState([]);
       const [seriesLoading, setSeriesLoading] = useState(false);
       const [hasMoreSeries, setHasMoreSeries] = useState(true);
       const [seriesPage, setSeriesPage] = useState(1);
       
       const [isConnected, setIsConnected] = useState(true);
       const [initialCheckDone, setInitialCheckDone] = useState(false);
       const [offlineMode, setOfflineMode] = useState(false);
       const { showToast } = useToast();

       // Check network status on mount
        useEffect(() => {
            const checkNetworkStatus = async () => {
                const connected = await NetworkUtils.isConnected();
                setIsConnected(connected);
                setOfflineMode(!connected);
                setInitialCheckDone(true);
            };
            
            checkNetworkStatus();
            
            // Set up network listener
            const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
                setIsConnected(connected);
                setOfflineMode(!connected);
                setInitialCheckDone(true);
            });
            
            return () => unsubscribe();
        }, []);

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

    // Handle real-time series updates
    const handleSeriesEvent = (payload) => {
        // Handle new series
        if (payload.eventType === 'INSERT' && payload?.new?.id) {
            // Fetch full series data with images and episodes
            fetchSeries(100).then(res => {
                if (res.success && res.data) {
                    const newSeries = res.data.find(s => s.id === payload.new.id);
                    if (newSeries) {
                        setSeries(prevSeries => [newSeries, ...prevSeries]);
                    }
                }
            });
        }
        
        // Handle series deletion
        if (payload.eventType === 'DELETE' && payload.old.id) {
            setSeries(prevSeries => 
                prevSeries.filter(s => s.id !== payload.old.id)
            );
        }
        
        // Handle series update
        if (payload.eventType === 'UPDATE' && payload.new.id) {
            // Fetch full series data
            fetchSeries(100).then(res => {
                if (res.success && res.data) {
                    const updatedSeries = res.data.find(s => s.id === payload.new.id);
                    if (updatedSeries) {
                        setSeries(prevSeries => 
                            prevSeries.map(s => 
                                s.id === updatedSeries.id ? updatedSeries : s
                            )
                        );
                    }
                }
            });
        }
    };

    // Set up Supabase real-time subscriptions
    // Set up Supabase real-time subscriptions
useEffect(() => {
    // Only subscribe when online
    if (isConnected) {
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

        const seriesChannel = supabase
            .channel('series')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'series' },
                handleSeriesEvent
            )
            .subscribe();

        // Initial data fetch
        getReleases();
        getOtts();
        getSeries();

        return () => {
            supabase.removeChannel(releaseChannel);
            supabase.removeChannel(ottChannel);
            supabase.removeChannel(seriesChannel);
        };
    } else if (initialCheckDone) {
        // When offline but initial check is done, try to use cached data
        console.log('Device is offline - using cached data if available');
    }
}, [isConnected, initialCheckDone]);

// Fetch releases with pagination
const getReleases = async () => {
    if (releasesLoading || !hasMoreReleases) return;

      // Skip fetch if offline
      if (!isConnected) {
        console.log('Skipping fetch - device is offline');
        return;
    }
    
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
            showToast('success', 'Failed to fetch releases - Network Problem');
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

      // Skip fetch if offline
      if (!isConnected) {
        console.log('Skipping fetch - device is offline');
        return;
      }
    
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
            showToast('error', 'Failed to fetch OTT platforms!! - Network Problem');
        }
    } catch (error) {
        console.error('Error fetching OTT platforms:', error);
        Alert.alert('Error', 'Something went wrong while fetching OTT platforms');
    } finally {
        setOttsLoading(false);
    }
};

// Fetch series with pagination
const getSeries = async () => {
    if (seriesLoading || !hasMoreSeries) return;

    // Skip fetch if offline
    if (!isConnected) {
        console.log('Skipping series fetch - device is offline');
        return;
    }
    
    try {
        setSeriesLoading(true);
        const res = await fetchSeries(seriesPage * ITEMS_PER_PAGE);
        
        if (res.success) {
            if (res.data.length === series.length) {
                setHasMoreSeries(false);
            }
            
            setSeries(prevSeries => {
                const newSeries = res.data.filter(
                    newSer => !prevSeries.some(
                        existingSer => existingSer.id === newSer.id
                    )
                );
                return [...prevSeries, ...newSeries];
            });
            
            setSeriesPage(prev => prev + 1);
        } else {
            console.error('Failed to fetch series:', res.msg);
        }
    } catch (error) {
        console.error('Error fetching series:', error);
    } finally {
        setSeriesLoading(false);
    }
};

    const handleTabPress = (tabName) => {
        if (tabName !== activeTab) {
            Vibration.vibrate(200);
            setActiveTab(tabName);
            // Reset digital sub-tab when switching to DIGITAL tab
            if (tabName === 'ott') {
                setDigitalSubTab('ALL');
            }
        }
    };

    const handleDigitalSubTabPress = (subTabName) => {
        if (subTabName !== digitalSubTab) {
            Vibration.vibrate(100);
            setDigitalSubTab(subTabName);
        }
    };

    // Transform series data to match OTT format for display
    const transformSeriesToOttFormat = useMemo(() => {
        return series.map(ser => {
            // Get first image as main poster (for list view)
            const firstImage = ser.images && ser.images.length > 0 
                ? ser.images[0].image_path 
                : null;
            
            // Get tile_image for grid view (filel), fallback to first poster if no tile_image
            const tileImage = ser.tile_image || firstImage;
            
            // Get first episode release date or series created date
            const firstEpisode = ser.episodes && ser.episodes.length > 0
                ? ser.episodes[0]
                : null;
            const releaseDate = firstEpisode?.release_date || ser.created_at;
            
            // Format series name as HTML body
            const bodyHtml = `<div><p>${ser.name || ''}</p></div>`;
            
            return {
                id: `series_${ser.id}`, // Prefix to distinguish from OTT items
                originalId: ser.id,
                isSeries: true, // Flag to identify as series
                body: bodyHtml,
                file: firstImage, // Poster image for list view
                filel: tileImage, // Tile image for grid view
                rDate: releaseDate,
                endDate: null,
                tags: ['series'], // Default tag for series
                genre: ser.genre,
                description: ser.description,
                seriesData: ser, // Keep original series data
            };
        });
    }, [series]);

    // Filter and merge otts and series based on selected digital sub-tab
    const filteredOtts = useMemo(() => {
        let allItems = [];
        
        if (digitalSubTab === 'FILM') {
            // Show only films (OTT items that are not series, exclude all series)
            const films = otts.filter(ott => {
                // Check if item has tags that indicate type
                let tags = [];
                try {
                    tags = ott.tags ? (Array.isArray(ott.tags) ? ott.tags : JSON.parse(ott.tags)) : [];
                } catch (e) {
                    tags = [];
                }
                
                const tagsString = Array.isArray(tags) ? tags.join(',').toLowerCase() : String(tags).toLowerCase();
                const bodyText = (ott.body || '').toLowerCase();
                
                // Filter for films - exclude items with series/show indicators
                const isSeries = tagsString.includes('series') || 
                                tagsString.includes('show') ||
                                bodyText.includes('series') ||
                                bodyText.includes('season') ||
                                bodyText.includes('episode');
                return !isSeries;
            });
            allItems = films;
        } else if (digitalSubTab === 'SERIES') {
            // Show only series (both from series table and OTT items tagged as series)
            const ottSeries = otts.filter(ott => {
                let tags = [];
                try {
                    tags = ott.tags ? (Array.isArray(ott.tags) ? ott.tags : JSON.parse(ott.tags)) : [];
                } catch (e) {
                    tags = [];
                }
                
                const tagsString = Array.isArray(tags) ? tags.join(',').toLowerCase() : String(tags).toLowerCase();
                const bodyText = (ott.body || '').toLowerCase();
                
                const isSeries = tagsString.includes('series') || 
                                tagsString.includes('show') ||
                                bodyText.includes('series') ||
                                bodyText.includes('season') ||
                                bodyText.includes('episode');
                return isSeries;
            });
            
            // Include transformed series data
            allItems = [...ottSeries, ...transformSeriesToOttFormat];
        } else if (digitalSubTab === 'ALL') {
            // Show both films and series together
            const films = otts.filter(ott => {
                let tags = [];
                try {
                    tags = ott.tags ? (Array.isArray(ott.tags) ? ott.tags : JSON.parse(ott.tags)) : [];
                } catch (e) {
                    tags = [];
                }
                
                const tagsString = Array.isArray(tags) ? tags.join(',').toLowerCase() : String(tags).toLowerCase();
                const bodyText = (ott.body || '').toLowerCase();
                
                const isSeries = tagsString.includes('series') || 
                                tagsString.includes('show') ||
                                bodyText.includes('series') ||
                                bodyText.includes('season') ||
                                bodyText.includes('episode');
                return !isSeries;
            });
            
            const ottSeries = otts.filter(ott => {
                let tags = [];
                try {
                    tags = ott.tags ? (Array.isArray(ott.tags) ? ott.tags : JSON.parse(ott.tags)) : [];
                } catch (e) {
                    tags = [];
                }
                
                const tagsString = Array.isArray(tags) ? tags.join(',').toLowerCase() : String(tags).toLowerCase();
                const bodyText = (ott.body || '').toLowerCase();
                
                const isSeries = tagsString.includes('series') || 
                                tagsString.includes('show') ||
                                bodyText.includes('series') ||
                                bodyText.includes('season') ||
                                bodyText.includes('episode');
                return isSeries;
            });
            
            // Include both films, OTT series, and transformed series data
            allItems = [...films, ...ottSeries, ...transformSeriesToOttFormat];
        }
        
        // Sort by release date (most recent first)
        return allItems.sort((a, b) => {
            const dateA = a.rDate ? new Date(a.rDate).getTime() : 0;
            const dateB = b.rDate ? new Date(b.rDate).getTime() : 0;
            return dateB - dateA;
        });
    }, [otts, transformSeriesToOttFormat, digitalSubTab]);

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
            if (!isConnected && otts.length === 0 && series.length === 0) {
                return (
                    <View style={styles.contentContainer}>
                        {/* <Text style={{ color: '#FFFFFF' }}>
                            You're offline. Connect to the internet to see digital releases.
                        </Text> */}
                           <Icon
                                name="noicon"
                                size={hp(10.5)} 
                                color="white" 
                            />
                            <Text style={styles.offlineTextx}>You're offline</Text>
                        <Text style={styles.offlineSubText}>
                            Connect to the internet to see the digital's
                        </Text>
                    </View>
                );
            }
            return (
                <View>
                    <OttList
                        streams={filteredOtts}
                        currentUser={user}
                        router={router}
                        loading={ottsLoading || seriesLoading}
                        hasMore={(hasMoreOtts || hasMoreSeries) && isConnected}
                        onLoadMore={() => {
                            if (digitalSubTab === 'FILM') {
                                getOtts();
                            } else if (digitalSubTab === 'SERIES') {
                                getSeries();
                            } else if (digitalSubTab === 'ALL') {
                                // Load both when ALL is selected
                                getOtts();
                                getSeries();
                            }
                        }}
                        onFilterPress={() => setShowFilterModal(true)}
                        filterLabel={digitalSubTab}
                        onDelete={(itemId, seriesId) => {
                            // Remove from appropriate list based on whether it's a series or digital
                            if (seriesId) {
                                // It's a series
                                setSeries(prevSeries => 
                                    prevSeries.filter(s => s.id !== seriesId)
                                );
                            } else {
                                // It's a digital (stream)
                                setOtts(prevOtts => 
                                    prevOtts.filter(ott => ott.id !== itemId)
                                );
                            }
                        }}
                    />
                    
                    {/* Filter Modal */}
                    <Modal
                        visible={showFilterModal}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowFilterModal(false)}
                    >
                        <Pressable 
                            style={styles.modalOverlay}
                            onPress={() => setShowFilterModal(false)}
                        >
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Filter by Type</Text>
                                <Pressable 
                                    style={[
                                        styles.filterOption,
                                        digitalSubTab === 'ALL' && styles.filterOptionActive
                                    ]}
                                    onPress={() => {
                                        handleDigitalSubTabPress('ALL');
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        digitalSubTab === 'ALL' && styles.filterOptionTextActive
                                    ]}>ALL</Text>
                                    {digitalSubTab === 'ALL' && (
                                        <Icon name="check" size={hp(2)} color={theme.colors.primary} />
                                    )}
                                </Pressable>
                                <Pressable 
                                    style={[
                                        styles.filterOption,
                                        digitalSubTab === 'FILM' && styles.filterOptionActive
                                    ]}
                                    onPress={() => {
                                        handleDigitalSubTabPress('FILM');
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        digitalSubTab === 'FILM' && styles.filterOptionTextActive
                                    ]}>FILM</Text>
                                    {digitalSubTab === 'FILM' && (
                                        <Icon name="check" size={hp(2)} color={theme.colors.primary} />
                                    )}
                                </Pressable>
                                <Pressable 
                                    style={[
                                        styles.filterOption,
                                        digitalSubTab === 'SERIES' && styles.filterOptionActive
                                    ]}
                                    onPress={() => {
                                        handleDigitalSubTabPress('SERIES');
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        digitalSubTab === 'SERIES' && styles.filterOptionTextActive
                                    ]}>SERIES</Text>
                                    {digitalSubTab === 'SERIES' && (
                                        <Icon name="check" size={hp(2)} color={theme.colors.primary} />
                                    )}
                                </Pressable>
                            </View>
                        </Pressable>
                    </Modal>
                </View>
            );
        }
        
        if (!isConnected && releases.length === 0) {
            return (
                <View style={styles.contentContainer}>
                      <Icon
                                name="noicon"
                                size={hp(10.5)} 
                                color="white" 
                            />
                            <Text style={styles.offlineTextx}>You're offline</Text>
                        <Text style={styles.offlineSubText}>
                            Connect to the internet to see film releases
                        </Text>
                </View>
            );
        }
        
        return (
            <View>
                <ReleaseList
                    releases={releases}
                    currentUser={user}
                    router={router}
                    loading={releasesLoading}
                    hasMore={hasMoreReleases && isConnected}
                    onLoadMore={getReleases}
                    onDelete={(releaseId) => {
                        setReleases(prevReleases => 
                            prevReleases.filter(release => release.id !== releaseId)
                        );
                    }}
                />
            </View>
        );
    };

    // bg={"#121212"}
    return (
        <ScreenWrapper bg="black">
             {/* Offline Mode Indicator */}
             {offlineMode && (
                    <View style={styles.offlineBar}>
                        <Text style={styles.offlineText}>Offline Mode - Network Unavailable</Text>
                    </View>
              )}
            <TabBar />
            {renderContent()}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
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
    },
    offlineBar: {
        padding: hp(1),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.text, // Using your theme color from example
    },
    offlineText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: hp(1.4),
    },
    offlineContainer: {
        flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       minHeight: 300,
     },
     offlineImage: {
       width: wp(50),
       height: wp(50),
       marginBottom: hp(2),
     },
     offlineTextx: {
       fontSize: 20,
       fontWeight: 'bold',
       color: 'white',
       marginBottom: hp(1),
     },
     offlineSubText: {
       fontSize: 14,
       color: '#666',
       textAlign: 'center',
       paddingHorizontal: wp(10),
     },
     modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
     },
     modalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: theme.radius.md,
        padding: wp(5),
        minWidth: wp(60),
        borderWidth: 1,
        borderColor: '#333333',
     },
     modalTitle: {
        color: '#FFFFFF',
        fontSize: hp(2.2),
        fontWeight: 'bold',
        marginBottom: hp(2),
     },
     filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(3),
        borderRadius: theme.radius.sm,
        marginBottom: hp(1),
     },
     filterOptionActive: {
        backgroundColor: '#2D2D2D',
     },
     filterOptionText: {
        color: '#CCCCCC',
        fontSize: hp(1.9),
        fontWeight: '500',
     },
     filterOptionTextActive: {
        color: theme.colors.primary,
        fontWeight: '600',
     },
});

export default upcoming;