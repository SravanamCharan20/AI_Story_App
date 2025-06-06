import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated, Modal, ActivityIndicator, TextInput, Platform, Image } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { PanResponder, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import tw from 'twrnc';
import { RefreshControl } from 'react-native';

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
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [allStories, setAllStories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const soundObject = useRef(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const timeUpdateInterval = useRef(null);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const progressBarWidth = useRef(0);
  const playheadScale = useRef(new Animated.Value(1)).current;
  const playheadOpacity = useRef(new Animated.Value(0.8)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMood, setSelectedMood] = useState('All');
  const searchInputRef = useRef(null);
  const searchBarAnimation = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [stories, setStories] = useState([]);
  const [error, setError] = useState(null);
  const [sound, setSound] = useState(null);
  const { currentStory, isPlaying: audioPlayerIsPlaying, togglePlayPause, loadAndPlayStory } = useAudioPlayer();
  const [refreshing, setRefreshing] = useState(false);

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
    { id: 3, title: "Favorites", color: ['#FFB7E4', '#FF8CD4'] },
  ];

  // Add this after the storyCategories array
  const moodFilters = [
    { id: 0, title: 'All', icon: 'apps' },
    { id: 1, title: 'happy', icon: 'sunny' },
    { id: 2, title: 'sad', icon: 'water' },
    { id: 3, title: 'mysterious', icon: 'moon' },
    { id: 4, title: 'exciting', icon: 'flash' },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadStories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        setStories(defaultStories);
        setIsLoading(false);
        return;
      }

      let userId;
      try {
        const parsedUserData = JSON.parse(userData);
        userId = parsedUserData._id;
        
        if (!userId) {
          throw new Error('Invalid user data');
        }
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        setStories(defaultStories);
        setIsLoading(false);
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:3000';
      let endpoint = `/api/stories/user/${userId}`;
      
      // If favorites category is selected, use the favorites endpoint
      if (selectedCategory === "Favorites") {
        endpoint = `/api/stories/favorites/${userId}`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      }).catch(error => {
        console.error('Network error details:', error);
        throw new Error(`Network error: ${error.message}`);
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const transformedStories = data.map(story => ({
        id: story._id,
        title: story.title,
        author: story.narrator,
        mood: story.mood,
        category: story.genre,
        duration: story.duration || '0:00',
        thumbnail: null,
        type: 'generated',
        description: story.metadata?.description || '',
        rating: story.metadata?.rating || 0,
        plays: story.metadata?.plays || 0,
        createdAt: story.createdAt,
        audioUrl: story.audioUrl,
        storyUrl: story.storyUrl,
        tags: story.tags || [],
        language: story.language,
        ageCategory: story.ageCategory,
        isFavorited: story.favorites?.includes(userId) || false
      }));

      setStories(transformedStories);
      setAllStories(transformedStories);

      const localStories = await AsyncStorage.getItem('uploadedPDFs');
      if (localStories) {
        const parsedLocalStories = JSON.parse(localStories);
        setStories(prev => [...prev, ...parsedLocalStories]);
        setAllStories(prev => [...prev, ...parsedLocalStories]);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async (story) => {
    try {
      if (currentStory?.id === story.id) {
        togglePlayPause();
      } else {
        await loadAndPlayStory(story);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleViewStory = (story) => {
    router.push({
      pathname: '/story-detail',
      params: { 
        storyId: story.id,
        story: JSON.stringify(story)
      }
    });
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


  const renderMiniPlayer = () => {
    if (!currentStory) return null;

    return (
      <TouchableOpacity 
        className="absolute bottom-0 left-0 right-0 bg-[#282828] px-4 py-3 flex-row items-center"
        onPress={() => setShowPlayer(true)}
      >
        <View className="w-10 h-10 rounded-md bg-white/10 justify-center items-center mr-3">
          <Ionicons 
            name={
              currentStory.mood === 'happy' ? 'sunny' :
              currentStory.mood === 'sad' ? 'sad' :
              currentStory.mood === 'angry' ? 'flame' :
              currentStory.mood === 'joy' ? 'happy' :
              currentStory.mood === 'surprise' ? 'alert' :
              currentStory.mood === 'calm' ? 'water' :
              currentStory.mood === 'mysterious' ? 'moon' : 'flash'
            }
            size={20} 
            color="#FFF" 
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-white" numberOfLines={1}>
            {currentStory.title}
          </Text>
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            {currentStory.narrator || currentStory.author} • {currentStory.language}
          </Text>
        </View>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
          >
            <Ionicons
              name={audioPlayerIsPlaying ? "pause" : "play"}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPlayer(true)}>
            <Ionicons name="play-skip-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const StoryCard = ({ story, onPress }) => {
    const [isFavorited, setIsFavorited] = useState(story.isFavorited);
    const [userId, setUserId] = useState(null);
    const { currentStory, isPlaying: audioPlayerIsPlaying, togglePlayPause, loadAndPlayStory } = useAudioPlayer();

    useEffect(() => {
      loadUserData();
    }, []);

    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedData = JSON.parse(userData);
          setUserId(parsedData._id);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    const toggleFavorite = async (e) => {
      e.stopPropagation();
      try {
        if (!userId) {
          console.error('No user ID found');
          return;
        }

        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:3000';
        const response = await fetch(`${API_URL}/api/stories/${story.id}/favorite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsFavorited(data.isFavorited);
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    };

    const handlePlayAudio = async (e) => {
      e.stopPropagation();
      try {
        if (currentStory?.id === story.id) {
          togglePlayPause();
        } else {
          await loadAndPlayStory(story);
        }
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        className="bg-white/5 rounded-lg p-4 mb-4 flex-row items-center"
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
            {story.author} • {story.language} • {story.ageCategory}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-xs text-gray-500 mr-2">
              {story.category} • {story.duration}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="star" size={12} color="#1DB954" />
              <Text className="text-xs text-gray-400 ml-1">{story.rating || '0.0'}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={toggleFavorite} className="p-2">
            <Ionicons 
              name={isFavorited ? "heart" : "heart-outline"} 
              size={20} 
              color={isFavorited ? "#FF4B4B" : "#FFF"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePlayAudio}
            className="w-8 h-8 rounded-full bg-white/10 justify-center items-center"
          >
            <Ionicons
              name={currentStory?.id === story.id && audioPlayerIsPlaying ? "pause" : "play"}
              size={16}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Add this new function to handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadStories();
    } catch (error) {
      console.error('Error refreshing stories:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        <ScrollView 
          showsVerticalScrollIndicator={false}
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFF"
            />
          }
        >
          {/* Header */}
          <View className="px-4 pt-6 pb-2">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-bold text-white">Good {getTimeOfDay()}</Text>
                <Text className="text-sm text-gray-400 mt-1">Let's find your next story</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity className="w-30 p-3 h-13 rounded-full border border-green-500 bg-green-500/10 justify-center items-center flex-row" onPress={() => router.push('/create')}>
                  <Ionicons name="add" size={20} color="green" className="mr-2" />
                  <Text className="text-green-500">CREATE</Text>
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
              <Text className="text-sm text-gray-400">{stories.length} stories</Text>
            </View>

            {isLoading ? (
              <View className="items-center py-4">
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            ) : stories.length === 0 ? (
              <View className="items-center py-4">
                <Text className="text-gray-400">No stories found</Text>
              </View>
            ) : (
              stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onPress={() => handleViewStory(story)}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Add the mini player
        {renderMiniPlayer()} */}
      </View>
    </SafeAreaView>
  );
}
