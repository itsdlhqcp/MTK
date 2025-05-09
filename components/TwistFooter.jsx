import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Animated, Alert, Dimensions } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import { hp, stripHtmlTags } from '../helpers/common';
import { createTwistLikes, removeTwistLikes, removeTwistUnlikes } from '../services/homeService';
import { getSupabaseFileUrl } from '../services/imageService';
import { useFocusEffect } from 'expo-router';
import { Image } from 'react-native';

// Get screen dimensions for positioning the popcorn pieces
const { width, height } = Dimensions.get("window");

// Individual popcorn kernel piece component
const PopcornKernel = ({ startPosition, onAnimationComplete }) => {
  // Random values for more natural movement
  const randomX = useRef(Math.random() * 100 - 50).current; // -50 to 50
  const randomY = useRef(-Math.random() * 120 - 30).current; // -30 to -150 (upward)
  const randomRotate = useRef(Math.random() * 720 - 360).current; // -360 to 360 degrees
  const randomScale = useRef(Math.random() * 0.4 + 0.3).current; // 0.3 to 0.7

  // Random kernel type (different shapes)
  const kernelType = useRef(Math.floor(Math.random() * 3)).current; // 0, 1, or 2

  // Random color variation (different shades of yellow/white)
  const colorVariants = ["#FFEB3B", "#FFF59D", "#FFFDE7", "#FFF176", "#FFEE58"];
  const kernelColor = useRef(colorVariants[Math.floor(Math.random() * colorVariants.length)]).current;

  // Animation values
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacity = useRef(new Animated.Value(0)).current; // Start invisible
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of animations: appear, float up, fade out
    Animated.sequence([
      // Pop in quickly
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: randomScale,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      // Float up and rotate
      Animated.parallel([
        Animated.timing(position, {
          toValue: { x: randomX, y: randomY },
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Fade out near the end
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(onAnimationComplete);
  }, []);

  // Convert rotation value to rotation string
  const rotateStr = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${randomRotate}deg`],
  });

  // Render different kernel shapes based on kernelType
  const renderKernel = () => {
    switch (kernelType) {
      case 0: // Round kernel
        return <View style={[kernelStyles.kernel, kernelStyles.roundKernel, { backgroundColor: kernelColor }]} />;
      case 1: // Oval kernel
        return <View style={[kernelStyles.kernel, kernelStyles.ovalKernel, { backgroundColor: kernelColor }]} />;
      case 2: // Irregular kernel
        return <View style={[kernelStyles.kernel, kernelStyles.irregularKernel, { backgroundColor: kernelColor }]} />;
      default:
        return <View style={[kernelStyles.kernel, kernelStyles.roundKernel, { backgroundColor: kernelColor }]} />;
    }
  };

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startPosition.x,
          top: startPosition.y,
          opacity,
          zIndex: 999,
          transform: [{ translateX: position.x }, { translateY: position.y }, { rotate: rotateStr }, { scale }],
        },
      ]}
    >
      {renderKernel()}
    </Animated.View>
  );
};

// Component for generating the poster view
const PosterView = React.forwardRef(({ item }, ref) => {
  return (
    <View ref={ref} style={posterStyles.container}>
      {/* Header with app branding */}
      <View style={posterStyles.header}>
        <Text style={posterStyles.appName}>PlotTwist</Text>
        <Text style={posterStyles.username}>@{item?.user?.name || 'user'}</Text>
      </View>

      {/* Content area */}
      <View style={posterStyles.content}>
        {/* Image if available */}
        {item?.file && (
          <Image 
            source={{ uri: getSupabaseFileUrl(item?.file).uri }} 
            style={posterStyles.image} 
            resizeMode="cover"
          />
        )}
        
        {/* Text content */}
        <Text style={posterStyles.bodyText}>
          {stripHtmlTags(item?.body || "")}
        </Text>
      </View>

      {/* Footer with branding */}
      <View style={posterStyles.footer}>
        <Text style={posterStyles.footerText}>
          Shared via PlotTwist App
        </Text>
      </View>
    </View>
  );
});

const TwistFooter = ({
  item,
  currentUser,
  router,
  showMoreIcon = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [isNavigating, setIsNavigating] = useState(false);
  const posterRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showPosterView, setShowPosterView] = useState(false);
  const buttonRef = useRef(null);
  const [buttonLayout, setButtonLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [kernels, setKernels] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      setIsNavigating(false);
    }, [])
  );
  
  const openPostDetails = () => {
    if (!showMoreIcon || !item?.id) return null;
    router.push({pathname: 'twistDetails', params: {postId: item.id}});
  };
  
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  const [twistlikes, setTwistlikes] = useState([]);
  const [twistunlikes, setTwistunlikes] = useState([]);

  useEffect(() => {
    setTwistlikes(item?.twistLikes || []);
    setTwistunlikes(item?.twistUnlikes || []);
  }, [item]);

  // Shake animation for the popcorn icon
  const shakePopcorn = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Create the popcorn kernel animation
  const createPopcornEffect = () => {
    // Create 12-18 popcorn kernels for a more dramatic effect
    const numKernels = Math.floor(Math.random() * 12) + 22;
    const newKernels = [];

    // Calculate a more reliable center position based on layout
    const centerX = buttonLayout.x + buttonLayout.width / 2;
    const centerY = buttonLayout.y + buttonLayout.height / 2;

    for (let i = 0; i < numKernels; i++) {
      newKernels.push({
        id: `kernel-${Date.now()}-${i}`,
        position: {
          // Add small random offset to starting position for more natural effect
          x: centerX + (Math.random() * 10 - 5),
          y: centerY + (Math.random() * 10 - 5),
        },
      });
    }

    setKernels((prev) => [...prev, ...newKernels]);
  };

  // Remove a popcorn kernel when its animation completes
  const removeKernel = (id) => {
    setKernels((prev) => prev.filter((kernel) => kernel.id !== id));
  };

  const animatePopcorn = (isLiking) => {
    if (isLiking) {
      // When liking: scale up, rotate slightly, then return to normal
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Shake the popcorn icon
      shakePopcorn();

      // Create popcorn kernels - but only if we have layout data
      if (buttonLayout.width > 0) {
        createPopcornEffect();
      }
    } else {
      // When unliking: small bounce animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // This function handles the onLayout event to get precise positioning
  const onButtonLayout = (event) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    
    // Use measure to get position relative to screen
    buttonRef.current.measure((fx, fy, width, height, px, py) => {
      setButtonLayout({
        width,
        height,
        x: px,
        y: py
      });
    });
  };

  const onLike = async () => {
    // If already liked, remove the like
    if(twistliked) {
      // First animate, then update state
      animatePopcorn(false);
      
      let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
      setTwistlikes([...updatedUpvotes]);
      const res = await removeTwistLikes(item?.id, currentUser?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      // First animate, then update state
      animatePopcorn(true);
      
      // If not liked yet, add the like
      let data = {
        userId: currentUser?.id,
        twistId: item?.id
      }
      setTwistlikes([...twistlikes, data]);
      const res = await createTwistLikes(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
      
      // If the post is currently disliked, remove the dislike
      if(twistunliked) {
        let updatedDownvotes = twistunlikes.filter(downvote => downvote.userId !== currentUser?.id);
        setTwistunlikes([...updatedDownvotes]);
        const removeRes = await removeTwistUnlikes(item?.id, currentUser?.id);
        if(!removeRes.success){
          Alert.alert('Error', removeRes.msg || 'Something went wrong');
        }
      }
    }
  }

  const twistliked = twistlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;
  const twistunliked = twistunlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

  // New share function that creates and shares an embedded poster
  const onShare = async () => {
    if (isSharing) return; // Prevent multiple share requests
    
    try {
      setIsSharing(true);
      
      // Animate the share button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
      
      // Show the poster view and wait a bit for it to render
      setShowPosterView(true);
      
      // Add a small delay to ensure the view is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!posterRef.current) {
        Alert.alert('Error', 'Unable to generate poster');
        setIsSharing(false);
        setShowPosterView(false);
        return;
      }
      
      // Generate a high-quality image of our poster component
      const uri = await captureRef(posterRef, {
        format: 'jpg',
        quality: 1,
        result: 'file',
      });
      
      // Hide the poster view after capture
      setShowPosterView(false);
      
      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share your PlotTwist',
          UTI: 'public.jpeg'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Sharing error:', error);
      Alert.alert('Error', 'Failed to share poster');
      setShowPosterView(false);
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <>
      {/* Poster view that will be captured for sharing - hidden by default but properly sized */}
      {showPosterView && (
        <View style={sharingStyles.hiddenContainer}>
          <PosterView ref={posterRef} item={item} currentUser={currentUser} />
        </View>
      )}
      
      {/* Fixed kernel container that spans the entire screen for popcorn animation */}
      <View 
        style={[
          StyleSheet.absoluteFillObject, 
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }
        ]} 
        pointerEvents="none"
      >
        {kernels.map((kernel) => (
          <PopcornKernel
            key={kernel.id}
            startPosition={kernel.position}
            onAnimationComplete={() => removeKernel(kernel.id)}
          />
        ))}
      </View>
      
      <View style={styles.footer}>
        {/* Left side interaction buttons */}
        <View style={styles.leftButtons}>
          {/* Popcorn button (replacing thumbsup) */}
          <View style={styles.footerButton} ref={buttonRef} collapsable={false} onLayout={onButtonLayout}>
            <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
              <Animated.View
                style={{
                  transform: [
                    { scale: scaleAnim },
                    { rotate },
                    { translateX: shakeAnim }
                  ]
                }}
              >
                <Icon 
                  name='popcorn'
                  size={24} 
                  fill={twistliked ? "yellow" : 'transparent'} 
                  strokeWidth={1.4} 
                  color={twistliked ? theme.colors.textDark : theme.colors.light || '#E0E0E0'}
                />  
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.count}>
              {twistlikes?.length || 0}
            </Text>
          </View>
          
          {/* Comment button */}
          <View style={styles.footerButton}>
            <TouchableOpacity 
              disabled={isNavigating}
              onPress={() => {
                if (!isNavigating) {
                  setIsNavigating(true);
                  openPostDetails();
                }
              }}
            >
              <Icon 
                name="comment" 
                size={24} 
                strokeWidth={1.4} 
                color={theme.colors.light || '#E0E0E0'} 
              />
            </TouchableOpacity>
            <Text style={styles.count}>
              {item?.tcomments?.[0]?.count || 0}
            </Text>
          </View>
          
          {/* Share button */}
          <View style={styles.footerButton}>
            <TouchableOpacity onPress={onShare} disabled={isSharing}>
              <Animated.View
                style={{
                  transform: [{ scale: isSharing ? 1.1 : 1 }]
                }}
              >
                <Icon 
                  name='share' 
                  size={24} 
                  strokeWidth={1.4} 
                  color={isSharing ? theme.colors.bmw : theme.colors.light || '#E0E0E0'} 
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

const kernelStyles = StyleSheet.create({
  kernel: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  roundKernel: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ovalKernel: {
    width: 10,
    height: 6,
    borderRadius: 5,
  },
  irregularKernel: {
    width: 9,
    height: 7,
    borderRadius: 3,
    transform: [{ rotate: "45deg" }],
  },
});

export default TwistFooter;

const posterStyles = StyleSheet.create({
  container: {
    width: 600, // Fixed width for the poster
    backgroundColor: theme.colors.card || '#121212',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: hp(2.4),
    fontWeight: 'bold',
    color: theme.colors.bmw || '#4287f5',
  },
  username: {
    fontSize: hp(1.8),
    color: theme.colors.light || '#E0E0E0',
  },
  content: {
    marginVertical: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: hp(2),
    color: theme.colors.light || '#E0E0E0',
    lineHeight: hp(2.8),
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: hp(1.6),
    color: theme.colors.light || '#E0E0E0',
    opacity: 0.8,
  }
});

const sharingStyles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -1000, 
    left: 0,
    width: 600, 
    height: 'auto',
    zIndex: -1,
  }
});

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 16,
  },
  count: {
    color: theme.colors.light || '#E0E0E0',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  }
});

