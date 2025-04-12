// contexts/ToastContext.js
import React, { createContext, useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    duration: 2000
  });

  // Function to show a toast
  const showToast = (type, message, duration = 7000) => {
    setToast({
      visible: true,
      type,
      message,
      duration
    });
    
    // Auto-hide the toast after duration
    setTimeout(() => {
      setToast(prev => ({
        ...prev,
        visible: false
      }));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast component */}
      {toast.visible && (
        <View 
          style={{
            width: wp(40),
            height: 30,
            backgroundColor: theme.colors.textDark,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            alignSelf: 'center',
            top: '90%',
            marginTop: hp(-60),
            zIndex: 9999,
          }}
        >
          <Text style={{ color: 'white', fontSize: 10, fontWeight: '500' }}>
            {toast.message}
          </Text>
        </View>
      )}
    </ToastContext.Provider>
  );
};

// Create a custom hook for using the toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};