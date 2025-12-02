import { View, Text, TextInput, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';

const UserRatingImpact = ({ onRatingChange, initialValue }) => {
  const [rating, setRating] = useState(initialValue?.toString() || '0');
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
      <Text style={styles.label}>User Rating Impact (0-5 or 0.1..4.9) </Text>
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
    color: "green",
    paddingBottom: 3,
  },
  input: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: "red",
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

export default UserRatingImpact;