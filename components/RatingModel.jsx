import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Switch, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';

const StarIcon = ({ state = 'empty' }) => {
  const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  
  const getFillColor = () => {
    switch (state) {
      case 'full':
        return "#facc15";
      case 'half':
        return "url(#halfGradient)";
      default:
        return "none";
    }
  };

  return (
    <Svg width={32} height={32} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="halfGradient" x1="0" x2="24" y1="0" y2="0">
          <Stop offset="0" stopColor="#facc15" stopOpacity="1" />
          <Stop offset="0.5" stopColor="#facc15" stopOpacity="1" />
          <Stop offset="0.5" stopColor="#e5e7eb" stopOpacity="1" />
          <Stop offset="1" stopColor="#e5e7eb" stopOpacity="1" />
        </LinearGradient>
        <ClipPath id="starClip">
          <Path d={starPath} />
        </ClipPath>
      </Defs>
      <Path
        d={starPath}
        fill="#e5e7eb"
        stroke="#d1d5db"
        strokeWidth={1}
      />
      <Rect
        x="0"
        y="0"
        width="24"
        height="24"
        fill={getFillColor()}
        clipPath="url(#starClip)"
      />
    </Svg>
  );
};

const StarRating = ({ rating, onRatingChange }) => {
  const getStarState = (position) => {
    if (rating >= position) return 'full';
    if (rating >= position - 0.5) return 'half';
    return 'empty';
  };

  const handleStarPress = (position, isLeft) => {
    let newRating;
    if (isLeft) {
      if (rating === position - 0.5) {
        newRating = 0;
      } else {
        newRating = position - 0.5;
      }
    } else {
      if (rating === position) {
        newRating = position - 0.5;
      } else {
        newRating = position;
      }
    }
    onRatingChange(newRating);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((position) => (
          <View key={position} style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={{
                width: 16,
                height: 32,
                zIndex: 1,
              }}
              onPress={() => handleStarPress(position, true)}
            />
            <TouchableOpacity
              style={{
                width: 16,
                height: 32,
                zIndex: 1,
              }}
              onPress={() => handleStarPress(position, false)}
            >
              <View style={{ position: 'absolute', left: -16 }}>
                <StarIcon state={getStarState(position)} />
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <Text style={{
        textAlign: 'center',
        marginTop: 8,
        fontSize: 16,
        color: '#4b5563'
      }}>
        Rating: {rating.toFixed(1)} / 5.0
      </Text>
    </View>
  );
};

const RatingModal = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [cupOfTea, setCupOfTea] = useState(false);
  const [mustWatch, setMustWatch] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(null);

  const emojis = ['🔥', '💖', '😫', '👎🏼'];  

  const handleSubmit = () => {
    onSubmit(rating, cupOfTea, selectedEmoji, mustWatch);
    setRating(0);
    setCupOfTea(false);
    setMustWatch(false);
    setSelectedEmoji(null);
    onClose();
  };

  const handleClose = () => {
    setRating(0);
    setCupOfTea(false);
    setMustWatch(false);
    setSelectedEmoji(null);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
        <View style={{
          backgroundColor: 'white',
          padding: 24,
          borderRadius: 8,
          width: '80%',
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 16,
            color: '#1f2937'
          }}>
            Rate this release
          </Text>
          <StarRating rating={rating} onRatingChange={setRating} />
          
          {/* Cup of Tea Toggle Switch */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 16,
            gap: 8
          }}>
            <Text style={{ color: '#4b5563' }}>My Cup of Tea ☕</Text>
            <Switch
              value={cupOfTea}
              onValueChange={setCupOfTea}
              trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
              thumbColor={cupOfTea ? '#3b82f6' : '#9ca3af'}
            />
          </View>

          {/* Must Watch🍿🍿 Toggle Switch */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 16,
            gap: 8
          }}>
            <Text style={{ color: '#4b5563' }}>Must Watch🍿🍿</Text>
            <Switch
              value={mustWatch}
              onValueChange={setMustWatch}
              trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
              thumbColor={cupOfTea ? '#3b82f6' : '#9ca3af'}
            />
          </View>

          {/* Emoji Selection */}
          <View style={{
            marginTop: 16,
            alignItems: 'center'
          }}>
            <Text style={{ color: '#4b5563', marginBottom: 8 }}>Add emotional opinion (optional)</Text>
            <View style={{
              flexDirection: 'row',
              gap: 16
            }}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: selectedEmoji === emoji ? '#93c5fd' : '#e5e7eb'
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{
            flexDirection: 'row',
            gap: 16,
            marginTop: 24
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#e5e7eb',
                paddingHorizontal: 24,
                paddingVertical: 8,
                borderRadius: 8
              }}
              onPress={handleClose}
            >
              <Text style={{ color: '#374151' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#3b82f6',
                paddingHorizontal: 24,
                paddingVertical: 8,
                borderRadius: 8,
                opacity: rating === 0 ? 0.5 : 1
              }}
              onPress={handleSubmit}
              disabled={rating === 0}
            >
              <Text style={{ color: 'white' }}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RatingModal;




