import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable, FlatList, Switch } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp, truncateUsername } from '@/helpers/common'
import theme from '../constants/theme'
import Icon from '@/assets/icons'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import RichTextEditor from '../components/RichTextEditor'
import Button from '@/components/Button'
import { getSupabaseFileUrl } from '../services/imageService'
import * as ImagePicker from 'expo-image-picker';
import DatePicker from '../components/DatePicker'
import RatingInput from '../components/RatingInput'
import { createOrUpdateOtt, fetchOtt, updateReleaseSconnectedId, fetchDigitalById } from '../services/ottService'
import TagInput from '../components/OttTagInput'
import { fetchReleases } from '../services/releaseService'
import moment from 'moment'
import RenderHTML from 'react-native-render-html'
import { TextInput } from 'react-native'

const NewOtt = () => {

  const post = useLocalSearchParams();
  const { user } = useAuth();
  const bodyRef = useRef(''); 
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false); // Ref to prevent double submission
  const [selectedDate, setSelectedDate] = useState(null);
  const [file, setFile] = useState(null);
  const [filel, setFilel] = useState(null);
  // Progress tracking for direct release series
  const [uploadProgress, setUploadProgress] = useState(null); 
  const [rating, setRating] = useState(null);
  const [userRatingImpact, setUserRatingImpact] = useState(0);
  const [tags, setTags] = useState([]);
  const [imdb, setImdb] = useState('');
  // New states for connected releases
  const [connectedId, setConnectedId] = useState(null);
  const [expiredReleases, setExpiredReleases] = useState([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [selectedEndate, setselectedEndate] = useState(null);
  const [otts, setOtts] = useState([]);
  const [loadingOtts, setLoadingOtts] = useState(false);
  // Add directRelease state variable, default to false
  const [directRelease, setDirectRelease] = useState(false);
  // Add seriesType state variable, default to 'normal'
  const [seriesType, setSeriesType] = useState('normal'); // 'normal' or 'series'
  // Episodes state for series
  const [episodes, setEpisodes] = useState([{ episode_number: 1, episode_title: '', release_date: null, description: '', duration: '' }]);
  // Season number for series
  const [seasonNumber, setSeasonNumber] = useState('');
   // Film information fields as individual state variables
   const [lang, setLang] = useState('');
   const [genre, setGenre] = useState('');
   const [duration, setDuration] = useState('00:00:00');
   const [director, setDirector] = useState('');
   const [writer, setWriter] = useState('');
   const [music, setMusic] = useState('');
   const [dop, setDop] = useState('');
   const [edit, setEdit] = useState('');
   const [cast, setCast] = useState('');
  
  // Available OTT platforms
  const ottPlatforms = [
    'netflix', 'prime', 'disney', 'hbo', 'hulu', 'amc', 'zee5', 'sonyliv', 
    'paramountplus', 'appletvplus', 'hotstar', 'voot', 'aha', 'sunnxt', 
    'appletv', 'paramountx', 'peacocktv'
  ];

  // Fetch expired releases and otts data
  useEffect(() => {
    getExpiredReleases();
    getOttsData();
  }, []);

  const getOttsData = async () => {
    try {
      setLoadingOtts(true);
      const res = await fetchOtt(100); // Fetch a reasonable amount of OTTs
      
      if (res.success) {
        setOtts(res.data);
      } else {
        console.error('Failed to fetch OTTs data');
      }
    } catch (error) {
      console.error('Error fetching OTTs data:', error);
    } finally {
      setLoadingOtts(false);
    }
  };

  const getExpiredReleases = async () => {
    try {
      setLoadingReleases(true);
      const res = await fetchReleases(100); // Fetch a reasonable amount
      
      if (res.success) {
        const today = moment();
        
        // Filter releases to only include those where endDate exists and has passed
        let expired = res.data.filter(release => 
          release.endDate && today.isAfter(moment(release.endDate))
        );
        
        // Filter out releases that are already connected in otts data
        if (otts && otts.length > 0) {
          const connectedIds = otts
            .filter(ott => ott.connectedId !== null)
            .map(ott => ott.connectedId);
          
          expired = expired.filter(release => !connectedIds.includes(release.id));
        }
        
        setExpiredReleases(expired);
      } else {
        Alert.alert('Error', 'Failed to fetch expired releases');
      }
    } catch (error) {
      console.error('Error fetching expired releases:', error);
    } finally {
      setLoadingReleases(false);
    }
  };

  // Re-filter expired releases when otts data is loaded
  useEffect(() => {
    if (otts.length > 0 && expiredReleases.length > 0) {
      const connectedIds = otts
        .filter(ott => ott.connectedId !== null)
        .map(ott => ott.connectedId);
      
      const filteredReleases = expiredReleases.filter(
        release => !connectedIds.includes(release.id)
      );
      
      setExpiredReleases(filteredReleases);
    }
  }, [otts]);

  const titleTagsStyles = {
    div: {
        color: 'black',
        fontSize: hp(1.7),
        textAlign: 'left',
        fontWeight: '600'
    },
    p: {
        color: 'black',
        fontSize: hp(2.5),
        textAlign: 'left',
        fontWeight: 'bold'
    }
  }

  const handleEnddateSelect = (date) => {
    console.log('Selected date:', date);
    setselectedEndate(date); // This will now properly store the date
  };

  const handleDateSelect = (date) => {
    console.log('Selected date:', date);
    setSelectedDate(date);
  };

  useEffect(() => {
    const loadForEdit = async () => {
      if (post && post.id) {
        let source = post;

        // Prefer fresh data from backend (includes episodes, season, etc.)
        try {
          const res = await fetchDigitalById(post.id);
          if (res.success && res.data) {
            source = { ...source, ...res.data };
          }
        } catch (error) {
          console.error('Error fetching digital for edit:', error);
        }

        bodyRef.current = source.body || ''; 
        setFile(source.file || null);
        setFilel(source.filel || null); 
        setTags(source.tags || []);
        setConnectedId(source.connectedId || null);
        setDirectRelease(!!source.directRelease);
        setSeriesType(source.seriesType || 'normal');

        // Dates
        if (source.rDate) setSelectedDate(new Date(source.rDate));
        if (source.endDate) setselectedEndate(new Date(source.endDate));

        // Load film info if it exists
        if (source.lang) setLang(source.lang);
        if (source.genre) setGenre(source.genre);
        if (source.duration) setDuration(source.duration);
        if (source.director) setDirector(source.director);
        if (source.writer) setWriter(source.writer);
        if (source.music) setMusic(source.music);
        if (source.dop) setDop(source.dop);
        if (source.edit) setEdit(source.edit);
        if (source.cast) setCast(source.cast);
        if (source.imdb) setImdb(source.imdb);
        if (source.seasonNumber != null) setSeasonNumber(String(source.seasonNumber));
        if (source.tags) setTags(source.tags); // Load tags if they exist

        // Load episodes for series
        if (source.episodes && Array.isArray(source.episodes) && source.episodes.length > 0) {
          const normalizedEpisodes = source.episodes.map((ep, idx) => ({
            episode_number: ep.episode_number ?? idx + 1,
            episode_title: ep.episode_title || '',
            // Ensure release_date is a proper Date object for DatePicker
            release_date: ep.release_date ? new Date(ep.release_date) : null,
            description: ep.description || '',
            duration: ep.duration || '',
          }));
          setEpisodes(normalizedEpisodes);
        }

        setTimeout(() => {
          if (editorRef?.current?.setContentHTML && source.body) {
            editorRef.current.setContentHTML(source.body);
          }
        }, 300);
      }
    };

    loadForEdit();
  }, [post?.id])

  // Toggle direct release function
  const toggleDirectRelease = () => {
    setDirectRelease(previousState => !previousState);
    // Reset seriesType when disabling directRelease
    if (directRelease) {
      setSeriesType('normal');
      setEpisodes([{ episode_number: 1, episode_title: '', release_date: null, description: '', duration: '' }]);
    }
    console.log('Direct Release:', !directRelease);
  };

  // Toggle series type function
  const toggleSeriesType = (type) => {
    setSeriesType(type);
    if (type === 'normal') {
      // Reset episodes when switching to normal
      setEpisodes([{ episode_number: 1, episode_title: '', release_date: null, description: '', duration: '' }]);
    } else {
      // Initialize episodes when switching to series
      if (episodes.length === 0 || (episodes.length === 1 && !episodes[0].episode_title)) {
        setEpisodes([{ episode_number: 1, episode_title: '', release_date: null, description: '', duration: '' }]);
      }
    }
  };

  // post selection
  const onPick = async (isImage, allowEditing = true) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage 
          ? ['images'] 
          : ['videos'],
          allowsEditing: allowEditing,
         editable: 'true',
         aspect: [4, 3],
        quality: 1,
      };
  
      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
      if (!result.canceled) {
        const asset = result.assets[0];
  
        setFile({
          uri: asset.uri,
          type: isImage ? 'image' : 'video',
          name: asset.uri.split('/').pop(),
        });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media file');
    }
  };

  // For tile selection
  const onPickSecond = async (isImage) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage 
          ? ['images'] 
          : ['videos'],
        allowsEditing: false,
        quality: 1,
        base64: false,
        exif: false
      };
  
      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
      if (!result.canceled) {
        const asset = result.assets[0];
        
        setFilel({
          uri: asset.uri,
          type: isImage ? 'image' : 'video',
          name: asset.uri.split('/').pop(),
        });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick second media file');
    }
  };

  const isLocalFile = file => {
    if(!file) return null;
    if(typeof file === 'object') return true;
    return false;
  }

  const getFileType = file => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.type || 'image'; // Provide a default type
    }
    // For remote files
    return file.includes('postImage') ? 'image' : 'video';
  };

  const getFileUri = file => {
    if(!file) return null;
    if(isLocalFile(file)){
      return file.uri;
    }
    return getSupabaseFileUrl(file)?.uri;
  }

  const handleRatingChange = (value) => {
    console.log('Rating changed:', value);
    setRating(value);
  };

  const handleuserRatingImpactChange = (value) => {
    console.log('Impact Rating changed:', value);
    setUserRatingImpact(value);
  };

  // Function to add a platform tag
  const addPlatformTag = (platform) => {
    if (!tags.includes(platform)) {
      setTags([...tags, platform]);
    }
  };

  const handleCardSelect = (release) => {
    setConnectedId(release.id);
    
    // Add these lines to transfer data from selected card to form
    if (release.body) {
      bodyRef.current = release.body;
      editorRef?.current?.setContentHTML(release.body);
    }
    
    if (release.file) {
      setFile(release.file);
    }
    
    if (release.filel) {
      setFilel(release.filel);
    }

    if (release.filel) {
      setFilel(release.filel);
    }

    if (release.lang) {
      setLang(release.lang);
    }

    if (release.genre) {
      setGenre(release.genre);
    }

    if (release.duration) {
      setDuration(release.duration);
    }

    if (release.director) {
      setDirector(release.director);
    }

    if (release.writer) {
      setWriter(release.writer);
    }

    if (release.music) {
      setMusic(release.music);
    }

    if (release.dop) {
      setDop(release.dop);
    }

    if (release.cast) {
      setEdit(release.cast);
    }

    if (release.defRating) {
      setRating(release.defRating);
    }
  };


  // Render each card in horizontal list
  const renderReleaseCard = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.releaseCard, 
        connectedId === item.id && styles.selectedReleaseCard
      ]}
      onPress={() => handleCardSelect(item)}
    >
      {item.file ? (
        <Image 
          source={{ uri: getFileUri(item.file) }} 
          style={styles.releaseCardImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Icon name="image" size={24} color={theme.colors.textLight} />
        </View>
      )}
      <View style={styles.cardTextContainer}>
        <RenderHTML
          contentWidth={wp(30)}
          source={{ html: item.body }}
          tagsStyles={titleTagsStyles}
        />
        {/* not able to get data from filel */}
        <Text style={styles.cardText}>{item.lang || "N/A"}</Text>
      </View>
    </TouchableOpacity>
  );

  const onSubmit = async () => {
    // Prevent double submission
    if (isSubmittingRef.current || loading) {
      return;
    }

    if (!selectedDate && !connectedId && !tags.length && !selectedEndate && !duration) {
      Alert.alert('Error', 'Enter Title, post img and release date, platforms');
      return;
    }

      // If connectedId exists, update the sconnectedId before creating/updating the OTT
      if (connectedId) {
        try {
          const result = await updateReleaseSconnectedId(connectedId);
          if (result.success) {
            console.log('Updated sconnectedId successfully:', result.data.sconnectedId);
          } else {
            console.error('Failed to update sconnectedId:', result.error);
            // You might want to alert the user or handle this error
          }
        } catch (error) {
          console.error('Error updating sconnectedId:', error);
        }
      }
    // if (!rating) {
    //   Alert.alert('Error', 'Please enter Rating of release');
    //   return;
    // }

    const normalizeDate = (date) => {
      if (!date) return null;
      // Set time to noon to avoid timezone issues with date shifts
      const normalized = new Date(date);
      normalized.setHours(12, 0, 0, 0);
      return normalized;
    };

    let data = {
      file, 
      filel, // Added second file to submission data selectedDate selectedEndate
      body: bodyRef.current,
      userId: user?.id,
      rDate: normalizeDate(selectedDate),
      endDate: normalizeDate(selectedDate),
      defRating: rating,
      userRatImpact: userRatingImpact,
      tags: tags,
      connectedId: connectedId,  // Connected ID added to data object
      directRelease: directRelease, // Include directRelease in the data
      seriesType: directRelease ? seriesType : 'normal', // Include seriesType when directRelease
      lang,
      genre,
      duration,
      director,
      writer,
      music,
      dop,
      edit,
      cast,
      imdb: imdb?.trim() || null,
      seasonNumber: seasonNumber ? Number(seasonNumber) : null,
      // Include episodes if it's a series
      ...(directRelease && seriesType === 'series' && { episodes })
    }

    // CREATING A NEW RELEASE 
    // Set submission flag immediately
    isSubmittingRef.current = true;
    setLoading(true);
    // Reset progress when starting upload (only for direct release series)
    if (directRelease && seriesType === 'series') {
      setUploadProgress({ percentage: 0, step: 0, message: "Preparing upload...", totalSteps: 4 });
    }
    
    // Progress callback for tracking upload progress
    const handleProgress = (progress) => {
      setUploadProgress(progress);
    };
    
    try {
      let res = await createOrUpdateOtt(data, handleProgress);
      setLoading(false);
      isSubmittingRef.current = false; // Reset submission flag
      if(res.success){
        setUploadProgress(null); // Clear progress on success
        setFile(null);
        setFilel(null); // Clear second file on success
        bodyRef.current = ''; 
        editorRef.current?.setContentHTML('');
        setTags([]);
        setConnectedId(null);
        setDirectRelease(false); // Reset directRelease to default
        setSeriesType('normal'); // Reset seriesType
        setEpisodes([{ episode_number: 1, episode_title: '', release_date: null, description: '', duration: '' }]); // Reset episodes
        setLang('');
        setGenre('');
        setDuration('');
        setDirector('');
        setWriter('');
        setMusic('');
        setDop('');
        setEdit('');
        setSeasonNumber('');
        setImdb('');
        Alert.alert('Stream uploaded successfully');
        router.push('/upcoming');
      }else{
        setUploadProgress(null); // Clear progress on error
        Alert.alert('Release', res.msg);
      }
    } catch (error) {
      console.error('Error creating/updating OTT:', error);
      setLoading(false);
      isSubmittingRef.current = false; // Reset submission flag on error
      setUploadProgress(null); // Clear progress on error
      Alert.alert('Error', 'Failed to create/update stream. Please try again.');
    }
  };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };
 
  return (
    <ScreenWrapper bg="#121212">
      <Header title={post?.id ? "Edit Ott Stream" : "Create Digital Stream"}
         showBackButton={true} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.userSection}>
              <Avatar
                uri={user?.image}
                size={hp(6.5)}
                rounded={theme.radius.xl}
              />
              <View style={{ gap: 2 }}>
                <Text style={styles.username}>
                  {truncateUsername(user?.name || '')}
                </Text>
                <Text style={styles.publicText}>
                  Public
                </Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Direct Release </Text>
              <Switch
                trackColor={{ false: "#767577", true: theme.colors.primary }}
                thumbColor={directRelease ? "#ffffff" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleDirectRelease} 
                value={directRelease}
              />
            </View>
          </View>
          
          {directRelease && (
            <>
            <View style={styles.directReleaseMessage}>
              <Text style={styles.directReleaseText}>Direct Release</Text>
            </View>

            {/* Series Type Toggle */}
            <View style={styles.seriesTypeContainer}>
              <Text style={styles.seriesTypeLabel}>Type:</Text>
              <View style={styles.seriesTypeToggle}>
                <TouchableOpacity
                  style={[
                    styles.seriesTypeButton,
                    seriesType === 'normal' && styles.seriesTypeButtonActive
                  ]}
                  onPress={() => toggleSeriesType('normal')}
                >
                          <Text style={[
                    styles.seriesTypeButtonText,
                    seriesType === 'normal' && styles.seriesTypeButtonTextActive
                  ]}>
                    Movies
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.seriesTypeButton,
                    seriesType === 'series' && styles.seriesTypeButtonActive
                  ]}
                  onPress={() => toggleSeriesType('series')}
                >
                  <Text style={[
                    styles.seriesTypeButtonText,
                    seriesType === 'series' && styles.seriesTypeButtonTextActive
                  ]}>
                    Series
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
          <RichTextEditor 
            editorRef={editorRef} 
            onChange={handleEditorChange}
            initialHeight={136}
            disableCopyPaste={true}
            placeholder="🚫No copy/paste - respect films 🎞️📽️🎥📹🚫Enter Film Title here @author ## write film name in a line ## please don't use any text alignment for this session and use default text font size ==>> like film name = Interstellar"  />
        </View>

          {file && (
            <View style={styles.file}>
              {getFileType(file) === 'video' ? (
                 <Text>Video not allowed</Text>
              ) : (
                <Image
                  source={{ uri: getFileUri(file) }}
                  style={{ width: '100%', height: '122%' }}
                  resizeMode="cover"
                  borderRadius={6}
                  onError={(error) => console.log('Image loading error:', error)}
                />
              )}
              <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
                <Icon name="delete" size={22} color={"red"} />
              </Pressable>
            </View>
          )}

          <View style={styles.media}>
            <Text style={styles.addImageText}>Landscape poster HERE</Text>
            <View style={styles.mediaIcons}>
              {/* This button will open the picker with allowsEditing: false */}
              <TouchableOpacity onPress={() => onPick(true)}>
                <Icon name="crop" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
              {/* This button will open the picker with allowsEditing: true (default)   onPress={() => onPick(true)} */}
              <TouchableOpacity onPress={() => onPick(true, false)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Added second image preview */}
          {filel && (
            <View style={styles.file}>
              {getFileType(filel) === 'video' ? (
                <Text>Error: video not allowed</Text>
              ) : (
                <Image
                  source={{ uri: getFileUri(filel) }}
                  style={{ width: '100%', height: '122%' }}
                  resizeMode="cover"
                  borderRadius={6}
                  onError={(error) => console.log('Image loading error:', error)}
                />
              )}
              <Pressable style={styles.closeIcon} onPress={() => setFilel(null)}>
                <Icon name="delete" size={22} color={"red"} />
              </Pressable>
            </View>
          )}

          {/* Added second image picker */}
          <View style={styles.media}>
            <Text style={styles.addImageText}>Portrait poster HERE</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPickSecond(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Film Information - Movies (Direct Release) */}
          {seriesType === 'normal' && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Film Information</Text>
              </View>

              {/* IMDB Link Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>IMDB Link</Text>
                <TextInput
                  style={styles.input}
                  value={imdb}
                  onChangeText={setImdb}
                  placeholder="https://www.imdb.com/title/..."
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* Language Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Language</Text>
                <TextInput
                  style={styles.input}
                  value={lang}
                  onChangeText={setLang}
                  placeholder="Enter film language"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* Genre Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Genre</Text>
                <TextInput
                  style={styles.input}
                  value={genre}
                  onChangeText={setGenre}
                  placeholder="Enter film genre"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* Duration Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Duration (must include HH:MM:SS ✔️)</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="Enter film duration (HH:MM:SS)"
                  keyboardType="default"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* Director Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Director</Text>
                <TextInput
                  style={styles.input}
                  value={director}
                  onChangeText={setDirector}
                  placeholder="Enter film director"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* Writer Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Writer</Text>
                <TextInput
                  style={styles.input}
                  value={writer}
                  onChangeText={setWriter}
                  placeholder="Enter film writer"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* Music Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Music</Text>
                <TextInput
                  style={styles.input}
                  value={music}
                  onChangeText={setMusic}
                  placeholder="Enter music composer"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* DOP Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Director of Photography</Text>
                <TextInput
                  style={styles.input}
                  value={dop}
                  onChangeText={setDop}
                  placeholder="Enter DOP"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* Edit Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Editor</Text>
                <TextInput
                  style={styles.input}
                  value={edit}
                  onChangeText={setEdit}
                  placeholder="Enter film editor"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* Cast Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cast</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={cast}
                  onChangeText={setCast}
                  placeholder="Enter cast members"
                  multiline={true}
                  numberOfLines={4}
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            </>
          )}
          </>
          )}
          
          <View>
            <DatePicker 
              onDateSelect={(date) => handleDateSelect(date)}
              initialDate={selectedDate}
            />
          </View>
          
          <View>
            <DatePicker 
              onDateSelect={(date) => handleEnddateSelect(date)}
              initialDate={selectedEndate}
              label="Select End Date"
            />
          </View>
          
          {/* Horizontal Scrollable Cards */}
          {!directRelease && (

            <View style={styles.releasesContainer}>
            <Text style={styles.releasesTitle}>Connect to Library Release</Text>

            {loadingReleases || loadingOtts ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading releases...</Text>
              </View>
            ) : expiredReleases.length > 0 ? (
              <FlatList
                horizontal
                data={expiredReleases}
                renderItem={renderReleaseCard}
                keyExtractor={(item) => `expired-release-${item.id}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.releaseListContainer}
              />
            ) : (
              <View style={styles.noReleasesContainer}>
                <Text style={styles.noReleasesText}>No available releases found</Text>
              </View>
            )}

            {connectedId && (
              <View style={styles.connectedInfo}>
                <Text style={styles.connectedText}>
                  Connected to release ID: {connectedId}
                </Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setConnectedId(null)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
          )}
        
          {/* Platform Pills Section */}
          <View style={styles.platformsContainer}>
            <Text style={styles.platformsTitle}>Available Platforms</Text>
            <View style={styles.platformsScrollContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.platformPills}>
                  {ottPlatforms.map((platform, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[
                        styles.platformPill,
                        tags.includes(platform) && styles.platformPillSelected
                      ]}
                      onPress={() => addPlatformTag(platform)}
                    >
                      <Text 
                        style={[
                          styles.platformPillText,
                          tags.includes(platform) && styles.platformPillTextSelected
                        ]}
                      >
                        {platform}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          
          <TagInput tags={tags} setTags={setTags} />
         

         {directRelease && (
             <RatingInput
             onRatingChange={handleRatingChange}
             initialValue={post?.rating}
           />
         )}

         {/* <UserRatingImpact
            onRatingChange={handleuserRatingImpactChange}
            initialValue={post?.rating}
          /> */}

          {/* Episodes Section for Series */}
          {directRelease && seriesType === 'series' && (
            <>
              {/* Season Number */}
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Season Details</Text>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Season Number</Text>
                <TextInput
                  style={styles.input}
                  value={seasonNumber}
                  onChangeText={setSeasonNumber}
            placeholder="Enter season number (e.g., 1)"
                  keyboardType="numeric"
            placeholderTextColor="#9E9E9E"
                />
              </View>

              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Episodes</Text>
              </View>
              
              {episodes.map((episode, index) => (
                <View key={index} style={styles.episodeContainer}>
                  <View style={styles.episodeHeader}>
                    <Text style={styles.episodeNumber}>Episode {episode.episode_number}</Text>
                    {episodes.length > 1 && (
                      <TouchableOpacity
                        onPress={() => {
                          const newEpisodes = episodes.filter((_, i) => i !== index);
                          // Renumber episodes
                          newEpisodes.forEach((ep, i) => {
                            ep.episode_number = i + 1;
                          });
                          setEpisodes(newEpisodes);
                        }}
                        style={styles.deleteEpisodeButton}
                      >
                        <Icon name="delete" size={hp(2)} color="red" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Episode Title</Text>
                    <TextInput
                      style={styles.input}
                      value={episode.episode_title}
                      onChangeText={(text) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].episode_title = text;
                        setEpisodes(newEpisodes);
                      }}
                      placeholder="Enter episode title"
                      placeholderTextColor="#9E9E9E"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Release Date</Text>
                    <DatePicker
                      onDateSelect={(date) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].release_date = date;
                        setEpisodes(newEpisodes);
                      }}
                      initialDate={episode.release_date}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Duration (HH:MM:SS)</Text>
                    <TextInput
                      style={styles.input}
                      value={episode.duration}
                      onChangeText={(text) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].duration = text;
                        setEpisodes(newEpisodes);
                      }}
                      placeholder="00:45:00"
                      placeholderTextColor="#9E9E9E"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.multilineInput]}
                      value={episode.description}
                      onChangeText={(text) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].description = text;
                        setEpisodes(newEpisodes);
                      }}
                      placeholder="Enter episode description"
                      multiline={true}
                      numberOfLines={3}
                      placeholderTextColor="#9E9E9E"
                    />
                  </View>
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addEpisodeButton}
                onPress={() => {
                  setEpisodes([
                    ...episodes,
                    {
                      episode_number: episodes.length + 1,
                      episode_title: '',
                      release_date: null,
                      description: '',
                      duration: ''
                    }
                  ]);
                }}
              >
                <Icon name="add" size={hp(2.5)} color={theme.colors.primary} />
                <Text style={styles.addEpisodeButtonText}>Add Episode</Text>
              </TouchableOpacity>
            </>
          )}

        
         
        </ScrollView>
        <Button
          buttonStyle={{ height: hp(6.2) }}
          title={post?.id ? "Edit" : "Post New Stream"}
          loading={loading}
          onPress={onSubmit}
          hasShadow={false}
        />
        {/* Progress Bar for Direct Release Series */}
        {directRelease && seriesType === 'series' && uploadProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>{uploadProgress.message}</Text>
              <Text style={styles.progressPercentage}>{Math.round(uploadProgress.percentage)}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${uploadProgress.percentage}%` }
                ]} 
              />
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default NewOtt;

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: wp(4), 
    gap: 15,
    backgroundColor: '#121212',
  },
  file: {
    height: hp(32),
    width: '100%',
    overflow: 'hidden',
    borderCurve: 'continuous',
    paddingVertical: wp(8),
    // Add these properties to make it visible
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: theme.radius.md,
    padding: 7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  media: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    borderWidth: 1, 
    padding: 12, 
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md, 
    borderCurve: 'continuous', 
    borderColor: '#333333',
    backgroundColor: '#181818',
  },
  title: {
    // marginBottom: 10,
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: '#FFFFFF',
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
   // marginBottom: 4,
  },
  directReleaseMessage: {
    padding: 10,
    backgroundColor: theme.colors.primary + '20', 
    alignItems: 'center',
  },
  directReleaseText: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.primary,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: '#FFFFFF',
  },
  mediaIcons: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    marginLeft: 10
  },
  addImageText: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  avatar: {
    height: hp(6.5),
    width: hp(6.5),
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: '#B3B3B3',
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 12,
    padding: 6,
    borderRadius: 50,
    backgroundColor: 'rgba(97, 35, 35, 0.14)',
  },
  label: {
    fontSize: hp(2),
    fontWeight: hp(4.5),
    paddingStart: 10,
    color: '#FFFFFF',
    paddingBottom: 5
  },
  dateInput: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: '#FFFFFF',
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    marginTop: 10,
  },
  // New styles for platform pills
  platformsContainer: {
    marginVertical: 5
  },
  platformsTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: '#FFFFFF',
    marginBottom: 10
  },
  platformsScrollContainer: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: theme.radius.md,
    padding: 10,
    borderCurve: 'continuous',
  },
  platformPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 5,
  },
  platformPill: {
    backgroundColor: '#262626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  platformPillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  platformPillText: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: '#E0E0E0',
  },
  platformPillTextSelected: {
    color: '#ffffff',
  },
  // New styles for horizontal release cards
  releasesContainer: {
    marginVertical: 10,
  },
  releasesTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    marginBottom: 10
  },
  releaseListContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  releaseCard: {
    width: wp(35),
    height: hp(20),
    marginRight: 12,
    borderRadius: theme.radius.md,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedReleaseCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  releaseCardImage: {
    width: '100%',
    height: '60%',
  },
  placeholderImage: {
    width: '100%',
    height: '60%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    padding: 8,
    flex: 1,
    justifyContent: 'center',
  },
  releaseCardBody: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    lineHeight: hp(1.8),
  },
  loadingContainer: {
    height: hp(15),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
  },
  loadingText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  noReleasesContainer: {
    height: hp(15),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
  },
  noReleasesText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  connectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 5,
  },
  connectedText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.primary,
  },
  removeButton: {
    padding: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  removeButtonText: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    color: 'red',
  },
  sectionDivider: {
    marginVertical: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: theme.colors.gray,
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: hp(1.8),
  },
  multilineInput: {
    minHeight: hp(10),
    textAlignVertical: 'top',
  },
  seriesTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    marginVertical: hp(1),
  },
  seriesTypeLabel: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  seriesTypeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  seriesTypeButton: {
    paddingHorizontal: wp(6),
    paddingVertical: hp(1),
    backgroundColor: '#f0f0f0',
  },
  seriesTypeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  seriesTypeButtonText: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  seriesTypeButtonTextActive: {
    color: '#ffffff',
    fontWeight: theme.fonts.semibold,
  },
  episodeContainer: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(2),
    backgroundColor: '#181818',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  episodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  episodeNumber: {
    fontSize: hp(2),
    fontWeight: theme.fonts.bold,
    color: '#FFFFFF',
  },
  deleteEpisodeButton: {
    padding: wp(2),
  },
  addEpisodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
    marginTop: hp(1),
    gap: wp(2),
  },
  addEpisodeButtonText: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.primary,
  },
  progressContainer: {
    marginTop: hp(1.5),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  progressText: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    flex: 1,
  },
  progressPercentage: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.primary,
    marginLeft: wp(2),
  },
  progressBarBackground: {
    height: hp(0.6),
    backgroundColor: '#333333',
    borderRadius: hp(0.3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: hp(0.3),
    transition: 'width 0.3s ease',
  },
})