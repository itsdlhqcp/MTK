import { Text, View, Image, StyleSheet, Dimensions, TouchableOpacity, StatusBar, ScrollView, Animated } from 'react-native'
import React, { useRef, useEffect, useState } from 'react'
import { wp, hp } from '@/helpers/common'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import theme from '../constants/theme';
import Icon from '@/assets/icons'

const OnboardingGrid = () => {
    const router = useRouter();
    const scrollViewRef = useRef(null);
    const [scrolling, setScrolling] = useState(true);
    
    // Animation states for icon transformation
    const [currentState, setCurrentState] = useState(0); // 0: delete, 1: user
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const gridImages = [
        {
            id: 1,
            name: 'BLINDER',
            source: require('../assets/on/1734765720792BLINDER.jpg')
        },
        {
            id: 2,
            name: 'KIRATA',
            source: require('../assets/on/1734765720795KIRATA.jpg')
        },
        {
            id: 3,
            name: 'SHAP',
            source: require('../assets/on/1734765720795SHAP.jpg')
        },
        {
            id: 4,
            name: 'HERITIC',
            source: require('../assets/on/1734765720795HERITIC.jpg')
        },
        {
            id: 5,
            name: 'spy',
            source: require('../assets/on/1734767810179SPY.jpg')
        },
        {
          id: 6,
          name: 'sonic',
          source: require('../assets/on/1734767810180SONIC.jpg')
      },
      {
        id: 7,
        name: 'kraven',
        source: require('../assets/on/1734768273687kraven.jpg')
    },
        {
        id: 8,
        name: 'thelionKing',
        source: require('../assets/on/1734768273687lionKing.jpg')
    },
    {
        id: 9,
        name: 'thelionKing',
        source: require('../assets/on/1734768273687lastofus.jpg')
    },
    {
    id: 10,
    name: 'michael',
    source: require('../assets/on/1734768340051michael.jpg')
    },
    {
    id: 11,
    name: 'michael',
    source: require('../assets/on/1734765720795SUPER.jpg')
    },
    {
    id: 12,
    name: 'michael',
    source: require('../assets/on/1734768340051pushpa2.jpg')
    },
    {
    id: 13,
    name: 'michael',
    source: require('../assets/on/1734768340051mura.jpg')
    },
    {
    id: 14,
    name: 'michael',
    source: require('../assets/on/1734768273687fromToday.jpg')
    },
    {
    id: 15,
    name: 'michael',
    source: require('../assets/on/1734769177738redone.jpg')
    },
    {
    id: 16,
    name: 'michael',
    source: require('../assets/on/1734767810180SONIC.jpg')
    },
    {
        id: 17,
        name: 'sonic',
        source: require('../assets/on/1734768273687lastofus.jpg')
    },
    {
    id: 18,
    name: 'kraven',
    source: require('../assets/on/1734768273687kraven.jpg')
    },
    {
    id: 19,
    name: 'thelionKing',
    source: require('../assets/on/1734768273687lionKing.jpg')
    },
    {
    id: 20,
    name: 'thelionKing',
    source: require('../assets/on/1734768273687lastofus.jpg')
    },
    ];

    // Icon transformation states
    const iconStates = [
        { iconName: 'notsqr', text: 'Get Instant Updates', color: '#FFFFFF' },
        { iconName: 'calender', text: 'Track New Movies', color: '#FFFFFF' },
        { iconName: 'star', text: 'Get Fastest Ratings', color: '#FFFFFF' },
    ];

    // Preload all images to reduce latency
    useEffect(() => {
        const preloadImages = async () => {
            try {
                const imagePromises = gridImages.map((item) => {
                    try {
                        const resolvedSource = Image.resolveAssetSource(item.source);
                        // For local images, prefetch the resolved URI
                        if (resolvedSource?.uri) {
                            return Image.prefetch(resolvedSource.uri).catch(() => {
                                // Silently ignore prefetch errors - local images are already bundled
                                return Promise.resolve();
                            });
                        }
                    } catch (error) {
                        // Ignore resolution errors
                    }
                    return Promise.resolve();
                });
                // Prefetch all images in parallel for faster loading
                await Promise.allSettled(imagePromises);
            } catch (error) {
                // Ignore prefetch errors - images will still load normally
            }
        };
        // Start preloading immediately when component mounts
        preloadImages();
    }, []);

    // Auto transformation effect
    useEffect(() => {
        const transformInterval = setInterval(() => {
            // Start fade out and scale down
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 1000, // 1 second fade out
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ]).start(() => {
                // Change state in the middle of animation
                setCurrentState(prev => (prev + 1) % iconStates.length);
                
                // Fade in and scale up
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 1000, // 1 second fade in
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    })
                ]).start();
            });
        }, 4000); // Change every 4 seconds (2 seconds animation + 2 seconds display)

        return () => clearInterval(transformInterval);
    }, []);

    // Calculate the height of the content to determine when to reset scrolling
    const [contentHeight, setContentHeight] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [scrollPosition, setScrollPosition] = useState(0);
    
    // NEW: Add direction state and scroll boundaries
    const [scrollDirection, setScrollDirection] = useState('up'); // 'up' or 'down'
    const [scrollBoundaries, setScrollBoundaries] = useState({
        top: 0,
        bottom: 0,
        changePoint: 0
    });

    // NEW: Calculate scroll boundaries when content dimensions are available
    useEffect(() => {
        if (contentHeight && viewportHeight) {
            const maxScrollPosition = contentHeight - viewportHeight;
            const changePoint = maxScrollPosition * 0.7; // Change direction at 70% of max scroll
            
            setScrollBoundaries({
                top: 0,
                bottom: maxScrollPosition,
                changePoint: changePoint
            });
        }
    }, [contentHeight, viewportHeight]);

    // MODIFIED: Auto-scrolling effect with bidirectional movement
    useEffect(() => {
        if (!contentHeight || !viewportHeight || !scrollBoundaries.changePoint) return;
        
        let animationFrame;
        const speed = 1.5; // Adjust speed as needed (lower is slower)
        
        const autoScroll = () => {
            if (scrollViewRef.current && scrolling) {
                let newPosition = scrollPosition;
                
                // Determine scroll direction and calculate new position
                if (scrollDirection === 'up') {
                    newPosition = scrollPosition + speed;
                    
                    // Check if we've reached the change point (scroll up limit)
                    if (newPosition >= scrollBoundaries.changePoint) {
                        setScrollDirection('down');
                        newPosition = scrollBoundaries.changePoint;
                    }
                } else { // scrollDirection === 'down'
                    newPosition = scrollPosition - speed;
                    
                    // Check if we've reached the top (scroll down limit)
                    if (newPosition <= scrollBoundaries.top) {
                        setScrollDirection('up');
                        newPosition = scrollBoundaries.top;
                    }
                }
                
                // Ensure position stays within bounds
                newPosition = Math.max(scrollBoundaries.top, Math.min(scrollBoundaries.bottom, newPosition));
                
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
    }, [scrolling, contentHeight, viewportHeight, scrollPosition, scrollDirection, scrollBoundaries]);

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
        setScrolling(false); // Pause scrolling on touch
    };
    
    const handleTouchEnd = () => {
        // Resume scrolling after a short delay
        setTimeout(() => {
            setScrolling(true);
        }, 1000);
    };

    const handleScroll = (event) => {
        const { y } = event.nativeEvent.contentOffset;
        setScrollPosition(y);
    };
    // At the top of your file
const logo = require('../assets/images/appicontrans.png'); // adjust path as needed


    // Colors matching the login page
    const colors = {
        red: '#E50914',
        darkRed: '#8B0000',
        blue: '#0066B1',
        darkBlue: '#00284D',
        darkBackground: '#0A0A0A',
        gradientStart: '#00284D',
        gradientMiddle: '#141414',
        gradientEnd: '#8B0000',
        lightText: '#e0e0e0',
    };

    // MODIFIED: Remove duplication since we're not doing circular scrolling
    // Instead, we'll use the original array with some additional items for smooth scrolling
    const extendedContent = [...gridImages, ...gridImages.slice(0, Math.min(8, gridImages.length))];

    const currentIconState = iconStates[currentState];

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

             {/* TV TIME Header */}
             <View style={styles.headerContainer}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                    <Image source={logo} style={styles.logoImage} resizeMode="contain" />
                    </View>
                    <Text style={styles.logoText}>PlotTwist</Text>
                </View>
                </View>

            
            <View style={styles.container} onLayout={onLayout}>
                {/* Blurred Grid Container */}
                <BlurView intensity={25} style={styles.blurContainer}>
                    <ScrollView 
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        scrollEventThrottle={64}
                        scrollEnabled={false}  // Disable manual scrolling
                        // onTouchStart={handleTouchStart}
                        // onTouchEnd={handleTouchEnd}
                        onScroll={handleScroll}
                        onContentSizeChange={onContentSizeChange}
                        style={styles.scrollView}
                    >
                        <View style={styles.gridContainer}>
                            {extendedContent.map((item, index) => (
                                <TouchableOpacity 
                                    key={`${item.id}-${index}`} 
                                    style={styles.gridItem}
                                    onPress={() => console.log(`Pressed ${item.name}`)}
                                >
                                    <Image
                                        source={item.source}
                                        style={styles.image}
                                        resizeMode="cover"
                                        progressiveRenderingEnabled={true}
                                        fadeDuration={200}
                                    />
                                    {/* Additional blur overlay on individual images */}
                                    <View style={styles.imageOverlay} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </BlurView>
                
                {/* Centered Icon and Text Component */}
                <View style={styles.centeredIconContainer}>
                    <Animated.View 
                        style={[
                            styles.iconTextWrapper,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        <View style={styles.iconBackground}>
                            <Icon 
                                name={currentIconState.iconName} 
                                size={44} 
                                color={currentIconState.color} 
                            />
                        </View>
                        <Text style={[styles.iconText, { color: currentIconState.color }]}>
                            {currentIconState.text}
                        </Text>
                    </Animated.View>
                </View>
                
                {/* Overlay Button */}
                <View style={styles.buttonContainer}>    
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={() => router.push('signup')}
                    >
                        <Text style={styles.buttonText}>Sign Up / Login In</Text>
                    </TouchableOpacity>
                </View>

                {/* NEW: Debug info (remove in production) */}
                {/* {__DEV__ && (
                    <View style={styles.debugContainer}>
                        <Text style={styles.debugText}>
                            Direction: {scrollDirection} | Position: {Math.round(scrollPosition)} | 
                            Change Point: {Math.round(scrollBoundaries.changePoint)} | 
                            Icon: {currentIconState.iconName}
                        </Text>
                    </View>
                )} */}
            </View>
        </View>
    );
};

export default OnboardingGrid;

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_COUNT = 4;
const SPACING = 0;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#0A0A0A', // Dark fallback background
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
    // NEW: Blur container styles
    blurContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Additional dark overlay
    },
    scrollView: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: SPACING,
    },
    gridItem: {
        width: (SCREEN_WIDTH - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT,
        aspectRatio: 0.655,
        marginBottom: SPACING,
        marginRight: SPACING,
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
        opacity: 0.7,
    },
    // NEW: Image overlay for additional blur effect
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Semi-transparent overlay
        borderRadius: 0,
    },
    // Centered Icon and Text Styles
    centeredIconContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10, // Increased z-index to ensure it's above blur
        pointerEvents: 'none', // Allow touches to pass through to the scroll view
    },
    iconTextWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
        paddingHorizontal: 40,
    },
    iconBackground: {
        width: 86,
        height: 86,
        borderRadius: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker background for better contrast
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.4)', // Slightly more visible border
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.7, // Increased shadow opacity
        shadowRadius: 12, // Increased shadow radius
        elevation: 15, // Increased elevation
    },
    iconText: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 2, height: 2 }, // Increased text shadow
        textShadowRadius: 6, // Increased text shadow radius
        letterSpacing: 1,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        zIndex: 10, // Increased z-index
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: theme.colors.red, 
        paddingVertical: 10, // Slightly increased padding
        paddingHorizontal: 28, // Slightly increased padding
        borderRadius: 26, 
        minWidth: 170,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6, // Increased shadow
        },
        shadowOpacity: 0.8, // Increased shadow opacity
        shadowRadius: 8, // Increased shadow radius
        elevation: 12, // Increased elevation
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '480',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // NEW: Debug styles (remove in production)
    debugContainer: {
        position: 'absolute',
        top: 50,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.8)', // Darker debug background
        padding: 8,
        borderRadius: 4,
        zIndex: 15,
    },
    debugText: {
        color: 'white',
        fontSize: 12,
        textAlign: 'center',
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 60, // Adjust based on your status bar height
        paddingBottom: 20,
        zIndex: 20,
        alignItems: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // logoIcon: {
    //     width: 40,
    //     height: 40,
    //     backgroundColor: 'red', // Golden yellow like in the image
    //     borderRadius: 8,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     marginRight: 12,
    //     shadowColor: '#000',
    //     shadowOffset: {
    //         width: 0,
    //         height: 2,
    //     },
    //     shadowOpacity: 0.3,
    //     shadowRadius: 4,
    //     elevation: 5,
    // },
    logoIconText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000000', // Black text on yellow background
        textAlign: 'center',
    },
    logoText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    logoImage: {
        width: 108,       // adjust size as needed
        height: 108,
        borderRadius: 8, // optional: to round corners
      }
      
});

