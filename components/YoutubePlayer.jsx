// import React, { useState, useCallback, useRef } from "react";
// import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
// import YoutubePlayer from "react-native-youtube-iframe";
// import { hp, wp } from '../helpers/common';
// import theme from '../constants/theme';

// const YouTubePlayer = ({ videoId, onClose }) => {
//   const [playing, setPlaying] = useState(true);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  
//   const playerRef = useRef(null);

//   const onStateChange = useCallback((state) => {
//     if (state === "ended") {
//       setPlaying(false);
//     }
//   }, []);

//   const onReady = useCallback(() => {
//     setLoading(false);
//   }, []);

//   const onError = useCallback((e) => {
//     setError("An error occurred. Please try again.");
//     setLoading(false);
//   }, []);

//   return (
//     <View style={styles.container}>
//       {loading && (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={theme.colors.primary || "#FF0000"} />
//           <Text style={styles.loadingText}>Loading video...</Text>
//         </View>
//       )}
      
//       {error && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       )}
      
//       <YoutubePlayer
//         ref={playerRef}
//         height={hp(40)}
//         play={playing}
//         videoId={videoId}
//         onChangeState={onStateChange}
//         onReady={onReady}
//         onError={onError}
//         webViewProps={{
//           renderToHardwareTextureAndroid: true,
//           androidLayerType: Platform.OS === 'android' && Platform.Version <= 22 ? 'hardware' : 'none',
//         }}
//         webViewStyle={{ opacity: 0.99 }}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     height: hp(40),
//     width: '100%',
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//     overflow: 'hidden',
//     backgroundColor: '#121212',
//   },
//   loadingContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//     backgroundColor: '#121212',
//   },
//   loadingText: {
//     color: '#fff',
//     marginTop: 10,
//     fontSize: hp(1.8),
//   },
//   errorContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//     backgroundColor: '#121212',
//   },
//   errorText: {
//     color: '#ff3b30',
//     fontSize: hp(1.8),
//   }
// });

// export default YouTubePlayer;



// import React, { useState } from 'react';
// import { StyleSheet } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import YoutubeIframe from 'react-native-youtube-iframe';

// const YouTubePlayer = ({ videoId = 'xz-wvFRQ-tk' }) => {
//   const [playing, setPlaying] = useState(false);

//   return (
//     <SafeAreaView style={styles.container}>
//       <YoutubeIframe
//         height={300}
//         play={playing}
//         videoId={videoId}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginTop: 32,
//     paddingHorizontal: 24,
//   },
// });

// export default YouTubePlayer;


import React, { useState } from 'react';
import { View } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { wp } from '../helpers/common';

const YouTubePlayer = ({ videoId = 'xz-wvFRQ-tk' }) => {
  const [playing, setPlaying] = useState(false);
  
  return (
    <View style={styles.content}>
      <YoutubeIframe
        height={300}
        play={playing}
        videoId={videoId}
      />
    </View>
  );
};

const styles = {
  content: {
    paddingHorizontal: wp(1.4),
    marginTop: 4,
  },
};

export default YouTubePlayer;