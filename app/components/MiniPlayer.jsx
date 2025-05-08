import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAudioPlayer } from '../context/AudioPlayerContext';

export default function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentStory, isPlaying, togglePlayPause, closePlayer, sound } = useAudioPlayer();

  useEffect(() => {
    let statusListener;
    if (sound) {
      statusListener = sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          togglePlayPause();
        }
      });
    }
    return () => {
      if (statusListener) {
        statusListener.remove();
      }
    };
  }, [sound]);

  if (!currentStory) return null;

  const handlePress = () => {
    // Only navigate if we're not already on the story detail page
    if (!pathname.includes('/story-detail')) {
      router.push({
        pathname: '/story-detail',
        params: {
          storyId: currentStory.id,
          story: JSON.stringify(currentStory)
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentStory.title}
          </Text>
          <Text style={styles.narrator} numberOfLines={1}>
            {currentStory.author}
          </Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={togglePlayPause}
            style={styles.playButton}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={closePlayer}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#282828',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  info: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  narrator: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#404040',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 