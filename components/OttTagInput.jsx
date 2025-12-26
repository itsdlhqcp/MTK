import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import theme from '../constants/theme';
import { hp, wp } from '@/helpers/common';

const TagInput = ({ tags = [], setTags }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef();
  const MAX_TAGS = 6;
  const MAX_TAG_LENGTH = 8;

  const handleAddTag = () => {
    setError('');
    const cleanedTag = inputValue.trim().toLowerCase();
    
    // Validation checks
    if (!cleanedTag) {
      Alert.alert('Invalid Tag', 'Tag cannot be empty.');
      return;
    }

    // Ensure tags is an array before checking includes
    const currentTags = Array.isArray(tags) ? tags : [];

    if (currentTags.length >= MAX_TAGS) {
      setError(`Maximum ${MAX_TAGS} tags allowed.`);
      return;
    }

    if (currentTags.includes(cleanedTag)) {
      Alert.alert('Duplicate Tag', 'This tag already exists.');
      return;
    }

    if (cleanedTag.length > MAX_TAG_LENGTH) {
      setError(`Tag must be less than ${MAX_TAG_LENGTH} characters.`);
      return;
    }

    setTags([...currentTags, cleanedTag]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove) => {
    setError('');
    const currentTags = Array.isArray(tags) ? tags : [];
    setTags(currentTags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (text) => {
    setError('');
    if (text.length <= MAX_TAG_LENGTH) {
      setInputValue(text);
    }
  };

  return (
    <View style={styles.tagContainer}>
      <Text style={styles.label}>Add Tags</Text>
      <View style={styles.tagsRow}>
        {Array.isArray(tags) && tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity 
              onPress={() => removeTag(tag)} 
              style={styles.removeTag}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            >
              <Text style={styles.removeTagText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TextInput
          ref={inputRef}
          value={inputValue}
          onChangeText={handleInputChange}
          style={styles.tagInput}
          placeholder={tags.length >= MAX_TAGS ? "" : "Add streaming platform tags"}
          placeholderTextColor="#9E9E9E"
          returnKeyType="done"
          onSubmitEditing={handleAddTag}
          maxLength={MAX_TAG_LENGTH}
          editable={tags.length < MAX_TAGS}
        />
        <TouchableOpacity 
          onPress={handleAddTag} 
          style={[
            styles.addButton,
            tags.length >= MAX_TAGS && styles.addButtonDisabled
          ]}
          disabled={tags.length >= MAX_TAGS}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.helperText}>
          {`${MAX_TAGS - (tags?.length || 0)} tags remaining (max ${MAX_TAG_LENGTH} chars each)`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tagContainer: {
    marginVertical: 10,
  },
  label: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: '#E0E0E0',
    marginBottom: 8,
    paddingStart: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: hp(6),
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    padding: 8,
    backgroundColor: '#181818',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: hp(1.8),
    color: '#E0E0E0',
    fontWeight: theme.fonts.medium,
  },
  removeTag: {
    marginLeft: 4,
  },
  removeTagText: {
    color: '#E0E0E0',
    fontSize: hp(2),
    marginTop: -2,
  },
  tagInput: {
    flex: 1,
    paddingStart: 5,
    minWidth: 60,
    fontSize: hp(1.8),
    padding: 0,
    marginLeft: 5,
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: hp(1.6),
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: theme.colors.textLight,
    fontSize: hp(1.6),
    marginTop: 4,
    marginLeft: 4,
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.gray,
    opacity: 0.5,
  },
});

export default TagInput;