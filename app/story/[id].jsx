import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { fetch } from 'react-native-fetch-api';
import Slider from '@react-native-community/slider';
import { Animated, PanResponder } from 'react-native';

export default function StoryDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [showTimePreview, setShowTimePreview] = useState(false);
  
  const soundRef = useRef(null);
  const progressBarWidth = useRef(0);
  const wasPlayingBeforeDrag = useRef(false);
  const previousVolume = useRef(1.0);
  const seekTimeout = useRef(null);
  const lastSeekTime = useRef(0);
  const SEEK_DEBOUNCE = Platform.select({
    ios: 100,
    android: 150,
    default: 100,
  });

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const playheadScale = useRef(new Animated.Value(1)).current;
  const playheadOpacity = useRef(new Animated.Value(0.8)).current;
  const timePreviewAnim = useRef(new Animated.Value(0)).current;

  const [progressBarLayout, setProgressBarLayout] = useState({ x: 0, width: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // PanResponder for progress bar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        setIsSeeking(true);
        setShowTimePreview(true);
        wasPlayingBeforeDrag.current = isPlaying;
        if (isPlaying) {
          soundRef.current?.pauseAsync();
        }

        // Calculate progress based on touch position relative to progress bar
        const touchX = evt.nativeEvent.pageX - progressBarLayout.x;
        const progress = Math.max(0, Math.min(1, touchX / progressBarLayout.width));
        setPreviewTime(progress * duration);
        
        // Stop any ongoing animations
        progressAnim.stopAnimation();
        progressAnim.setValue(progress);
        timePreviewAnim.setValue(progress);

        Animated.parallel([
          Animated.spring(playheadScale, {
            toValue: 1.5,
            useNativeDriver: true,
          }),
          Animated.spring(playheadOpacity, {
            toValue: 1,
            useNativeDriver: true,
          })
        ]).start();
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.pageX - progressBarLayout.x;
        const progress = Math.max(0, Math.min(1, touchX / progressBarLayout.width));
        const previewTimeValue = progress * duration;
        setPreviewTime(previewTimeValue);
        progressAnim.setValue(progress);
        timePreviewAnim.setValue(progress);
      },
      onPanResponderRelease: async (evt) => {
        const touchX = evt.nativeEvent.pageX - progressBarLayout.x;
        const progress = Math.max(0, Math.min(1, touchX / progressBarLayout.width));
        await handleSeek(progress);
        setIsDragging(false);
        setIsSeeking(false);
        setShowTimePreview(false);
        
        Animated.parallel([
          Animated.spring(playheadScale, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(playheadOpacity, {
            toValue: 0.8,
            useNativeDriver: true,
          })
        ]).start();

        if (wasPlayingBeforeDrag.current) {
          soundRef.current?.playAsync();
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setIsSeeking(false);
        setShowTimePreview(false);
        if (wasPlayingBeforeDrag.current) {
          soundRef.current?.playAsync();
        }
      }
    })
  ).current;

  // Update time preview position when progress changes
  useEffect(() => {
    timePreviewAnim.setValue(progressAnim._value);
  }, [progressAnim._value]);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();
    return () => {
      cleanupAudio();
    };
  }, []);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const API_URL = 'http://192.168.0.105:3000';
        const response = await fetch(`${API_URL}/api/stories/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch story');
        }
        const data = await response.json();
        setStory(data);
      } catch (error) {
        console.error('Error fetching story:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  const handlePlayAudio = async () => {
    try {
      if (!story?.audioUrl) throw new Error('No audio URL available');
      await cleanupAudio();
  
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: story.audioUrl },
        {
          shouldPlay: false,
          volume: isMuted ? 0 : volume,
          rate: 1.0,
          shouldCorrectPitch: true,
          isLooping: isRepeat,
        }
      );
  
      soundRef.current = newSound;
      setSound(newSound);

      const status = await newSound.getStatusAsync();
      if (!status.isLoaded) {
        await new Promise((resolve) => {
          const checkLoaded = async () => {
            const currentStatus = await newSound.getStatusAsync();
            if (currentStatus.isLoaded) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      const loadedStatus = await newSound.getStatusAsync();
      if (loadedStatus.isLoaded) {
        setDuration(loadedStatus.durationMillis / 1000);
        await newSound.playAsync();
        setIsPlaying(true);
        startProgressAnimation();
      }

      newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    } catch (error) {
      console.error('Error playing audio:', error);
      setError(error.message);
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = useCallback(
    (status) => {
      if (status.isLoaded) {
        if (!isSeeking) {
          const newTime = status.positionMillis / 1000;
          setCurrentTime(newTime);
          if (status.durationMillis > 0) {
            progressAnim.setValue(newTime / (status.durationMillis / 1000));
          }
        }
        
        if (status.durationMillis && status.durationMillis / 1000 !== duration) {
          const newDuration = status.durationMillis / 1000;
          setDuration(newDuration);
        }
  
        if (status.didJustFinish) {
          if (isRepeat) {
            soundRef.current?.setPositionAsync(0);
            soundRef.current?.playAsync();
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
            progressAnim.setValue(0);
            cleanupAudio();
          }
        }

        setIsBuffering(status.isBuffering);
      } else if (status.error) {
        console.error(`Playback Error: ${status.error}`);
        setError(status.error);
        setIsPlaying(false);
      }
    },
    [isSeeking, duration, isRepeat]
  );

  const startProgressAnimation = () => {
    if (duration <= 0) return;
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: (duration - currentTime) * 1000,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && isPlaying) {
        startProgressAnimation();
      }
    });
  };

  const handleSeek = async (value) => {
    try {
      if (!soundRef.current) return;
      
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) {
        await new Promise((resolve) => {
          const checkLoaded = async () => {
            const currentStatus = await soundRef.current.getStatusAsync();
            if (currentStatus.isLoaded) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      const newPosition = Math.max(0, Math.min(duration, value * duration));
      await soundRef.current.setPositionAsync(newPosition * 1000);
      setCurrentTime(newPosition);
      
      // Update animations
      progressAnim.setValue(value);
      timePreviewAnim.setValue(value);
      
      // If playing, restart the progress animation
      if (isPlaying) {
        startProgressAnimation();
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const togglePlayPause = async () => {
    try {
      if (!soundRef.current) {
        await handlePlayAudio();
        return;
      }

      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) {
        console.log('Waiting for sound to load...');
        await new Promise((resolve) => {
          const checkLoaded = async () => {
            const currentStatus = await soundRef.current.getStatusAsync();
            if (currentStatus.isLoaded) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      if (isPlaying) {
        await soundRef.current.pauseAsync();
        progressAnim.stopAnimation();
      } else {
        if (status.didJustFinish) {
          await soundRef.current.setPositionAsync(0);
          setCurrentTime(0);
          progressAnim.setValue(0);
        }
        await soundRef.current.playAsync();
        if (duration > 0) {
          startProgressAnimation();
        }
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setError(error.message);
      setIsPlaying(false);
    }
  };

  const handleSkip = async (seconds) => {
    try {
      if (!soundRef.current) return;
      
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) {
        console.log('Waiting for sound to load...');
        await new Promise((resolve) => {
          const checkLoaded = async () => {
            const currentStatus = await soundRef.current.getStatusAsync();
            if (currentStatus.isLoaded) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      const newPosition = Math.max(0, Math.min(duration, currentTime + seconds));
      await soundRef.current.setPositionAsync(newPosition * 1000);
      setCurrentTime(newPosition);
      progressAnim.setValue(newPosition / duration);
    } catch (error) {
      console.error('Error skipping:', error);
      setError(error.message);
    }
  };

  const toggleMute = async () => {
    try {
      if (!soundRef.current) return;
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      const newMuteState = !isMuted;
      if (newMuteState) {
        previousVolume.current = volume;
        await soundRef.current.setVolumeAsync(0);
      } else {
        await soundRef.current.setVolumeAsync(previousVolume.current);
      }
      setIsMuted(newMuteState);
    } catch (error) {
      console.error('Error toggling mute:', error);
      setError(error.message);
    }
  };

  const handleVolumeChange = async (value) => {
    try {
      if (!soundRef.current) return;
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      const newVolume = value;
      await soundRef.current.setVolumeAsync(newVolume);
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    } catch (error) {
      console.error('Error changing volume:', error);
      setError(error.message);
    }
  };

  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
    if (soundRef.current) {
      soundRef.current.setIsLoopingAsync(!isRepeat);
    }
  };

  const cleanupAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setSound(null);
      }
      if (seekTimeout.current) {
        clearTimeout(seekTimeout.current);
        seekTimeout.current = null;
      }
      progressAnim.setValue(0);
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FFF" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-center px-4">{error}</Text>
        <TouchableOpacity
          className="mt-4 px-4 py-2 bg-white/10 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Story not found</Text>
        <TouchableOpacity
          className="mt-4 px-4 py-2 bg-white/10 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={() => router.push('/stories')}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Story Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1">
          {/* Story Content */}
          <View className="px-4 py-6">
            <View className="items-center mb-6">
              <View className="w-32 h-32 rounded-lg bg-white/10 justify-center items-center mb-4">
                <Ionicons
                  name={
                    story.mood === 'happy' ? 'sunny' :
                    story.mood === 'sad' ? 'sad' :
                    story.mood === 'angry' ? 'flame' :
                    story.mood === 'joy' ? 'happy' :
                    story.mood === 'surprise' ? 'alert' :
                    story.mood === 'calm' ? 'water' :
                    story.mood === 'mysterious' ? 'moon' : 'flash'
                  }
                  size={48}
                  color="#FFF"
                />
              </View>
              <Text className="text-2xl font-bold text-white text-center mb-2">{story.title}</Text>
              <Text className="text-base text-gray-400 text-center">{story.narrator}</Text>
            </View>

            {/* Tags */}
            {story.tags && story.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-6">
                {story.tags.map((tag, index) => (
                  <View key={index} className="px-3 py-1 rounded-full bg-white/10">
                    <Text className="text-sm text-white">{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Story Info */}
            <View className="bg-white/5 rounded-lg p-4 mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-400">Duration</Text>
                <Text className="text-white">{story.duration || '0:00'}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-400">Language</Text>
                <Text className="text-white">{story.language}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-400">Age Category</Text>
                <Text className="text-white">{story.ageCategory}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-400">Genre</Text>
                <Text className="text-white">{story.genre}</Text>
              </View>
            </View>

            {/* Description */}
            {story.metadata?.description && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-white mb-2">Description</Text>
                <Text className="text-gray-400">{story.metadata.description}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Enhanced Audio Player */}
        {story?.audioUrl && (
          <View className="px-4 py-4 bg-black/50">
            {/* Progress Bar */}
            <View className="flex-row items-center mb-4">
              <Text className="text-white text-xs w-12">{formatTime(isSeeking ? previewTime : currentTime)}</Text>
              <View 
                className="flex-1 h-12 justify-center"
                onLayout={(event) => {
                  const { x, width } = event.nativeEvent.layout;
                  setProgressBarLayout({ x, width });
                  progressBarWidth.current = width;
                }}
              >
                <View 
                  className="h-1 bg-white/20 rounded-full overflow-hidden"
                  {...panResponder.panHandlers}
                >
                  <Animated.View
                    className="h-full bg-[#1DB954] rounded-full absolute"
                    style={{
                      transform: [{
                        translateX: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-progressBarLayout.width, 0],
                        })
                      }],
                      width: progressBarLayout.width,
                    }}
                  />
                </View>
                <Animated.View
                  className="absolute w-4 h-4 bg-white rounded-full -top-1.5"
                  style={{
                    transform: [
                      {
                        translateX: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, progressBarLayout.width],
                        })
                      },
                      { scale: playheadScale }
                    ],
                    opacity: playheadOpacity,
                  }}
                />
              </View>
              <Text className="text-white text-xs w-12 text-right">{formatTime(duration)}</Text>
            </View>

            {/* Time Preview */}
            {showTimePreview && (
              <Animated.View 
                className="absolute -top-8 bg-black/80 px-2 py-1 rounded"
                style={{
                  transform: [
                    {
                      translateX: timePreviewAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [progressBarLayout.x, progressBarLayout.x + progressBarLayout.width],
                      })
                    },
                    { translateX: -20 }
                  ]
                }}
              >
                <Text className="text-white text-xs">{formatTime(previewTime)}</Text>
              </Animated.View>
            )}

            {/* Playback Controls */}
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => handleSkip(-10)} className="p-2">
                <Ionicons name="play-back" size={24} color="#FFF" />
                <Text className="text-white text-xs text-center">-10s</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlayPause} className="p-2">
                <Ionicons
                  name={isPlaying ? "pause-circle" : "play-circle"}
                  size={48}
                  color="#1DB954"
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleSkip(10)} className="p-2">
                <Ionicons name="play-forward" size={24} color="#FFF" />
                <Text className="text-white text-xs text-center">+10s</Text>
              </TouchableOpacity>
            </View>

            {/* Volume Controls */}
            <View className="flex-row items-center">
              <TouchableOpacity onPress={toggleMute} className="p-2">
                <Ionicons
                  name={isMuted ? "volume-mute" : "volume-high"}
                  size={24}
                  color="#FFF"
                />
              </TouchableOpacity>
              <Slider
                style={{ flex: 1, height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor="#1DB954"
                maximumTrackTintColor="#FFFFFF"
                thumbTintColor="#1DB954"
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}