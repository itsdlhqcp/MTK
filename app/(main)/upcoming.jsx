// import React from 'react'
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { Text } from 'react-native';
// import { View } from 'react-native';

// const upcoming = () => {
    
//   return (
//     <ScreenWrapper bg={"white"}>
//          <Text>Upcoming HERE ----</Text>  
//          <View style={{aligncontent: 'center', justifContent: 'center',  paddingTop: 80}} >
//             <Text>Upcoming</Text>
//          </View>
//        </ScreenWrapper>
//   )
// }

// export default upcoming






// import React, { useState } from 'react';
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';

// const upcoming = () => {
//     const [activeTab, setActiveTab] = useState('upcoming');

//     const TabBar = () => (
//         <View style={styles.tabContainer}>
//             <TouchableOpacity 
//                 style={[
//                     styles.tab, 
//                     activeTab === 'ott' && styles.activeTab
//                 ]}
//                 onPress={() => setActiveTab('ott')}
//             >
//                 <Text style={[
//                     styles.tabText,
//                     activeTab === 'ott' && styles.activeTabText
//                 ]}>OTT</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//                 style={[
//                     styles.tab, 
//                     activeTab === 'upcoming' && styles.activeTab
//                 ]}
//                 onPress={() => setActiveTab('upcoming')}
//             >
//                 <Text style={[
//                     styles.tabText,
//                     activeTab === 'upcoming' && styles.activeTabText
//                 ]}>Upcoming</Text>
//             </TouchableOpacity>
//         </View>
//     );

//     const renderContent = () => {
//         if (activeTab === 'ott') {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text>OTT Content Here</Text>
//                 </View>
//             );
//         }
//         return (
//             <View style={styles.contentContainer}>
//                 <Text>Upcoming Content Here</Text>
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
//         backgroundColor: '#f5f5f5',
//         padding: 8,
//         marginHorizontal: 16,
//         marginTop: 16,
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
// });

// export default upcoming;




import React, { useState } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { Text, View, TouchableOpacity, StyleSheet, Vibration } from 'react-native';

const upcoming = () => {
    const [activeTab, setActiveTab] = useState('upcoming');

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
                <View style={styles.contentContainer}>
                    <Text>OTT Content Here</Text>
                </View>
            );
        }
        return (
            <View style={styles.contentContainer}>
                <Text>Upcoming Content Here</Text>
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
});

export default upcoming;