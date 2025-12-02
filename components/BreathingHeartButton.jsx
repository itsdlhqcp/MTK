import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Alert, View } from 'react-native';
import Icon from '../assets/icons';
import theme from '../constants/theme';

const BreathingHeartButton = ({ 
  item, 
  updateItem = () => {},
  favour = false  // Default value is false
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const isInitialMount = useRef(true);
  
  // Set up the initial favorite state from props
  useEffect(() => {
    setIsFavorite(favour);
  }, [favour]);
  
  const onToggleFavorite = async () => {
    if (!item?.id) {
      Alert.alert('Error', 'Unable to mark as favorite');
      return;
    }

    try {
      // Toggle the favorite state
      const newFavoriteState = !isFavorite;
      
      // Update local state
      setIsFavorite(newFavoriteState);
      
      // Update parent component
      updateItem(item.id, { isFavorite: newFavoriteState });
      
    } catch (error) {
      console.error('Favorite toggle error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggleFavorite} activeOpacity={0.7}>
        <View style={{ marginRight: 7 }}>
          <Icon 
            name="heart" 
            size={44} 
            fill={isFavorite ? theme.colors.bmw : 'transparent'} 
            strokeWidth={1.4} 
            color={isFavorite ? theme.colors.bmw : theme.colors.bmw}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});

export default BreathingHeartButton;