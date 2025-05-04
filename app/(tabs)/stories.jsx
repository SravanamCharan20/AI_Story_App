import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated, Modal, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { PanResponder, TouchableWithoutFeedback } from 'react-native';

const { width } = Dimensions.get('window');

const moodColors = {
  happy: ['#FAD0C4', '#FFD1FF'],         // Peachy Cream to Soft Orchid
  sad: ['#A1C4FD', '#C2E9FB'],           // Light Steel Blue to Baby Blue
  angry: ['#FF9A9E', '#FDCB82'],         // Watermelon Red to Toasted Apricot
  joy: ['#F6D365', '#FDA085'],           // Soft Sunshine to Peach Blush
  surprise: ['#FBC2EB', '#A6C1EE'],      // Blush Pink to Dreamy Blue
  calm: ['#D4FC79', '#96E6A1'],          // Sage Green to Fresh Mint
  mysterious: ['#667EEA', '#764BA2'],    // Indigo Fog to Royal Lavender
  exciting: ['#FDCB82', '#F8A1D1'],      // Pastel Orange to Petal Pink
  fear: ['#A18CD1', '#FBC2EB'],          // Dusky Purple to Misty Rose
  disgust: ['#C1DFCB', '#DEECDD'],       // Pale Sage to Eucalyptus Frost
  contempt: ['#C9D6FF', '#E2E2E2'],      // Blue Ice to Soft Silver
  neutral: ['#ECE9E6', '#FFFFFF'],       // Whisper Gray to Pure White
};


const categoryColors = {
  Fantasy: ['#FFB7B7', '#FF8C8C'],
  Drama: ['#B7D4FF', '#8CB4FF'],
  Adventure: ['#B7FFD8', '#8CFFC0'],
  Mystery: ['#D4B7FF', '#B48CFF'],
  Romance: ['black', 'black'],
  'Sci-Fi': ['#B7FFE4', '#8CFFD4'],
  Horror: ['#FFB7D4', '#FF8CB4'],
  Comedy: ['#FFE4B7', '#FFD48C'],
};

// Using shorter audio files for better performance
const moodAudios = {
  happy: require('../../assets/songs/Mysterious.mp3'),
  calm: require('../../assets/songs/Mysterious.mp3'),
  mysterious: require('../../assets/songs/Mysterious.mp3'),
  exciting: require('../../assets/songs/Mysterious.mp3'),
};

export default function Stories() {
  const navigation = useNavigation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [allStories, setAllStories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const soundObject = useRef(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const timeUpdateInterval = useRef(null);
  const isFocused = useIsFocused();
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const previousVolume = useRef(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showTimePreview, setShowTimePreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const progressBarWidth = useRef(0);
  const wasPlayingBeforeDrag = useRef(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const playheadScale = useRef(new Animated.Value(1)).current;
  const playheadOpacity = useRef(new Animated.Value(0.8)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const filterAnimation = useRef(new Animated.Value(0)).current;
  const searchBarWidth = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMood, setSelectedMood] = useState('All');
  const searchInputRef = useRef(null);
  const searchBarAnimation = useRef(new Animated.Value(0.85)).current;

  const defaultStories = [
    {
      id: 1,
      title: "The Magic Forest",
      mood: "mysterious",
      duration: "8:30",
      thumbnail: null,
      type: "default"
    },
    
  ];

  const storyCategories = [
    { id: 0, title: "All", color: ['#FFB7B7', '#FF8C8C'] },
    { id: 1, title: "My PDFs", color: ['#B7D4FF', '#8CB4FF'] },
    { id: 2, title: "Default Stories", color: ['#B7FFD8', '#8CFFC0'] },
  ];

  // Add this after the storyCategories array
  const moodFilters = [
    { id: 0, title: 'All', icon: 'apps' },
    { id: 1, title: 'happy', icon: 'sunny' },
    { id: 2, title: 'calm', icon: 'water' },
    { id: 3, title: 'mysterious', icon: 'moon' },
    { id: 4, title: 'exciting', icon: 'flash' },
  ];

  // Load all stories including uploaded PDFs
  useEffect(() => {
    const loadStories = async () => {
      try {
        const uploadedPDFs = await AsyncStorage.getItem('uploadedPDFs');
        const pdfStories = uploadedPDFs ? JSON.parse(uploadedPDFs) : [];
        const stories = [...defaultStories, ...pdfStories];
        setAllStories(stories);
      } catch (error) {
        console.log('Error loading stories:', error);
        setAllStories(defaultStories);
      }
    };

    if (isFocused) {
      loadStories();
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) {
      handleClose();
    }
  }, [isFocused]);

  const initializeAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.log('Error initializing audio:', error);
    }
  };

  const cleanupAudio = async () => {
    try {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      if (soundObject.current) {
        await soundObject.current.unloadAsync();
        soundObject.current = null;
      }
    } catch (error) {
      console.log('Error cleaning up audio:', error);
    }
  };

  const updatePlaybackTime = async () => {
    if (soundObject.current) {
      try {
        const status = await soundObject.current.getStatusAsync();
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis / 1000);
          
          if (status.didJustFinish && !isRepeat) {
            await handleClose();
          }
        }
      } catch (error) {
        console.log('Error updating playback time:', error);
      }
    }
  };

  const handleStoryPress = async (story) => {
    try {
      setIsLoading(true);
      await cleanupAudio();
      
      soundObject.current = new Audio.Sound();
      await initializeAudio();
      
      setSelectedStory(story);
      setShowPlayer(true);
      setCurrentTime(0);
      animatedValue.setValue(0);
      setIsPlaying(false);

      // Load the audio file based on story type
      if (story.type === 'generated') {
        // For generated stories, use the provided audioUrl
        await soundObject.current.loadAsync({ uri: story.audioUrl });
      } else {
        // For default stories, use the mood-based audio
        await soundObject.current.loadAsync(moodAudios[story.mood]);
      }
      
      // Set initial volume
      await soundObject.current.setVolumeAsync(volume);
      
      const status = await soundObject.current.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis / 1000);
        timeUpdateInterval.current = setInterval(updatePlaybackTime, 1000);
      }
    } catch (error) {
      console.log('Error loading audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the filtered stories logic
  const getFilteredStories = () => {
    if (!allStories || !Array.isArray(allStories)) {
      return [];
    }

    return allStories
      .filter(story => {
        if (!story) return false;
        
        // Category filter
        if (selectedCategory !== "All") {
          if (selectedCategory === "My PDFs" && story.type !== "pdf") return false;
          if (selectedCategory === "Default Stories" && story.type !== "default") return false;
          if (selectedCategory === "Generated Stories" && story.type !== "generated") return false;
        }
        
        // Mood filter
        if (selectedMood !== "All" && story.mood !== selectedMood.toLowerCase()) return false;
        
        // Search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            story.title?.toLowerCase().includes(query) ||
            story.mood?.toLowerCase().includes(query) ||
            story.duration?.toLowerCase().includes(query)
          );
        }
        
        return true;
      });
  };

  const togglePlayPause = async () => {
    if (!soundObject.current || isLoading) return;

    try {
      const status = await soundObject.current.getStatusAsync();
      if (!status.isLoaded) return;

      if (isPlaying) {
        await soundObject.current.pauseAsync();
      } else {
        if (status.didJustFinish) {
          await soundObject.current.setPositionAsync(0);
          setCurrentTime(0);
          animatedValue.setValue(0);
        }
        await soundObject.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.log('Error toggling play/pause:', error);
    }
  };

  const handleClose = async () => {
    try {
      await cleanupAudio();
      setIsPlaying(false);
      setShowPlayer(false);
      setCurrentTime(0);
      animatedValue.setValue(0);
      setSelectedStory(null);
    } catch (error) {
      console.log('Error closing player:', error);
    }
  };

  const skipBackward = async () => {
    try {
      const newTime = Math.max(0, currentTime - 10);
      await soundObject.current.setPositionAsync(newTime * 1000);
      setCurrentTime(newTime);
      animatedValue.setValue(newTime / duration);
    } catch (error) {
      console.log('Error skipping backward:', error);
    }
  };

  const skipForward = async () => {
    try {
      const newTime = Math.min(duration, currentTime + 10);
      await soundObject.current.setPositionAsync(newTime * 1000);
      setCurrentTime(newTime);
      animatedValue.setValue(newTime / duration);
    } catch (error) {
      console.log('Error skipping forward:', error);
    }
  };

  const startProgressAnimation = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: (duration - currentTime) * 1000,
      useNativeDriver: false,
    }).start();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const featuredStories = [
    {
      id: 1,
      title: "The Magical Garden",
      author: "Sarah Smith",
      duration: "8 min",
      rating: "4.9",
      icon: "flower"
    },
    {
      id: 2,
      title: "Ocean Adventures",
      author: "Mike Johnson",
      duration: "12 min",
      rating: "4.8",
      icon: "boat"
    },
    {
      id: 3,
      title: "Sky Pirates",
      author: "Emma Davis",
      duration: "10 min",
      rating: "4.7",
      icon: "airplane"
    },
  ];

  // Add this function to handle volume changes
  const handleVolumeChange = async (value) => {
    try {
      if (soundObject.current) {
        await soundObject.current.setVolumeAsync(value);
        setVolume(value);
        if (value > 0) setIsMuted(false);
        if (value === 0) setIsMuted(true);
      }
    } catch (error) {
      console.log('Error changing volume:', error);
    }
  };

  // Add function to toggle mute
  const toggleMute = async () => {
    try {
      if (soundObject.current) {
        if (isMuted) {
          await soundObject.current.setVolumeAsync(previousVolume.current);
          setVolume(previousVolume.current);
        } else {
          previousVolume.current = volume;
          await soundObject.current.setVolumeAsync(0);
          setVolume(0);
        }
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.log('Error toggling mute:', error);
    }
  };

  // Add function to handle repeat mode
  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
    if (soundObject.current) {
      soundObject.current.setIsLoopingAsync(!isRepeat);
    }
  };

  // Add PanResponder for progress bar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        setShowTimePreview(true);
        wasPlayingBeforeDrag.current = isPlaying;
        if (isPlaying) {
          soundObject.current?.pauseAsync();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const progress = Math.max(0, Math.min(1, gestureState.moveX / progressBarWidth.current));
        const previewTimeValue = progress * duration;
        setPreviewTime(previewTimeValue);
        setCurrentTime(previewTimeValue);
      },
      onPanResponderRelease: async (evt, gestureState) => {
        const progress = Math.max(0, Math.min(1, gestureState.moveX / progressBarWidth.current));
        await handleSeek(progress);
        setIsDragging(false);
        setShowTimePreview(false);
        if (wasPlayingBeforeDrag.current) {
          soundObject.current?.playAsync();
        }
      },
    })
  ).current;

  // Enhanced handleSeek function
  const handleSeek = async (value) => {
    try {
      if (soundObject.current) {
        setIsBuffering(true);
        const newPosition = value * duration;
        await soundObject.current.setPositionAsync(newPosition * 1000);
        setCurrentTime(newPosition);
        setIsBuffering(false);
      }
    } catch (error) {
      console.log('Error seeking:', error);
      setIsBuffering(false);
    }
  };

  // Add function to handle double tap seeking
  const handleDoubleTap = async (direction) => {
    try {
      const skipAmount = 10; // seconds
      const newTime = direction === 'forward' 
        ? Math.min(duration, currentTime + skipAmount)
        : Math.max(0, currentTime - skipAmount);
      
      await handleSeek(newTime / duration);
      
      // Show visual feedback
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } catch (error) {
      console.log('Error handling double tap:', error);
    }
  };

  // Add this after existing panResponder
  const playheadPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDraggingPlayhead(true);
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
        if (isPlaying) {
          soundObject.current?.pauseAsync();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const progress = Math.max(0, Math.min(1, (gestureState.moveX - 30) / (progressBarWidth.current - 60)));
        const newTime = progress * duration;
        setCurrentTime(newTime);
      },
      onPanResponderRelease: async (_, gestureState) => {
        const progress = Math.max(0, Math.min(1, (gestureState.moveX - 30) / (progressBarWidth.current - 60)));
        await handleSeek(progress);
        setIsDraggingPlayhead(false);
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
        if (isPlaying) {
          soundObject.current?.playAsync();
        }
      }
    })
  ).current;

  // Add card press animation
  const handleCardPress = (story) => {
    Animated.sequence([
      Animated.timing(cardScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => handleStoryPress(story));
  };

  // Add this function for sorting
  const sortStories = (stories) => {
    switch (sortBy) {
      case 'newest':
        return [...stories].sort((a, b) => b.id - a.id);
      case 'duration':
        return [...stories].sort((a, b) => {
          const durationA = parseInt(a.duration.split(':')[0]) * 60 + parseInt(a.duration.split(':')[1]);
          const durationB = parseInt(b.duration.split(':')[0]) * 60 + parseInt(b.duration.split(':')[1]);
          return durationA - durationB;
        });
      default:
        return stories;
    }
  };

  // Add this helper function at the top level
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-background-secondary">
      <View className="px-5 pt-5 bg-white border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-3xl font-extrabold text-text-primary tracking-tight">Story Time 🎯</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity className="w-11 h-11 rounded-full bg-secondary justify-center items-center shadow-sm">
              <Ionicons name="notifications-outline" size={22} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="w-11 h-11 rounded-full bg-secondary justify-center items-center shadow-sm"
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons 
                name={viewMode === 'grid' ? 'grid' : 'list'} 
                size={22} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center gap-3 mb-5">
          <View className="flex-1 flex-row items-center bg-secondary rounded-2xl px-4 h-12 shadow-sm">
            <Ionicons name="search" size={20} color="#666" className="mr-3" />
            <TextInput
              ref={searchInputRef}
              className="flex-1 text-base text-text-primary font-medium py-3"
              placeholder="Search stories..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text && selectedMood !== 'All') {
                  setSelectedMood('All');
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                className="p-2"
                onPress={() => {
                  setSearchQuery('');
                  searchInputRef.current?.blur();
                }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            className={`w-12 h-12 rounded-2xl justify-center items-center shadow-sm ${showFilters ? 'bg-primary' : 'bg-secondary'}`}
            onPress={() => {
              setShowFilters(!showFilters);
              Animated.spring(filterAnimation, {
                toValue: showFilters ? 0 : 1,
                useNativeDriver: true,
                friction: 8,
              }).start();
            }}
          >
            <Ionicons name="options" size={22} color={showFilters ? "#FFF" : "#666"} />
          </TouchableOpacity>
        </View>

        <Animated.View 
          className={`bg-white rounded-3xl p-4 mb-5 mt-2.5 shadow-md ${showFilters ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: [{
              translateY: filterAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              })
            }]
          }}
        >
          {showFilters && (
            <>
              <View className="mb-4">
                <Text className="text-base font-semibold text-text-primary mb-3">Sort By</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  {['newest', 'duration'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      className={`flex-row items-center px-4 py-2.5 rounded-2xl gap-2 ${
                        sortBy === option ? 'bg-primary' : 'bg-secondary'
                      }`}
                      onPress={() => setSortBy(option)}
                    >
                      <Ionicons 
                        name={option === 'newest' ? 'time' : 'timer'} 
                        size={18} 
                        color={sortBy === option ? "#FFF" : "#666"}
                      />
                      <Text className={`text-sm font-medium ${
                        sortBy === option ? 'text-white' : 'text-text-secondary'
                      }`}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text className="text-base font-semibold text-text-primary mb-3">Mood</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  {moodFilters.map((mood) => (
                    <TouchableOpacity
                      key={mood.id}
                      className={`flex-row items-center px-4 py-2.5 rounded-2xl gap-2 ${
                        selectedMood === mood.title ? 'bg-primary' : 'bg-secondary'
                      }`}
                      onPress={() => setSelectedMood(mood.title)}
                    >
                      <Ionicons 
                        name={mood.icon} 
                        size={18} 
                        color={selectedMood === mood.title ? "#FFF" : "#666"}
                      />
                      <Text className={`text-sm font-medium ${
                        selectedMood === mood.title ? 'text-white' : 'text-text-secondary'
                      }`}>
                        {mood.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </Animated.View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4"
      >
        <View className="py-4">
          <Text className="text-2xl font-bold text-text-primary mb-4">Stories</Text>
          <View className={`flex-row flex-wrap justify-between gap-4 ${
            viewMode === 'list' ? 'flex-col' : ''
          }`}>
            {sortStories(getFilteredStories())?.map((story) => (
              story && (
                <TouchableWithoutFeedback
                  key={story.id}
                  onPress={() => handleCardPress(story)}
                >
                  <Animated.View className={`${
                    viewMode === 'list' ? 'w-full h-[180px] mb-3' : 'w-[calc(50%-8px)] h-[240px] mb-4'
                  } rounded-3xl overflow-hidden bg-white shadow-lg`}>
                    <LinearGradient
                      colors={moodColors[story.mood] || moodColors.happy}
                      className="flex-1 p-4"
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View className="flex-1 justify-between">
                        <View className="flex-row justify-between items-start mb-2">
                          <Text className="text-xl font-bold text-white flex-1 mr-2 leading-6" numberOfLines={2}>
                            {story.title}
                          </Text>
                          {story.type === 'generated' && (
                            <View className="bg-white/90 px-2 py-1 rounded-2xl shadow-sm">
                              <Ionicons name="sparkles" size={16} color="#1C1C1E" />
                            </View>
                          )}
                        </View>
                        <View className="mt-2">
                          <View className="flex-row gap-2 mb-2 flex-wrap">
                            <View className="flex-row items-center px-3 py-1.5 rounded-2xl gap-1.5 bg-white/90 shadow-sm">
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
                                size={14} 
                                color="#1C1C1E" 
                              />
                              <Text className="text-xs font-semibold text-text-primary">{story.mood}</Text>
                            </View>
                            <View className="flex-row items-center px-3 py-1.5 rounded-2xl gap-1.5 bg-white/90 shadow-sm">
                              <Ionicons 
                                name={
                                  story.category === 'Fantasy' ? 'sparkles' :
                                  story.category === 'Drama' ? 'film' :
                                  story.category === 'Adventure' ? 'compass' :
                                  story.category === 'Mystery' ? 'search' :
                                  story.category === 'Romance' ? 'heart' :
                                  story.category === 'Sci-Fi' ? 'rocket' :
                                  story.category === 'Horror' ? 'skull' : 'happy'
                                } 
                                size={14} 
                                color="#1C1C1E" 
                              />
                              <Text className="text-xs font-semibold text-text-primary">{story.category}</Text>
                            </View>
                          </View>
                          <View className="flex-row items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-2xl self-start shadow-sm">
                            <Ionicons name="time" size={14} color="#1C1C1E" />
                            <Text className="text-xs font-semibold text-text-primary">{story.duration}</Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </TouchableWithoutFeedback>
              )
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPlayer}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        {selectedStory && (
          <View className="flex-1">
            <LinearGradient
              colors={moodColors[selectedStory.mood] || moodColors.happy}
              className="flex-1 pt-10"
            >
              <View className="flex-row items-center justify-between px-5 mb-8">
                <TouchableOpacity
                  className="w-11 h-11 rounded-full bg-white/20 justify-center items-center shadow-sm"
                  onPress={handleClose}
                >
                  <Ionicons name="chevron-down" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text className="text-xl font-semibold text-text-primary">Now Playing</Text>
                <TouchableOpacity className="w-11 h-11 rounded-full bg-white/20 justify-center items-center shadow-sm">
                  <Ionicons name="ellipsis-horizontal" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View className="flex-1 items-center px-10">
                <View className="w-[280px] h-[280px] rounded-3xl bg-white/20 justify-center items-center mb-8 shadow-lg">
                  <Ionicons 
                    name={
                      selectedStory.mood === 'happy' ? 'sunny' :
                      selectedStory.mood === 'sad' ? 'sad' :
                      selectedStory.mood === 'angry' ? 'flame' :
                      selectedStory.mood === 'joy' ? 'happy' :
                      selectedStory.mood === 'surprise' ? 'alert' :
                      selectedStory.mood === 'calm' ? 'water' :
                      selectedStory.mood === 'mysterious' ? 'moon' : 'flash'
                    }
                    size={64} 
                    color="#FFF" 
                  />
                </View>
                
                <Text className="text-3xl font-bold text-text-primary text-center mb-4">{selectedStory.title}</Text>
                
                <View className="flex-row justify-center gap-3 mb-8 flex-wrap">
                  <View className="flex-row items-center px-4 py-2 rounded-3xl gap-1.5 bg-white/20 shadow-sm">
                    <Ionicons 
                      name={
                        selectedStory.mood === 'happy' ? 'sunny' :
                        selectedStory.mood === 'sad' ? 'sad' :
                        selectedStory.mood === 'angry' ? 'flame' :
                        selectedStory.mood === 'joy' ? 'happy' :
                        selectedStory.mood === 'surprise' ? 'alert' :
                        selectedStory.mood === 'calm' ? 'water' :
                        selectedStory.mood === 'mysterious' ? 'moon' : 'flash'
                      }
                      size={16} 
                      color="#FFF" 
                    />
                    <Text className="text-sm font-semibold text-text-primary">{selectedStory.mood}</Text>
                  </View>
                  <View className="flex-row items-center px-4 py-2 rounded-3xl gap-1.5 bg-white/20 shadow-sm">
                    <Ionicons 
                      name={
                        selectedStory.category === 'Fantasy' ? 'sparkles' :
                        selectedStory.category === 'Drama' ? 'film' :
                        selectedStory.category === 'Adventure' ? 'compass' :
                        selectedStory.category === 'Mystery' ? 'search' :
                        selectedStory.category === 'Romance' ? 'heart' :
                        selectedStory.category === 'Sci-Fi' ? 'rocket' :
                        selectedStory.category === 'Horror' ? 'skull' : 'happy'
                      }
                      size={16} 
                      color="#FFF" 
                    />
                    <Text className="text-sm font-semibold text-text-primary">{selectedStory.category}</Text>
                  </View>
                </View>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFF" className="my-10" />
                ) : (
                  <>
                    <View className="w-full h-10 justify-center mb-2.5">
                      <View className="w-full h-1 bg-black/10 rounded-full overflow-visible">
                        <Animated.View
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(currentTime / duration) * 100}%`,
                          }}
                        />
                        <Animated.View
                          {...playheadPanResponder.panHandlers}
                          className="absolute w-4 h-4 rounded-full bg-primary justify-center items-center -top-1.5"
                          style={{
                            left: `${(currentTime / duration) * 100}%`,
                            transform: [
                              { scale: playheadScale },
                              { translateX: -6 }
                            ],
                            opacity: playheadOpacity,
                          }}
                        >
                          <View className="w-2 h-2 rounded-full bg-white shadow-lg" />
                        </Animated.View>
                      </View>
                    </View>

                    <View className="w-full flex-row justify-between mb-10">
                      <Text className="text-sm text-text-secondary">{formatTime(currentTime)}</Text>
                      <Text className="text-sm text-text-secondary">{formatTime(duration)}</Text>
                    </View>

                    <View className="w-full flex-row items-center px-5 mb-5">
                      <TouchableOpacity onPress={toggleMute}>
                        <Ionicons
                          name={volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"}
                          size={24}
                          color="#FFF"
                        />
                      </TouchableOpacity>
                      <Slider
                        className="flex-1 ml-2.5 h-10"
                        minimumValue={0}
                        maximumValue={1}
                        value={volume}
                        onValueChange={handleVolumeChange}
                        minimumTrackTintColor="#FFF"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor="#FFF"
                      />
                    </View>

                    <View className="w-3/5 flex-row justify-between mb-5">
                      <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}>
                        <Ionicons
                          name="shuffle"
                          size={24}
                          color={isShuffle ? "#FFF" : "rgba(255, 255, 255, 0.5)"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={toggleRepeat}>
                        <Ionicons
                          name="repeat"
                          size={24}
                          color={isRepeat ? "#FFF" : "rgba(255, 255, 255, 0.5)"}
                        />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center justify-center mb-8">
                      <TouchableOpacity 
                        className="p-5"
                        onPress={skipBackward}
                      >
                        <Ionicons name="play-skip-back" size={24} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="w-20 h-20 rounded-full bg-primary justify-center items-center mx-7.5 shadow-lg"
                        onPress={togglePlayPause}
                        disabled={isLoading}
                      >
                        <Ionicons
                          name={isPlaying ? "pause" : "play"}
                          size={32}
                          color="#FFF"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="p-5"
                        onPress={skipForward}
                      >
                        <Ionicons name="play-skip-forward" size={24} color="#FFF" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      className="absolute left-0 top-[55%] w-[30%] h-[20%] justify-center items-center"
                      onPress={() => handleDoubleTap('backward')}
                    >
                      <View className="bg-primary/10 px-3 py-2 rounded-3xl items-center">
                        <Ionicons name="play-back" size={24} color="rgba(255, 255, 255, 0.5)" />
                        <Text className="text-xs text-text-secondary mt-1">10s</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="absolute right-0 top-[55%] w-[30%] h-[20%] justify-center items-center"
                      onPress={() => handleDoubleTap('forward')}
                    >
                      <View className="bg-primary/10 px-3 py-2 rounded-3xl items-center">
                        <Ionicons name="play-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
                        <Text className="text-xs text-text-secondary mt-1">10s</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </LinearGradient>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
