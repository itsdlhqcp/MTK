import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';
import theme from '../constants/theme';

const ReportModal = ({ isVisible, onClose, postId, flaggedUserId, currentUserId }) => {
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState({ 
    success: false, 
    message: '', 
    show: false 
  });

  const reportOptions = [
    { id: 1, title: 'Sexual content' },
    { id: 2, title: 'Violent or repulsive content' },
    { id: 3, title: 'Hateful or abusive content' },
    { id: 4, title: 'Harmful or dangerous acts' },
    { id: 5, title: 'False information' },
    { id: 6, title: 'Spam or misleading' },
  ];

  const handleSubmit = async () => {
    if (!selectedFlag) {
      setSubmissionResult({
        success: false,
        message: 'Please select a reason for reporting',
        show: true
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Submit report to Supabase
      const { data, error } = await supabase
        .from('reports')
        .insert({
          feedsId: postId,
          flagId: selectedFlag,
          flaggedUserId: flaggedUserId,
          resolved: false
        });

      if (error) {
        throw error;
      }

      setSubmissionResult({
        success: true,
        message: 'Reportorted the content successfully',
        show: true
      });

      // Reset form
      setSelectedFlag(null);

      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
        setSubmissionResult({ success: false, message: '', show: false });
      }, 1500);
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmissionResult({
        success: false,
        message: 'Failed to submit report. Please try again.',
        show: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Report image or title</Text>
          
          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {reportOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={() => setSelectedFlag(option.id)}
              >
                <View style={styles.radioButtonContainer}>
                  <View style={styles.radioButton}>
                    {selectedFlag === option.id && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.optionText}>{option.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {submissionResult.show && (
            <View style={[
              styles.resultMessage,
              submissionResult.success ? styles.successMessage : styles.errorMessage
            ]}>
              <Text style={styles.resultText}>{submissionResult.message}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.reportButton} 
              onPress={handleSubmit}
              disabled={!selectedFlag || isSubmitting}
            >
              <Text style={styles.reportText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReportModal;

const styles = StyleSheet.create({  
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)', 
    backdropFilter: 'blur(10px)',
  },
  modalContent: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    width: '80%',
    maxHeight: '80%',
    padding: hp(2),
    paddingTop: hp(3),
    paddingBottom: hp(1.5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: hp(2.2),
    fontWeight: '500',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  optionsContainer: {
    maxHeight: hp(40),
  },
  optionItem: {
    paddingVertical: hp(1.8),
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    height: hp(2.4),
    width: hp(2.4),
    borderRadius: hp(1.2),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  radioSelected: {
    height: hp(1.2),
    width: hp(1.2),
    borderRadius: hp(0.6),
    backgroundColor: '#1E88E5', 
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: hp(1.5),
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1),
  },
  reportButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1),
  },
  cancelText: {
    color: '#2196F3', 
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  reportText: {
    color: '#2196F3', 
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  resultMessage: {
    padding: hp(1),
    borderRadius: 4,
    marginTop: hp(1),
  },
  successMessage: {
    backgroundColor:  theme.colors.textDark,
  },
  errorMessage: {
    backgroundColor: '#5c2323',
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
    textAlign: 'center',
  }
});