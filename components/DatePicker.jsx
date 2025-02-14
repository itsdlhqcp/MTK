import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import DateTimePickerModal from "@react-native-community/datetimepicker";

const DatePicker = ({ onDateSelect, initialDate }) => {
  const [date, setDate] = useState(initialDate || new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [displayDate, setDisplayDate] = useState('');

  useEffect(() => {
    if (initialDate) {
      setDisplayDate(formatDate(initialDate));
    }
  }, [initialDate]);

  const toggleDatePicker = () => {
    setShowPicker(!showPicker);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const onChange = (event, selectedDate) => {
    if (event.type === 'set') {
      const currentDate = selectedDate || date;
      setDate(currentDate);
      setDisplayDate(formatDate(currentDate));
      onDateSelect(currentDate); // Pass the selected date to parent
      
      if (Platform.OS === 'android') {
        toggleDatePicker();
      }
    } else {
      toggleDatePicker();
    }
  };

  return (
    <View>
      <Text style={styles.label}>Select Release Date</Text>
      
      {showPicker && (
        <DateTimePickerModal
          mode="date"
          display="calendar"
          value={date}
          onChange={onChange}
        />
      )}
      
      <Pressable onPress={toggleDatePicker}>
        <TextInput
          style={styles.dateInput}
          placeholder="Select Release Date (YYYY-MM-DD)"
          value={displayDate}
          placeholderTextColor="#666"
          editable={false}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '500',
    paddingStart: 10,
    color: '#000',
    paddingBottom: 5
  },
  dateInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 10,
  }
});

export default DatePicker;