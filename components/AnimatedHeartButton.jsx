import { useState, useRef, useEffect } from "react"
import { StyleSheet, TouchableOpacity, Text, Animated, Alert, View, Dimensions } from "react-native"
import Icon from "../assets/icons"
import theme from "../constants/theme"
import { hp } from "../helpers/common"
import { createPostLike, removePostLike } from "../services/postService"

// Get screen dimensions for positioning the popcorn pieces
const { width, height } = Dimensions.get("window")

// Individual popcorn kernel piece component
const PopcornKernel = ({ startPosition, onAnimationComplete }) => {
  // Random values for more natural movement
  const randomX = useRef(Math.random() * 100 - 50).current // -50 to 50
  const randomY = useRef(-Math.random() * 120 - 30).current // -30 to -150 (upward)
  const randomRotate = useRef(Math.random() * 720 - 360).current // -360 to 360 degrees
  const randomScale = useRef(Math.random() * 0.4 + 0.3).current // 0.3 to 0.7

  // Random kernel type (different shapes)
  const kernelType = useRef(Math.floor(Math.random() * 3)).current // 0, 1, or 2

  // Random color variation (different shades of yellow/white)
  const colorVariants = ["#FFEB3B", "#FFF59D", "#FFFDE7", "#FFF176", "#FFEE58"]
  const kernelColor = useRef(colorVariants[Math.floor(Math.random() * colorVariants.length)]).current

  // Animation values
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const opacity = useRef(new Animated.Value(0)).current // Start invisible
  const rotate = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0)).current

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
    ]).start(onAnimationComplete)
  }, [])

  // Convert rotation value to rotation string
  const rotateStr = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${randomRotate}deg`],
  })

  // Render different kernel shapes based on kernelType
  const renderKernel = () => {
    switch (kernelType) {
      case 0: // Round kernel
        return <View style={[styles.kernel, styles.roundKernel, { backgroundColor: kernelColor }]} />
      case 1: // Oval kernel
        return <View style={[styles.kernel, styles.ovalKernel, { backgroundColor: kernelColor }]} />
      case 2: // Irregular kernel
        return <View style={[styles.kernel, styles.irregularKernel, { backgroundColor: kernelColor }]} />
      default:
        return <View style={[styles.kernel, styles.roundKernel, { backgroundColor: kernelColor }]} />
    }
  }

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
  )
}

const LikeButton = ({ item, currentUser, updatePost = () => {} }) => {
  const [likes, setLikes] = useState([])
  const [kernels, setKernels] = useState([])
  const buttonRef = useRef(null)
  const [buttonLayout, setButtonLayout] = useState({ width: 0, height: 0, x: 0, y: 0 }) 

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const shakeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    setLikes(item?.postLikes || [])
  }, [item?.postLikes])

  const liked = likes?.filter((like) => like?.userId === currentUser?.id)?.length > 0

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
    ]).start()
  }

  const animateHeart = (isLiking) => {
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
      ]).start()

      // Shake the popcorn icon
      shakePopcorn()

      // Create popcorn kernels - but only if we have layout data
      if (buttonLayout.width > 0) {
        createPopcornEffect()
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
      ]).start()
    }
  }

  // Create the popcorn kernel animation
  const createPopcornEffect = () => {
    // Create 12-18 popcorn kernels for a more dramatic effect
    const numKernels = Math.floor(Math.random() * 7) + 12
    const newKernels = []

    // Calculate a more reliable center position based on layout
    const centerX = buttonLayout.x + buttonLayout.width / 2
    const centerY = buttonLayout.y + buttonLayout.height / 2

    for (let i = 0; i < numKernels; i++) {
      newKernels.push({
        id: `kernel-${Date.now()}-${i}`,
        position: {
          // Add small random offset to starting position for more natural effect
          x: centerX + (Math.random() * 10 - 5),
          y: centerY + (Math.random() * 10 - 5),
        },
      })
    }

    setKernels((prev) => [...prev, ...newKernels])
  }

  // Remove a popcorn kernel when its animation completes
  const removeKernel = (id) => {
    setKernels((prev) => prev.filter((kernel) => kernel.id !== id))
  }

  const onLike = async () => {
    if (!currentUser?.id || !item?.id) {
      Alert.alert("Error", "Unable to like post")
      return
    }

    try {
      if (liked) {
        // First animate, then update state
        animateHeart(false)

        const updatedLikes = likes.filter((like) => like.userId !== currentUser.id)
        setLikes(updatedLikes)

        // Update parent component
        updatePost(item.id, { postLikes: updatedLikes })

        const res = await removePostLike(item.id, currentUser.id)
        if (!res.success) {
          Alert.alert("Post", "Something went wrong")
          setLikes(likes) // Revert on error
          updatePost(item.id, { postLikes: likes })
        }
      } else {
        // First animate, then update state
        animateHeart(true)

        const newLike = {
          userId: currentUser.id,
          postId: item.id,
        }
        const updatedLikes = [...likes, newLike]
        setLikes(updatedLikes)

        // Update parent component
        updatePost(item.id, { postLikes: updatedLikes })

        const res = await createPostLike(newLike)
        if (!res.success) {
          Alert.alert("Post", "Something went wrong")
          setLikes(likes) // Revert on error
          updatePost(item.id, { postLikes: likes })
        }
      }
    } catch (error) {
      console.error("Like error:", error)
      Alert.alert("Error", "Something went wrong")
    }
  }

  // Convert rotation value to rotation string
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "15deg"],
  })

  // This function handles the onLayout event to get precise positioning
  const onButtonLayout = (event) => {
    const { width, height, x, y } = event.nativeEvent.layout
    
    // Use measure to get position relative to screen
    buttonRef.current.measure((fx, fy, width, height, px, py) => {
      setButtonLayout({
        width,
        height,
        x: px,
        y: py
      })
    })
  }

  return (
    <View style={styles.container}>
      <View 
        ref={buttonRef} 
        collapsable={false} 
        onLayout={onButtonLayout}
      >
        <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }, { rotate }, { translateX: shakeAnim }],
            }}
          >
            <Icon
              name="popcorn"
              size={24}
              fill={liked ? "yellow" : "transparent"}
              strokeWidth={1.4}
              color={liked ? theme.colors.textDark : theme.colors.assent}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    
      <Text style={styles.count}>{likes?.length || 0}</Text>
    
      {/* Add this fixed kernel container */}
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    position: "relative", // Add this for proper positioning
  },
  count: {
    color: theme.colors.textLight,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
  },
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
})

export default LikeButton