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
      author: "Sarah Smith",
      mood: "mysterious",
      category: "Fantasy",
      duration: "8:30",
      thumbnail: null,
      type: "default",
      description: "A magical journey through an enchanted forest where trees whisper secrets and animals speak.",
      rating: 4.8,
      plays: 1234,
      createdAt: "2024-03-15T10:00:00Z"
    },
    {
      id: 2,
      title: "Ocean's Whisper",
      author: "Mike Johnson",
      mood: "calm",
      category: "Adventure",
      duration: "12:15",
      thumbnail: null,
      type: "default",
      description: "Dive into the depths of the ocean where ancient creatures guard forgotten treasures.",
      rating: 4.9,
      plays: 2156,
      createdAt: "2024-03-14T15:30:00Z"
    },
    {
      id: 3,
      title: "Starlight Dreams",
      author: "Emma Davis",
      mood: "happy",
      category: "Sci-Fi",
      duration: "10:45",
      thumbnail: null,
      type: "default",
      description: "A cosmic adventure through the stars where dreams become reality.",
      rating: 4.7,
      plays: 1890,
      createdAt: "2024-03-13T09:15:00Z"
    }
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
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Main Content */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          {/* Header */}
          <View className="px-4 pt-6 pb-2">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-bold text-white">Good {getTimeOfDay()}</Text>
                <Text className="text-sm text-gray-400 mt-1">Let's find your next story</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity className="w-10 h-10 rounded-full bg-white/10 justify-center items-center">
                  <Ionicons name="notifications-outline" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity className="w-10 h-10 rounded-full bg-white/10 justify-center items-center">
                  <Ionicons name="time-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center bg-white/10 rounded-full px-4 h-12 mb-6">
              <Ionicons name="search" size={20} color="#666" className="mr-3" />
              <TextInput
                ref={searchInputRef}
                className="flex-1 text-base text-white font-medium py-3"
                placeholder="Search stories, authors, or moods..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  className="p-2"
                  onPress={() => {
                    setSearchQuery('');
                    searchInputRef.current?.blur();
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Filters */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2 mb-6"
            >
              {moodFilters.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  className={`flex-row items-center px-4 py-2 rounded-full ${
                    selectedMood === mood.title ? 'bg-white' : 'bg-white/10'
                  }`}
                  onPress={() => setSelectedMood(mood.title)}
                >
                  <Ionicons 
                    name={mood.icon} 
                    size={16} 
                    color={selectedMood === mood.title ? "#000" : "#FFF"}
                  />
                  <Text className={`text-sm font-medium ml-2 ${
                    selectedMood === mood.title ? 'text-black' : 'text-white'
                  }`}>
                    {mood.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Stories List */}
          <View className="px-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-white">Stories</Text>
              <Text className="text-sm text-gray-400">{getFilteredStories().length} stories</Text>
            </View>

            {sortStories(getFilteredStories())?.map((story) => (
              story && (
                <TouchableOpacity
                  key={story.id}
                  onPress={() => handleStoryPress(story)}
                  className="flex-row items-center py-3 border-b border-white/10"
                >
                  <View className="w-12 h-12 rounded-md bg-white/10 justify-center items-center mr-3">
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
                      size={24} 
                      color="#FFF" 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-white mb-1" numberOfLines={1}>
                      {story.title}
                    </Text>
                    <Text className="text-sm text-gray-400" numberOfLines={1}>
                      {story.narrator || story.author} • {story.language} • {story.ageCategory}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                      {story.genre} • {story.duration}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={14} color="#1DB954" />
                      <Text className="text-sm text-gray-400 ml-1">{story.rating || '0.0'}</Text>
                    </View>
                    <TouchableOpacity className="w-8 h-8 rounded-full bg-white/10 justify-center items-center">
                      <Ionicons name="play" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )
            ))}
          </View>
        </ScrollView>

        {/* Mini Player */}
        {selectedStory && (
          <TouchableOpacity 
            className="absolute bottom-0 left-0 right-0 bg-[#282828] px-4 py-3 flex-row items-center"
            onPress={() => setShowPlayer(true)}
          >
            <View className="w-10 h-10 rounded-md bg-white/10 justify-center items-center mr-3">
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
                size={20} 
                color="#FFF" 
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                {selectedStory.title}
              </Text>
              <Text className="text-xs text-gray-400" numberOfLines={1}>
                {selectedStory.narrator || selectedStory.author} • {selectedStory.language}
              </Text>
            </View>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={togglePlayPause}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="#FFF"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPlayer(true)}>
                <Ionicons name="play-skip-forward" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Full Screen Player */}
        <Modal
          visible={showPlayer}
          animationType="slide"
          transparent={true}
          onRequestClose={handleClose}
        >
          {selectedStory && (
            <View className="flex-1 bg-black">
              <View className="flex-1 pt-12">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 mb-8">
                  <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-white/10 justify-center items-center"
                    onPress={handleClose}
                  >
                    <Ionicons name="chevron-down" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <View className="items-center">
                    <Text className="text-sm text-gray-400">Now Playing</Text>
                    {/* <Text className="text-base font-semibold text-white">{selectedStory.title}</Text> */}
                  </View>
                  <TouchableOpacity className="w-10 h-10 rounded-full bg-white/10 justify-center items-center">
                    <Ionicons name="ellipsis-horizontal" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {/* Album Art */}
                <View className="items-center px-8 mb-8">
                  <View className="w-[300px] h-[300px] rounded-lg bg-white/10 justify-center items-center mb-6">
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
                      size={80} 
                      color="#FFF" 
                    />
                  </View>
                  
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-white text-center mb-2">{selectedStory.title}</Text>
                    <Text className="text-base text-gray-400 text-center mb-1">{selectedStory.narrator || selectedStory.author}</Text>
                    <Text className="text-sm text-gray-500 text-center">
                      {selectedStory.language} • {selectedStory.ageCategory} • {selectedStory.genre}
                    </Text>
                    {/* {selectedStory.metadata?.description && (
                      <Text className="text-sm text-gray-400 text-center mt-2 px-4">
                        {selectedStory.metadata.description}
                      </Text>
                    )} */}
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="px-4 mb-4">
                  <View className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <Animated.View
                      className="h-full bg-[#1DB954] rounded-full"
                      style={{
                        width: `${(currentTime / duration) * 100}%`,
                      }}
                    />
                  </View>
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-gray-400">{formatTime(currentTime)}</Text>
                    <Text className="text-xs text-gray-400">{formatTime(duration)}</Text>
                  </View>
                </View>

                {/* Controls */}
                <View className="flex-row items-center justify-between px-8 mb-8">
                  <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}>
                    <Ionicons
                      name="shuffle"
                      size={24}
                      color={isShuffle ? "#1DB954" : "#FFF"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={skipBackward}>
                    <Ionicons name="play-skip-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="w-16 h-16 rounded-full bg-white justify-center items-center"
                    onPress={togglePlayPause}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={32}
                      color="#000"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={skipForward}>
                    <Ionicons name="play-skip-forward" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleRepeat}>
                    <Ionicons
                      name="repeat"
                      size={24}
                      color={isRepeat ? "#1DB954" : "#FFF"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Volume Control */}
                <View className="px-8">
                  <View className="flex-row items-center mb-20">
                    <TouchableOpacity onPress={toggleMute} className="mr-4">
                      <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={24}
                        color="#FFF"
                      />
                    </TouchableOpacity>
                    <Slider
                      style={{ flex: 1 }}
                      minimumValue={0}
                      maximumValue={1}
                      value={volume}
                      onValueChange={handleVolumeChange}
                      minimumTrackTintColor="#1DB954"
                      maximumTrackTintColor="#666"
                      thumbTintColor="#FFF"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </Modal>
      </View>
    </SafeAreaView>
  );
}
