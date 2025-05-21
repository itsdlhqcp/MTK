import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable, FlatList, Switch } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
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
import { createOrUpdateOtt, fetchOtt, updateReleaseSconnectedId } from '../services/ottService'
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [file, setFile] = useState(null);
  const [filel, setFilel] = useState(null); 
  const [rating, setRating] = useState(null);
  const [userRatingImpact, setUserRatingImpact] = useState(0);
  const [tags, setTags] = useState([]);
  // New states for connected releases
  const [connectedId, setConnectedId] = useState(null);
  const [expiredReleases, setExpiredReleases] = useState([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [selectedEndate, setselectedEndate] = useState(null);
  const [otts, setOtts] = useState([]);
  const [loadingOtts, setLoadingOtts] = useState(false);
  // Add directRelease state variable, default to false
  const [directRelease, setDirectRelease] = useState(false);
   // Film information fields as individual state variables
   const [lang, setLang] = useState('');
   const [genre, setGenre] = useState('');
   const [duration, setDuration] = useState('');
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
    if(post && post.id){
      bodyRef.current = post.body; 
      setFile(post.file || null);
      setFilel(post.filel || null); 
      setTags(post.tags || []);
      setConnectedId(post.connectedId || null);
      setDirectRelease(post.directRelease || false);

      // Load film info if it exists
      if (post.lang) setLang(post.lang);
      if (post.genre) setGenre(post.genre);
      if (post.duration) setDuration(post.duration);
      if (post.director) setDirector(post.director);
      if (post.writer) setWriter(post.writer);
      if (post.music) setMusic(post.music);
      if (post.dop) setDop(post.dop);
      if (post.edit) setEdit(post.edit);
      if (post.cast) setCast(post.cast);
      if (post.tags) setTags(post.tags); // Load tags if they exist

      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body);
      },300)
    }
  }, [post])

  // Toggle direct release function
  const toggleDirectRelease = () => {
    setDirectRelease(previousState => !previousState);
    console.log('Direct Release:', !directRelease);
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
      lang,
      genre,
      duration,
      director,
      writer,
      music,
      dop,
      edit,
      cast
    }

    // CREATING A NEW RELEASE 
    setLoading(true);
    let res = await createOrUpdateOtt(data);
    setLoading(false);
    if(res.success){
      setFile(null);
      setFilel(null); // Clear second file on success
      bodyRef.current = ''; 
      editorRef.current?.setContentHTML('');
      setTags([]);
      setConnectedId(null);
      setDirectRelease(false); // Reset directRelease to default
      setLang('');
      setGenre('');
      setDuration('');
      setDirector('');
      setWriter('');
      setMusic('');
      setDop('');
      setEdit('');
      Alert.alert('Stream uploaded successfully');
      router.push('/upcoming');
    }else{
      Alert.alert('Release', res.msg);
    }
  };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };

  return (
    <ScreenWrapper bg="white">
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
                  {user?.name}
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

          {/* Film Information Section */}

          {directRelease && (
             <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Film Information</Text>
          </View>
          )}
         
         {directRelease && (
          <>
              {/* Language Field */}
          <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Language</Text>
          <TextInput
            style={styles.input}
            value={lang}
            onChangeText={setLang}
            placeholder="Enter film language"
          />
        </View>
          </>
         )}
         
         {directRelease && (
          <>
               {/* Genre Field */}
          <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Genre</Text>
          <TextInput
            style={styles.input}
            value={genre}
            onChangeText={setGenre}
            placeholder="Enter film genre"
          />
            </View>
          </>
         )}
          
          {directRelease && (
            <>
               {/* Duration Field */}
          <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Duration (must include HH:MM:SS ✔️)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="Enter film duration (HH:MM:SS)"
            keyboardType="default"
          />
            </View>
            </>
          )}
        
        {directRelease && (
          <>
              {/* Director Field */}
           <View style={styles.inputContainer}>
           <Text style={styles.inputLabel}>Director</Text>
           <TextInput
             style={styles.input}
             value={director}
             onChangeText={setDirector}
             placeholder="Enter film director"
           />
         </View>
          </>
        )}
         
         {directRelease && (
        <>
              {/* Writer Field */}
           <View style={styles.inputContainer}>
           <Text style={styles.inputLabel}>Writer</Text>
           <TextInput
             style={styles.input}
             value={writer}
             onChangeText={setWriter}
             placeholder="Enter film writer"
           />
         </View>
        </>
         )}
         
         {directRelease && (
          <>
             {/* Music Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Music</Text>
            <TextInput
              style={styles.input}
              value={music}
              onChangeText={setMusic}
              placeholder="Enter music composer"
            />
          </View>
          </>
         )} 
          
         {directRelease && (
          <>
              {/* DOP Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Director of Photography</Text>
            <TextInput
              style={styles.input}
              value={dop}
              onChangeText={setDop}
              placeholder="Enter DOP"
            />
          </View>
          </>
         )}
         
          {directRelease && (
            <>
               {/* Edit Field */}
            <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Editor</Text>
            <TextInput
              style={styles.input}
              value={edit}
              onChangeText={setEdit}
              placeholder="Enter film editor"
            />
          </View>
            </>  
          )}
         
         {directRelease && (
          <>
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
          />
        </View>
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
  },
  file: {
    height: hp(32),
    width: '100%',
    overflow: 'hidden',
    borderCurve: 'continuous',
    paddingVertical: wp(8),
    // Add these properties to make it visible
    borderWidth: 1,
    borderColor: theme.colors.gray,
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
    borderColor: theme.colors.gray
  },
  title: {
    // marginBottom: 10,
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
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
    color: theme.colors.text,
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
    color: theme.colors.textLight,
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
    color: theme.colors.text,
    paddingBottom: 5
  },
  dateInput: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.gray,
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
    color: theme.colors.text,
    marginBottom: 10
  },
  platformsScrollContainer: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
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
    backgroundColor: '#f0f0f0',
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
    color: theme.colors.textLight,
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
})