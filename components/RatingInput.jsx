import { View, Text, TextInput, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';

const RatingInput = ({ onRatingChange, initialValue }) => {
  const [rating, setRating] = useState(initialValue?.toString() || '4.5');
  const [error, setError] = useState('');

  const validateRating = (value) => {
    const numValue = parseFloat(value);
    if (value === '') {
      setError('');
      setRating(value);
      onRatingChange(null);
      return;
    }
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
      setRating(value);
      onRatingChange(null);
      return;
    }
    if (numValue < 0 || numValue > 5) {
      setError('Rating must be between 0 and 5');
      setRating(value);
      onRatingChange(null);
      return;
    }
    setError('');
    setRating(value);
    onRatingChange(numValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rating (0-5)</Text>
      <TextInput
        style={styles.input}
        value={rating}
        onChangeText={validateRating}
        placeholder="Enter rating (e.g., 4.5)"
        keyboardType="decimal-pad"
        maxLength={3}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: hp(2),
    fontWeight: '500',
    paddingStart: 10,
    color: theme.colors.text,
    paddingBottom: 5,
  },
  input: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
  },
  errorText: {
    color: 'red',
    fontSize: hp(1.6),
    marginTop: 5,
    paddingLeft: 10,
  },
});

export default RatingInput;