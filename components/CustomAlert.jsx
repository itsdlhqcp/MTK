import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { hp } from '../helpers/common';

const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  onCancel, 
  onConfirm, 
  cancelText = "Cancel", 
  confirmText = "Confirm" 
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.alertButtonsContainer}>
            <TouchableOpacity 
              style={[styles.alertButton, styles.alertCancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.alertCancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.alertButton, styles.alertConfirmButton]} 
              onPress={onConfirm}
            >
              <Text style={styles.alertConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#121212', // Dark background
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#262626',
  },
  alertTitle: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: hp(2),
    color: '#8E8E8E',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  alertCancelButton: {
    backgroundColor: '#262626',
  },
  alertConfirmButton: {
    backgroundColor: '#FF3B30', // Using error color (assuming this is what instagramTheme.colors.error would be)
  },
  alertCancelText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: hp(1.8),
  },
  alertConfirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: hp(1.8),
  },
});

export default CustomAlert;