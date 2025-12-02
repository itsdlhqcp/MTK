
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Icon from '../assets/icons';
import { createPoll } from '../services/pollservice';

const CreatePollScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [allowsMultipleAnswers, setAllowsMultipleAnswers] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  const optionRefs = useRef([]);

  // Add new option
  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  // Remove option
  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // Update refs array
      optionRefs.current = optionRefs.current.filter((_, i) => i !== index);
    }
  };

  // Update option text
  const updateOption = (index, text) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  // Validate poll data
  const validatePoll = () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a poll question');
      return false;
    }

    const validOptions = options.filter(option => option.trim());
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please provide at least 2 options');
      return false;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      Alert.alert('Error', 'Please make sure all options are unique');
      return false;
    }

    return true;
  };

  // Create poll
  const handleCreatePoll = async () => {
    if (!validatePoll() || loading) return;

    setLoading(true);
    
    try {
      const validOptions = options.filter(option => option.trim());
      
      const pollData = {
        user_id: user.id,
        question: question.trim(),
        description: description.trim() || null,
        is_anonymous: isAnonymous,
        is_multiple_choice: isMultipleChoice,
        allows_multiple_answers: allowsMultipleAnswers,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        options: validOptions.map(opt => opt.trim())
      };

      const result = await createPoll(pollData);
      
      if (result.success) {
        Alert.alert('Success', 'Poll created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.msg);
      }
    } catch (error) {
      console.log('Create poll error:', error);
      Alert.alert('Error', 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  // Handle expiration date (simplified - you might want to use a date picker)
  const handleExpirationToggle = () => {
    if (expiresAt) {
      setExpiresAt('');
    } else {
      // Set default expiration to 7 days from now
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      setExpiresAt(defaultExpiry.toISOString().split('T')[0]);
    }
  };

  return (
    <ScreenWrapper bg="#121212">
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrowLeft" size={hp(2.8)} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Poll</Text>
          <Pressable 
            onPress={handleCreatePoll} 
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            disabled={loading}
          >
            <Text style={[styles.createButtonText, loading && styles.createButtonTextDisabled]}>
              {loading ? 'Creating...' : 'Post'}
            </Text>
          </Pressable>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Poll Question *</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Ask a question..."
              placeholderTextColor="#666"
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={500}
            />
            <Text style={styles.charCount}>{question.length}/500</Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add more context..."
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={1000}
            />
            <Text style={styles.charCount}>{description.length}/1000</Text>
          </View>

          {/* Options */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Options *</Text>
            {options.map((option, index) => (
              <View key={index} style={styles.optionContainer}>
                <TextInput
                  ref={ref => optionRefs.current[index] = ref}
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor="#666"
                  value={option}
                  onChangeText={(text) => updateOption(index, text)}
                  returnKeyType="next"
                  maxLength={200}
                  onSubmitEditing={() => {
                    if (index < options.length - 1) {
                      optionRefs.current[index + 1]?.focus();
                    }
                  }}
                />
                {options.length > 2 && (
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeOption(index)}
                  >
                    <Icon name="close" size={hp(2)} color="#ff4444" />
                  </Pressable>
                )}
              </View>
            ))}
            
            {/* Add Option Button */}
            {options.length < 10 && (
              <Pressable style={styles.addOptionButton} onPress={addOption}>
                <Icon name="plus" size={hp(2)} color="#2196F3" />
                <Text style={styles.addOptionText}>Add Option</Text>
              </Pressable>
            )}
          </View>

          {/* Poll Settings */}
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>Poll Settings</Text>
            
            {/* Anonymous Poll */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Anonymous Poll</Text>
                <Text style={styles.settingDescription}>
                  Hide voter identities from results
                </Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#333', true: '#2196F3' }}
                thumbColor={isAnonymous ? '#fff' : '#666'}
              />
            </View>

            {/* Multiple Choice */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Multiple Choice</Text>
                <Text style={styles.settingDescription}>
                  Allow users to select multiple options
                </Text>
              </View>
              <Switch
                value={isMultipleChoice}
                onValueChange={(value) => {
                  setIsMultipleChoice(value);
                  if (!value) {
                    setAllowsMultipleAnswers(false);
                  }
                }}
                trackColor={{ false: '#333', true: '#2196F3' }}
                thumbColor={isMultipleChoice ? '#fff' : '#666'}
              />
            </View>

            {/* Multiple Answers (only show if multiple choice is enabled) */}
            {isMultipleChoice && (
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Allow Multiple Answers</Text>
                  <Text style={styles.settingDescription}>
                    Users can vote for multiple options
                  </Text>
                </View>
                <Switch
                  value={allowsMultipleAnswers}
                  onValueChange={setAllowsMultipleAnswers}
                  trackColor={{ false: '#333', true: '#2196F3' }}
                  thumbColor={allowsMultipleAnswers ? '#fff' : '#666'}
                />
              </View>
            )}

            {/* Poll Expiration */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Set Expiration</Text>
                <Text style={styles.settingDescription}>
                  Poll will close automatically
                </Text>
              </View>
              <Switch
                value={!!expiresAt}
                onValueChange={handleExpirationToggle}
                trackColor={{ false: '#333', true: '#2196F3' }}
                thumbColor={expiresAt ? '#fff' : '#666'}
              />
            </View>

            {/* Expiration Date Input (simplified) */}
            {expiresAt && (
              <View style={styles.expirationContainer}>
                <Text style={styles.expirationLabel}>Expires on:</Text>
                <TextInput
                  style={styles.expirationInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                  value={expiresAt}
                  onChangeText={setExpiresAt}
                />
                <Text style={styles.expirationNote}>
                  Format: YYYY-MM-DD (e.g., 2024-12-31)
                </Text>
              </View>
            )}
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default CreatePollScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: 'rgb(19, 21, 22)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: hp(0.5),
  },
  headerTitle: {
    color: 'white',
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
  },
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.sm,
  },
  createButtonDisabled: {
    backgroundColor: '#333',
  },
  createButtonText: {
    color: 'white',
    fontSize: hp(1.6),
    fontWeight: theme.fonts.semibold,
  },
  createButtonTextDisabled: {
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  inputContainer: {
    marginTop: hp(2.5),
  },
  label: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    marginBottom: hp(1),
  },
  questionInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: theme.radius.md,
    padding: wp(4),
    color: 'white',
    fontSize: hp(1.7),
    minHeight: hp(12),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
  },
  descriptionInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: theme.radius.md,
    padding: wp(4),
    color: 'white',
    fontSize: hp(1.6),
    minHeight: hp(8),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
  },
  charCount: {
    color: '#666',
    fontSize: hp(1.4),
    textAlign: 'right',
    marginTop: hp(0.5),
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: theme.radius.md,
    padding: wp(3.5),
    color: 'white',
    fontSize: hp(1.6),
    borderWidth: 1,
    borderColor: '#333',
  },
  removeButton: {
    marginLeft: wp(3),
    padding: wp(2),
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: theme.radius.md,
    padding: wp(3.5),
    marginTop: hp(1),
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  addOptionText: {
    color: '#2196F3',
    fontSize: hp(1.6),
    marginLeft: wp(2),
    fontWeight: theme.fonts.medium,
  },
  settingsContainer: {
    marginTop: hp(3),
    backgroundColor: '#1e1e1e',
    borderRadius: theme.radius.md,
    padding: wp(4),
    borderWidth: 1,
    borderColor: '#333',
  },
  settingsTitle: {
    color: 'white',
    fontSize: hp(1.9),
    fontWeight: theme.fonts.bold,
    marginBottom: hp(2),
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: wp(4),
  },
  settingLabel: {
    color: 'white',
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
  },
  settingDescription: {
    color: '#888',
    fontSize: hp(1.4),
    marginTop: hp(0.3),
  },
  expirationContainer: {
    marginTop: hp(2),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  expirationLabel: {
    color: 'white',
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    marginBottom: hp(1),
  },
  expirationInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: theme.radius.sm,
    padding: wp(3),
    color: 'white',
    fontSize: hp(1.6),
    borderWidth: 1,
    borderColor: '#444',
  },
  expirationNote: {
    color: '#666',
    fontSize: hp(1.3),
    marginTop: hp(0.5),
    fontStyle: 'italic',
  },
  createPollButton: {
    backgroundColor: '#2196F3',
    borderRadius: theme.radius.md,
    paddingVertical: hp(2),
    marginTop: hp(3),
    alignItems: 'center',
  },
  createPollButtonDisabled: {
    backgroundColor: '#333',
  },
  createPollButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.bold,
  },
  createPollButtonTextDisabled: {
    color: '#666',
  },
  bottomSpacing: {
    height: hp(5),
  },
});

