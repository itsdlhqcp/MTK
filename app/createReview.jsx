import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import Icon from '@/assets/icons'
import { useReview } from '../contexts/ReviewContext'

export default function CreateReview() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [movieId, setMovieId] = useState('');
  const [movieData, setMovieData] = useState(null);
  const [reviewState, setReviewState] = useState(null);


  const { updateReviewData } = useReview();

  useEffect(() => {
    // Get current date in the format "Day of week, DD Month, YYYY"
    const currentDate = new Date();
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    const formattedDate = currentDate.toLocaleDateString('en-US', options);
    
    // Replace commas according to the original format
    const dateWithCorrectCommas = formattedDate
      .replace(/,/g, '')  // Remove all commas first
      .replace(/(\w+) (\d+) (\w+) (\d+)/, '$1, $2 $3, $4'); // Add commas in the right places
    
    setDate(dateWithCorrectCommas);

    // Store movie ID if provided
    if (params?.movieId) {
      setMovieId(params.movieId);
    }

    // Parse movie data if it exists
    if (params?.movie) {
      try {
        const movie = typeof params.movie === 'string' ? JSON.parse(params.movie) : params.movie;
        setMovieData(movie);
      } catch (e) {
        console.error('Error parsing movie data:', e);
      }
    }

    // Parse review state if it exists
    if (params?.reviewState) {
      try {
        const reviewStateObj = typeof params.reviewState === 'string' 
          ? JSON.parse(params.reviewState) 
          : params.reviewState;
        setReviewState(reviewStateObj);
      } catch (e) {
        console.error('Error parsing review state:', e);
      }
    }

    // Parse existing review if it exists
    if (params?.review) {
      try {
        const review = typeof params.review === 'string' ? JSON.parse(params.review) : params.review;
        if (review.body) {
          setBody(review.body);
        }
        // If review has a date, use that instead of current date
        if (review.date) {
          setDate(review.date);
        }
      } catch (e) {
        console.error('Error parsing review:', e);
      }
    }
  }, [params]);

  const onSubmit = async () => {
    // Prepare the review data
    let reviewData = {
      body: body,
      date: date,
      movieId: movieId
    };

    console.log('Submitting review:', reviewData);
    
    // Update the global context with review data
    updateReviewData({
      reviewText: body,
      reviewDate: date
    });
    
    // Navigate back
    router.back();
  };

  return (
    <ScreenWrapper bg="#1A252B">
      <Header 
        title="" 
        showBackButton={true}
        rightIcon={
          <TouchableOpacity onPress={onSubmit}>
            <Icon name="check" size={28} color="white" />
          </TouchableOpacity>
        }
      />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={{ gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Display movie title if available */}
          {movieData && movieData.title && (
            <View style={styles.movieTitleContainer}>
              <Text style={styles.movieTitle}>{movieData.title}</Text>
              {movieData.year && <Text style={styles.movieYear}>({movieData.year})</Text>}
            </View>
          )}

          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Date</Text>
            <View style={styles.dateValueContainer}>
              <Text style={styles.dateValue}>{date}</Text>
              <TouchableOpacity style={styles.dateEditButton}>
                <Icon name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.reviewTextContainer}>
            <TextInput
              style={styles.reviewTextInput}
              placeholder="Add review..."
              placeholderTextColor="#4A6275"
              multiline={true}
              numberOfLines={6}
              value={body}
              onChangeText={setBody}
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  movieTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  movieTitle: {
    fontSize: hp(2.2),
    color: 'white',
    fontWeight: 'bold',
  },
  movieYear: {
    fontSize: hp(2),
    color: '#6D8296',
    marginLeft: wp(1),
  },
  dateContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
    paddingBottom: hp(2),
  },
  dateLabel: {
    fontSize: hp(2),
    color: '#6D8296',
    marginBottom: hp(1),
  },
  dateValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateValue: {
    fontSize: hp(2),
    color: 'white',
  },
  dateEditButton: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
    backgroundColor: '#3D5A73',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewTextContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
    paddingBottom: hp(2),
  },
  reviewTextInput: {
    color: 'white',
    fontSize: hp(2),
    minHeight: hp(15),
    textAlignVertical: 'top',
  }
});