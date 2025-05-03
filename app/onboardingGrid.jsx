import { Text, View, Image, StyleSheet, Dimensions, TouchableOpacity, StatusBar, ScrollView } from 'react-native'
import React, { useRef, useEffect, useState } from 'react'
import { wp, hp } from '@/helpers/common'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

const OnboardingGrid = () => {
    const router = useRouter();
    const scrollViewRef = useRef(null);
    const [scrolling, setScrolling] = useState(true);
    
    const gridImages = [
        {
            id: 1,
            name: 'BLINDER',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720792BLINDER.jpg?alt=media&token=c0983db4-efc6-40bd-a0cd-f719b2a43c4c'
        },
        {
            id: 2,
            name: 'KIRATA',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720795KIRATA.jpg?alt=media&token=123ad8bc-b23f-4ab8-86f2-58623cb2c955'
        },
        {
            id: 3,
            name: 'SHAP',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720795SHAP.jpg?alt=media&token=b611e025-473d-4c29-a922-750ba8b1ed8d'
        },
        {
            id: 4,
            name: 'HERITIC',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720795HERITIC.jpg?alt=media&token=6640f5d5-6314-4f5d-98d6-ddb5ec04853a'
        },
        {
            id: 5,
            name: 'spy',
            url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734767810179SPY.jpg?alt=media&token=df81aa04-1eaa-4f4f-b918-b172f43f7fff'
        },
        {
          id: 6,
          name: 'sonic',
          url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734767810180SONIC.jpg?alt=media&token=f48181b4-1110-4040-8571-d403ad521e57'
      },
      {
        id: 7,
        name: 'kraven',
        url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687kraven.jpg?alt=media&token=000bad96-bdb5-4c5d-b5fc-816073f71477'
    },
    {
      id: 8,
      name: 'thelionKing',
      url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687lionKing.jpg?alt=media&token=f8fcce32-8062-403f-a1d4-6bc1a35871b2'
  },
  {
    id: 9,
    name: 'thelionKing',
    url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687lastofus.jpg?alt=media&token=0119a36d-7a17-4e83-b2db-cc1500cacd2a'
},
{
  id: 10,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768340051michael.jpg?alt=media&token=2e86a937-2b74-44a2-85f7-ec0ccbcccaf7'
},
{
  id: 11,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734765720795SUPER.jpg?alt=media&token=9af80502-9ab4-4dc8-a2f7-fe3468475c76'
},
{
  id: 12,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768340051pushpa2.jpg?alt=media&token=fc4460ed-b87a-42fd-996f-2b61d13f847a'
},
{
  id: 13,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768340051mura.jpg?alt=media&token=2eda53c6-c553-4d6a-ae98-98dff21a2df2'
},
{
  id: 14,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687fromToday.jpg?alt=media&token=9b388d46-15ef-4055-812b-3adc8aaca302'
},
{
  id: 15,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734769177738redone.jpg?alt=media&token=896a60cd-361b-4b15-9f25-83a4748fd564'
},
{
  id: 16,
  name: 'michael',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734769273312kaatta.jpg?alt=media&token=9e71711c-3f41-416b-b02e-597d56f474c1'
},
{
    id: 17,
    name: 'sonic',
    url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687lastofus.jpg?alt=media&token=0119a36d-7a17-4e83-b2db-cc1500cacd2a'
},
{
  id: 18,
  name: 'kraven',
  url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687kraven.jpg?alt=media&token=000bad96-bdb5-4c5d-b5fc-816073f71477'
},
{
id: 19,
name: 'thelionKing',
url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687lionKing.jpg?alt=media&token=f8fcce32-8062-403f-a1d4-6bc1a35871b2'
},
{
id: 20,
name: 'thelionKing',
url: 'https://firebasestorage.googleapis.com/v0/b/chat-web-app-46b89.appspot.com/o/chat%2F-OEc42DEriXDT_CajhEn%2F1734768273687lastofus.jpg?alt=media&token=0119a36d-7a17-4e83-b2db-cc1500cacd2a'
},
    ];

    // Calculate the height of the content to determine when to reset scrolling
    const [contentHeight, setContentHeight] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [scrollPosition, setScrollPosition] = useState(0);

    // Auto-scrolling effect with circular scrolling
    useEffect(() => {
        if (!contentHeight || !viewportHeight) return;
        
        let animationFrame;
        const speed = 0.7; // Adjust speed as needed (lower is slower)
        
        const autoScroll = () => {
            if (scrollViewRef.current && scrolling) {
                let newPosition = scrollPosition + speed;
                
                // Circular scrolling logic: when we reach the bottom, start showing top content again
                if (newPosition >= contentHeight - viewportHeight) {
                    // Add a small portion of the beginning content to the view
                    const visiblePortionAtBottom = newPosition - (contentHeight - viewportHeight);
                    newPosition = visiblePortionAtBottom;
                }
                
                setScrollPosition(newPosition);
                scrollViewRef.current.scrollTo({ y: newPosition, animated: false });
                animationFrame = requestAnimationFrame(autoScroll);
            }
        };
        
        // Start auto-scrolling
        animationFrame = requestAnimationFrame(autoScroll);
        
        // Clean up
        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [scrolling, contentHeight, viewportHeight, scrollPosition]);

    // Handle content size measurement
    const onContentSizeChange = (_, height) => {
        setContentHeight(height);
    };

    // Handle layout to get viewport height
    const onLayout = (event) => {
        const { height } = event.nativeEvent.layout;
        setViewportHeight(height);
    };

    // Handle touch events to pause/resume scrolling
    const handleTouchStart = () => {
        setScrolling(false);
    };
    
    const handleTouchEnd = () => {
        setScrolling(true);
    };

    const handleScroll = (event) => {
        const { y } = event.nativeEvent.contentOffset;
        setScrollPosition(y);
    };

    // Colors matching the login page
    const colors = {
        red: '#E50914',
        darkRed: '#8B0000',
        blue: '#0066B1',
        darkBlue: '#00284D',
        darkBackground: '#0A0A0A',
        gradientStart: '#00284D', // Dark blue shade
        gradientMiddle: '#141414', // Very dark gray/near black
        gradientEnd: '#8B0000', // Dark red shade
        lightText: '#e0e0e0',
    };

    // Create duplicated content for circular scrolling effect
    const duplicatedContent = [...gridImages, ...gridImages.slice(0, 8)];

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            
            {/* Main background gradient */}
            <LinearGradient
                colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <View style={styles.container} onLayout={onLayout}>
                <ScrollView 
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onScroll={handleScroll}
                    onContentSizeChange={onContentSizeChange}
                >
                    <View style={styles.gridContainer}>
                        {duplicatedContent.map((item, index) => (
                            <TouchableOpacity 
                                key={`${item.id}-${index}`} 
                                style={styles.gridItem}
                                onPress={() => console.log(`Pressed ${item.name}`)}
                            >
                                <Image
                                    source={{ uri: item.url }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
                
                {/* Overlay Button */}
                <View style={styles.buttonContainer}>    
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={() => router.push('signup')}
                    >
                        <Text style={styles.buttonText}>Let's Go &gt;&gt;&gt;</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_COUNT = 4;
const SPACING = 0;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    container: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: SPACING,
    },
    gridItem: {
        width: (SCREEN_WIDTH - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT,
        marginBottom: SPACING,
        marginRight: SPACING,
    },
    image: {
        width: '100%',
        aspectRatio: 0.515, // This creates the tall poster-like appearance
        borderRadius: 0,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        zIndex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: 'rgba(229, 9, 20, 0.8)', // Using the red color from login screen
        paddingVertical: 9,
        paddingHorizontal: 30,
        borderRadius: 25,
        minWidth: 150,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: '#e0e0e0',
        fontSize: 16,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 1,
    }
});

export default OnboardingGrid;