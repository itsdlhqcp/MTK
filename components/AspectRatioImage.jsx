
// AspectRatioImage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';

// Create a simple in-memory cache for image dimensions
const imageDimensionsCache = new Map();

const AspectRatioImage = ({ 
  source, 
  maxHeight = hp(64), 
  style = {},
  isVisible = true // Add visibility prop to control loading behavior
}) => {
  // State for managing image dimensions and loading status
  const [imageSize, setImageSize] = useState({
    height: hp(35), // Default height
    isLoaded: false
  });
  
  // Get URI from source object or string
  const imageUri = typeof source === 'string' ? source : 
                  (source?.uri || '');
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);
  
  // Check cache on mount and when source changes
  useEffect(() => {
    if (!imageUri) return;
    
    // Lookup cached dimensions
    const cachedDimensions = imageDimensionsCache.get(imageUri);
    if (cachedDimensions) {
      const screenWidth = wp(100);
      const scaledHeight = (cachedDimensions.height / cachedDimensions.width) * screenWidth;
      
      if (isMounted.current) {
        setImageSize({
          height: Math.min(scaledHeight, maxHeight),
          isLoaded: true
        });
      }
    } else if (isVisible) {
      // If not in cache and component is visible, pre-calculate dimensions
      Image.getSize(
        imageUri,
        (width, height) => {
          if (isMounted.current) {
            const screenWidth = wp(100);
            const scaledHeight = (height / width) * screenWidth;
            
            // Cache the dimensions
            imageDimensionsCache.set(imageUri, { width, height });
            
            // Update state
            setImageSize({
              height: Math.min(scaledHeight, maxHeight),
              isLoaded: true
            });
          }
        },
        (error) => {
          console.log('Error getting image size:', error);
        }
      );
    }
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [imageUri, maxHeight, isVisible]);
  
  // Reset mounted ref on re-mount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle image load event as a backup method
  const handleImageLoad = useCallback((event) => {
    if (!isVisible || !isMounted.current) return;
    
    const { width, height } = event.nativeEvent.source;
    if (width && height) {
      const screenWidth = wp(100);
      const scaledHeight = (height / width) * screenWidth;
      
      // Cache the dimensions if not already cached
      if (imageUri && !imageDimensionsCache.has(imageUri)) {
        imageDimensionsCache.set(imageUri, { width, height });
      }
      
      setImageSize({
        height: Math.min(scaledHeight, maxHeight),
        isLoaded: true
      });
    }
  }, [imageUri, maxHeight, isVisible]);

  return (
    <View style={[styles.imageContainer, style]}>
      {isVisible && (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={[
            styles.image,
            {
              width: '100%',
              height: imageSize.height,
              opacity: imageSize.isLoaded ? 1 : 0.85 // Smoother transition
            }
          ]}
          onLoad={handleImageLoad}
          resizeMode="cover"
          progressiveRenderingEnabled={true}
          fadeDuration={300} // Smooth fade-in
        />
      )}
      
      {/* Show loading indicator until image is fully loaded */}
      {isVisible && !imageSize.isLoaded && (
        <View style={[styles.loadingOverlay, { height: imageSize.height }]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}
      
      {/* Placeholder when not visible */}
      {!isVisible && (
        <View style={[styles.placeholder, { height: imageSize.height }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholder: {
    width: '100%',
    backgroundColor: '#2c2c2c',
  }
});

export default React.memo(AspectRatioImage);