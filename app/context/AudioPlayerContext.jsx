import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AudioPlayerContext = createContext();

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}

export default function AudioPlayerProvider({ children }) {
  const [currentStory, setCurrentStory] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    console.log('AudioPlayerProvider mounted');
    // Initialize audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).then(() => {
      console.log('Audio mode initialized');
    }).catch(error => {
      console.error('Error initializing audio mode:', error);
    });

    loadCurrentStory();

    return () => {
      console.log('AudioPlayerProvider unmounting, cleaning up...');
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = async () => {
    console.log('Cleaning up audio...');
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        console.log('Audio cleaned up successfully');
      } catch (error) {
        console.error('Error cleaning up audio:', error);
      }
    }
  };

  const closePlayer = async () => {
    console.log('Closing player...');
    await cleanupAudio();
    setCurrentStory(null);
    setIsPlaying(false);
    await AsyncStorage.removeItem('currentPlayingStory');
    console.log('Player closed');
  };

  const loadCurrentStory = async () => {
    try {
      console.log('Loading current story...');
      const storyData = await AsyncStorage.getItem('currentPlayingStory');
      if (storyData) {
        const story = JSON.parse(storyData);
        console.log('Found saved story:', story.title);
        setCurrentStory(story);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: story.audioUrl },
          { shouldPlay: false }
        );
        setSound(newSound);
        console.log('Audio loaded successfully');
      } else {
        console.log('No saved story found');
      }
    } catch (error) {
      console.error('Error loading current story:', error);
    }
  };

  const loadAndPlayStory = async (story) => {
    try {
      console.log('Loading and playing new story:', story.title);
      
      // Clean up existing audio first
      await cleanupAudio();
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: story.audioUrl },
        { shouldPlay: true }
      );
      console.log('New audio created and playing');
      
      setSound(newSound);
      setCurrentStory(story);
      setIsPlaying(true);

      await AsyncStorage.setItem('currentPlayingStory', JSON.stringify(story));
      console.log('Story saved to storage');

      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          console.log('Playback finished');
          await closePlayer();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) {
      console.log('No sound object available');
      return;
    }

    try {
      console.log('Toggling play/pause, current state:', isPlaying);
      if (isPlaying) {
        await sound.pauseAsync();
        console.log('Audio paused');
      } else {
        await sound.playAsync();
        console.log('Audio playing');
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const value = {
    currentStory,
    isPlaying,
    togglePlayPause,
    loadAndPlayStory,
    closePlayer,
    sound
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
} 