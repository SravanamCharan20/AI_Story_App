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
  happy: ['#FFB7B7', '#FF8C8C'],
  calm: ['#B7FFD8', '#8CFFC0'],
  mysterious: ['#B7D4FF', '#8CB4FF'],
  exciting: ['#FFB88C', '#FF6B6B'],
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
    {
      id: 2,
      title: "Adventure Time",
      mood: "exciting",
      duration: "5:45",
      thumbnail: null,
      type: "default"
    },
    {
      id: 3,
      title: "Peaceful Garden",
      mood: "calm",
      duration: "6:15",
      thumbnail: null,
      type: "default"
    },
    {
      id: 4,
      title: "Fun Day Out",
      mood: "happy",
      duration: "7:00",
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
        setAllStories([...defaultStories, ...pdfStories]);
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

      // Load the audio file
      await soundObject.current.loadAsync(moodAudios[story.mood]);
      
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
    return allStories
      .filter(story => {
        // Category filter
        if (selectedCategory !== "All") {
          if (selectedCategory === "My PDFs" && story.type !== "pdf") return false;
          if (selectedCategory === "Default Stories" && story.type !== "default") return false;
        }
        
        // Mood filter
        if (selectedMood !== "All" && story.mood !== selectedMood.toLowerCase()) return false;
        
        // Search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            story.title.toLowerCase().includes(query) ||
            story.mood.toLowerCase().includes(query) ||
            story.duration.toLowerCase().includes(query)
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Story Time 🎯</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.viewModeButton}
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

        <View style={styles.searchContainer}>
          <Animated.View style={[
            styles.searchInputContainer,
            { flex: searchBarAnimation }
          ]}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search stories..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text && selectedMood !== 'All') {
                  setSelectedMood('All');
                }
              }}
              onFocus={() => {
                Animated.spring(searchBarAnimation, {
                  toValue: 1,
                  useNativeDriver: false,
                  friction: 8,
                }).start();
              }}
              onBlur={() => {
                if (!searchQuery) {
                  Animated.spring(searchBarAnimation, {
                    toValue: 0.85,
                    useNativeDriver: false,
                    friction: 8,
                  }).start();
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery('');
                  searchInputRef.current?.blur();
                }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </Animated.View>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              showFilters && styles.filterButtonActive
            ]}
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
          style={[
            styles.filterPanel,
            {
              transform: [{
                translateY: filterAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }],
              opacity: filterAnimation
            }
          ]}
        >
          {showFilters && (
            <>
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Sort By</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterOptionsContainer}
                >
                  {['newest', 'duration'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterOption,
                        sortBy === option && styles.filterOptionActive
                      ]}
                      onPress={() => setSortBy(option)}
                    >
                      <Ionicons 
                        name={option === 'newest' ? 'time' : 'timer'} 
                        size={18} 
                        color={sortBy === option ? "#FFF" : "#666"}
                      />
                      <Text style={[
                        styles.filterOptionText,
                        sortBy === option && styles.filterOptionTextActive
                      ]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Mood</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterOptionsContainer}
                >
                  {moodFilters.map((mood) => (
                    <TouchableOpacity
                      key={mood.id}
                      style={[
                        styles.filterOption,
                        selectedMood === mood.title && styles.filterOptionActive
                      ]}
                      onPress={() => setSelectedMood(mood.title)}
                    >
                      <Ionicons 
                        name={mood.icon} 
                        size={18} 
                        color={selectedMood === mood.title ? "#FFF" : "#666"}
                      />
                      <Text style={[
                        styles.filterOptionText,
                        selectedMood === mood.title && styles.filterOptionTextActive
                      ]}>
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
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            decelerationRate="fast"
            snapToInterval={width * 0.4 + 20}
          >
            {storyCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.title && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(category.title)}
              >
                <LinearGradient
                  colors={category.color}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.storiesSection}>
          <Text style={styles.sectionTitle}>Stories</Text>
          <View style={[
            styles.storiesGrid,
            viewMode === 'list' && styles.storiesListView
          ]}>
            {sortStories(getFilteredStories()).map((story) => (
              <TouchableWithoutFeedback
                key={story.id}
                onPress={() => handleCardPress(story)}
              >
                <Animated.View style={[
                  styles.storyCard,
                  viewMode === 'list' && styles.storyCardList,
                  { transform: [{ scale: cardScale }] }
                ]}>
                  <LinearGradient
                    colors={moodColors[story.mood]}
                    style={styles.storyGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.storyTitle}>{story.title}</Text>
                        {story.type === 'pdf' && (
                          <View style={styles.pdfTag}>
                            <Ionicons name="document-text" size={16} color="#1C1C1E" />
                          </View>
                        )}
                      </View>
                      <View style={styles.cardFooter}>
                        <View style={styles.moodTag}>
                          <Ionicons 
                            name={
                              story.mood === 'happy' ? 'sunny' :
                              story.mood === 'calm' ? 'water' :
                              story.mood === 'mysterious' ? 'moon' : 'flash'
                            } 
                            size={14} 
                            color="#1C1C1E" 
                          />
                          <Text style={styles.moodText}>{story.mood}</Text>
                        </View>
                        <Text style={styles.storyDuration}>{story.duration}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </TouchableWithoutFeedback>
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
          <View style={styles.playerModal}>
            <LinearGradient
              colors={moodColors[selectedStory.mood]}
              style={styles.playerGradient}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={handleClose}
                >
                  <Ionicons name="chevron-down" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Now Playing</Text>
                <TouchableOpacity style={styles.modalOptionButton}>
                  <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.playerContent}>
                <View style={styles.albumArt}>
                  <Ionicons 
                    name={
                      selectedStory.mood === 'happy' ? 'sunny' :
                      selectedStory.mood === 'calm' ? 'water' :
                      selectedStory.mood === 'mysterious' ? 'moon' : 'flash'
                    }
                    size={64} 
                    color="#FFF" 
                  />
                </View>
                
                <Text style={styles.playerTitle}>{selectedStory.title}</Text>
                <Text style={styles.playerMood}>{selectedStory.mood}</Text>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFF" style={styles.loader} />
                ) : (
                  <>
                    <View style={styles.progressContainer}
                      onLayout={(event) => {
                        progressBarWidth.current = event.nativeEvent.layout.width;
                      }}>
                      <View style={styles.progressBarBackground}>
                        <Animated.View
                          style={[
                            styles.progressBar,
                            {
                              width: `${(currentTime / duration) * 100}%`,
                            },
                          ]}
                        />
                        <Animated.View
                          {...playheadPanResponder.panHandlers}
                          style={[
                            styles.playhead,
                            {
                              left: `${(currentTime / duration) * 100}%`,
                              transform: [
                                { scale: playheadScale },
                                { translateX: -6 }
                              ],
                              opacity: playheadOpacity,
                            },
                          ]}
                        >
                          <View style={styles.playheadInner} />
                        </Animated.View>
                        {isDraggingPlayhead && (
                          <View
                            style={[
                              styles.timePreview,
                              {
                                left: `${(currentTime / duration) * 100}%`,
                              },
                            ]}
                          >
                            <Text style={styles.timePreviewText}>
                              {formatTime(currentTime)}
                            </Text>
                          </View>
                        )}
                      </View>
                      {isBuffering && (
                        <ActivityIndicator
                          size="small"
                          color="#FFF"
                          style={styles.bufferingIndicator}
                        />
                      )}
                    </View>

                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                      <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>

                    <View style={styles.volumeContainer}>
                      <TouchableOpacity onPress={toggleMute}>
                        <Ionicons
                          name={volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"}
                          size={24}
                          color="#FFF"
                        />
                      </TouchableOpacity>
                      <Slider
                        style={styles.volumeSlider}
                        minimumValue={0}
                        maximumValue={1}
                        value={volume}
                        onValueChange={handleVolumeChange}
                        minimumTrackTintColor="#FFF"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor="#FFF"
                      />
                    </View>

                    <View style={styles.additionalControls}>
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

                    <View style={styles.controls}>
                      <TouchableOpacity 
                        style={styles.controlButton}
                        onPress={skipBackward}
                      >
                        <Ionicons name="play-skip-back" size={24} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.playButton}
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
                        style={styles.controlButton}
                        onPress={skipForward}
                      >
                        <Ionicons name="play-skip-forward" size={24} color="#FFF" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.doubleTapLeft}
                      onPress={() => handleDoubleTap('backward')}
                    >
                      <View style={styles.doubleTapOverlay}>
                        <Ionicons name="play-back" size={24} color="rgba(255, 255, 255, 0.5)" />
                        <Text style={styles.doubleTapText}>10s</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.doubleTapRight}
                      onPress={() => handleDoubleTap('forward')}
                    >
                      <View style={styles.doubleTapOverlay}>
                        <Ionicons name="play-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
                        <Text style={styles.doubleTapText}>10s</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#FFF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 8,
    fontWeight: '500',
  },
  filterButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  filterPanel: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    gap: 8,
  },
  filterOptionActive: {
    backgroundColor: '#FF6B6B',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textTransform: 'capitalize',
  },
  filterOptionTextActive: {
    color: '#FFF',
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: width * 0.4,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  storiesSection: {
    flex: 1,
  },
  storiesGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  storyCard: {
    width: (width - 56) / 2,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  storyCardList: {
    width: '100%',
    height: 120,
    marginBottom: 12,
  },
  storyGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    flex: 1,
    marginRight: 8,
  },
  moodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  moodText: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  storyDuration: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategory: {
    transform: [{ scale: 1.05 }],
  },
  pdfTag: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 12,
  },
  playerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playerGradient: {
    flex: 1,
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  playerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  playerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  playerMood: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.8,
    marginBottom: 40,
  },
  loader: {
    marginVertical: 40,
  },
  progressContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'visible',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  playhead: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    top: -8,
  },
  playheadInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  timePreview: {
    position: 'absolute',
    top: -35,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 6,
    borderRadius: 6,
    transform: [{ translateX: -20 }],
  },
  timePreviewText: {
    color: '#FFF',
    fontSize: 12,
  },
  bufferingIndicator: {
    position: 'absolute',
    right: -24,
    top: -10,
  },
  timeContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  timeText: {
    color: '#FFF',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    padding: 20,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  volumeSlider: {
    flex: 1,
    marginLeft: 10,
    height: 40,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginBottom: 20,
  },
  doubleTapLeft: {
    position: 'absolute',
    left: 0,
    top: '40%',
    width: '30%',
    height: '20%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doubleTapRight: {
    position: 'absolute',
    right: 0,
    top: '40%',
    width: '30%',
    height: '20%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doubleTapOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  doubleTapText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  storiesListView: {
    flexDirection: 'column',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
});