// cureently this is a useless component

import React, { useCallback, useState } from 'react';
import { Alert, Button, View } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { wp } from '../helpers/common';

const YouTubePlayer = ({ videoId = 'xz-wvFRQ-tk' }) => {  // below is the default video id
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state)=>{
    if (state === 'ended'){
      setPlaying(false);
      Alert.alert('Video Ended', 'Video has finished playing!');
    }
  }, []);

  const tooglePlaying = useCallback(()=>{
    setPlaying((prev) => !prev);
  }, []);
  
  return (
    <View style={styles.content}>
      <YoutubeIframe
        height={300}
        play={playing}
        videoId={videoId}
        onStateChange={onStateChange}
      />
      <Button title={playing ? 'Pause' : 'Play'} onPress={tooglePlaying} />
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