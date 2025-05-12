// contexts/ToastContext.js
import React, { createContext, useContext, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '@/constants/theme';

// Create the context
const ToastContext = createContext();

// Create a provider component
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    visible: false,
    type: 'success',
    message: '',
    duration: 1500
  });
  
  const [opacity] = useState(new Animated.Value(0));

  // Function to show a toast
  const showToast = (type, message, duration = 4000) => {
    setToast({
      visible: true,
      type,
      message,
      duration
    });
    
    // Fade in animation
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Auto-hide the toast after duration
    const hideTimer = setTimeout(() => {
      // Fade out animation
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setToast(prev => ({
          ...prev,
          visible: false
        }));
      });
    }, duration);

    return () => clearTimeout(hideTimer);
  };

  // Get background color based on toast type
  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return '#121212';
      case 'error':
        return theme.colors.error || '#F44336';
      case 'warning':
        return theme.colors.warning || '#FFC107';
      case 'info':
        return theme.colors.info || '#2196F3';
      default:
        return theme.colors.textDark;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast component */}
      {toast.visible && (
        <Animated.View 
          style={[
            styles.toastContainer,
            { 
              backgroundColor: getBackgroundColor(),
              opacity: opacity
            }
          ]}
        >
          <Text style={styles.toastText}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

// Styles
const styles = StyleSheet.create({
  toastContainer: {
    minWidth: wp(40),
    maxWidth: wp(90),
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    alignSelf: 'center',
    bottom: hp(5),
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  }
});

// Create a custom hook for using the toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};