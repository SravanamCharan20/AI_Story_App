import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated, TextInput, Switch, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

const MOODS = ['happy', 'sad', 'angry', 'joy', 'surprise', 'calm', 'mysterious', 'exciting'];
const CATEGORIES = ['Fantasy', 'Drama', 'Adventure', 'Mystery', 'Romance', 'Sci-Fi', 'Horror', 'Comedy'];
const LANGUAGES = ['Telugu', 'English', 'Hindi', 'Tamil', 'Kannada', 'Malayalam'];
const AGE_CATEGORIES = ['Kids', 'Teens', 'Adults', 'All Ages'];

// Custom Picker Component to handle platform differences
const CustomPicker = ({ selectedValue, onValueChange, items, placeholder }) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          {placeholder && <Picker.Item label={placeholder} value="" color="#666" />}
          {items.map((item) => (
            <Picker.Item
              key={item}
              label={item}
              value={item}
              color="black"
            />
          ))}
        </Picker>
      </View>
    );
  }

  return (
    <View className="bg-[#1F1F1F] rounded-lg overflow-hidden">
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={{ color: 'white' }}
        dropdownIconColor="white"
        mode="dropdown"
      >
        {placeholder && <Picker.Item label={placeholder} value="" color="#666" />}
        {items.map((item) => (
          <Picker.Item 
            key={item} 
            label={item} 
            value={item} 
            color="white"
          />
        ))}
      </Picker>
    </View>
  );
};

export default function Profile() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [uploadedPdfs, setUploadedPdfs] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [storyFile, setStoryFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    narrator: '',
    language: 'Telugu',
    ageCategory: 'All Ages',
    genre: '',
    mood: '',
    tags: '',
    hasPermission: false
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadUploadedPDFs();
  }, []);

  const loadUploadedPDFs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const savedPDFs = await AsyncStorage.getItem('uploadedPDFs');
      if (savedPDFs) {
        const parsedPDFs = JSON.parse(savedPDFs);
        setUploadedPdfs(parsedPDFs);
      }
    } catch (error) {
      console.log('Error loading PDFs:', error);
      setError('Failed to load previous stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioUpload = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        setAudioFile({
          name: result.assets[0].name,
          uri: result.assets[0].uri,
          size: (result.assets[0].size / 1024 / 1024).toFixed(2) + ' MB',
        });
      }
    } catch (error) {
      console.log('Error picking audio:', error);
      setError('Failed to upload audio file');
    }
  };

  const handleStoryUpload = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        setStoryFile({
          name: result.assets[0].name,
          uri: result.assets[0].uri,
          size: (result.assets[0].size / 1024 / 1024).toFixed(2) + ' MB',
          type: result.assets[0].mimeType,
        });
      }
    } catch (error) {
      console.log('Error picking story:', error);
      setError('Failed to upload story file');
    }
  };

  const handleViewStory = (story) => {
    try {
      router.push({
        pathname: '/(tabs)/stories',
        params: { storyId: story.id }
      });
    } catch (error) {
      console.log('Error navigating to story:', error);
      setError('Failed to open story');
    }
  };

  const handleGenerateStory = async () => {
    if (!audioFile || !storyFile || !formData.title || !formData.hasPermission) {
      setError('Please fill in all required fields and upload both files');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const newStory = {
        id: Date.now(),
        title: formData.title,
        narrator: formData.narrator || 'Unknown Narrator',
        language: formData.language,
        ageCategory: formData.ageCategory,
        genre: formData.genre || 'Uncategorized',
        mood: formData.mood || 'Neutral',
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        duration: `${Math.floor(Math.random() * 5) + 3}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        type: 'generated',
        audioUrl: audioFile.uri,
        storyUrl: storyFile.uri,
        thumbnail: null,
        size: storyFile.size,
        createdAt: new Date().toISOString(),
        metadata: {
          author: formData.narrator || 'Unknown Narrator',
          language: formData.language,
          ageCategory: formData.ageCategory,
          genre: formData.genre || 'Uncategorized',
          mood: formData.mood || 'Neutral',
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
          description: `${formData.title} - A ${formData.genre || 'story'} in ${formData.language} for ${formData.ageCategory}`,
          rating: 0,
          plays: 0
        }
      };

      const existingStories = await AsyncStorage.getItem('uploadedPDFs');
      const stories = existingStories ? JSON.parse(existingStories) : [];
      const updatedStories = [...stories, newStory];
      await AsyncStorage.setItem('uploadedPDFs', JSON.stringify(updatedStories));
      
      setUploadedPdfs(updatedStories);
      setAudioFile(null);
      setStoryFile(null);
      setFormData({
        title: '',
        narrator: '',
        language: 'Telugu',
        ageCategory: 'All Ages',
        genre: '',
        mood: '',
        tags: '',
        hasPermission: false
      });
      
      router.push({
        pathname: '/(tabs)/stories',
        params: { 
          storyId: newStory.id,
          title: newStory.title,
          narrator: newStory.narrator,
          language: newStory.language,
          ageCategory: newStory.ageCategory,
          genre: newStory.genre,
          mood: newStory.mood,
          tags: JSON.stringify(newStory.tags),
          duration: newStory.duration,
          audioUrl: newStory.audioUrl,
          storyUrl: newStory.storyUrl
        }
      });
    } catch (error) {
      console.log('Error saving generated story:', error);
      setError('Error saving the generated story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await AsyncStorage.clear();
      setUploadedPdfs([]);
      alert('Storage cleared successfully');
    } catch (e) {
      console.log('Error clearing AsyncStorage:', e);
      setError('Failed to clear storage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="px-4 pt-6 pb-2">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-bold text-white">Create Story</Text>
              <Text className="text-sm text-gray-400 mt-1">Upload your audio and story files</Text>
            </View>
          </View>
        </View>

        {error && (
          <View className="px-4 mb-4">
            <Text className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
              {error}
            </Text>
          </View>
        )}

        {/* Form Section */}
        <View className="px-4 mb-6">
          <View className="bg-[#282828] rounded-xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">Story Details</Text>
            
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Title *</Text>
              <TextInput
                className="bg-[#1F1F1F] text-white px-4 py-3 rounded-lg"
                placeholder="Enter story title"
                placeholderTextColor="#666"
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Narrator</Text>
              <TextInput
                className="bg-[#1F1F1F] text-white px-4 py-3 rounded-lg"
                placeholder="Enter narrator's name"
                placeholderTextColor="#666"
                value={formData.narrator}
                onChangeText={(text) => setFormData({...formData, narrator: text})}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Language</Text>
              <CustomPicker
                selectedValue={formData.language}
                onValueChange={(value) => setFormData({...formData, language: value})}
                items={LANGUAGES}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Age Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {AGE_CATEGORIES.map((age) => (
                  <TouchableOpacity
                    key={age}
                    className={`px-4 py-2 rounded-full ${
                      formData.ageCategory === age ? 'bg-[#1DB954]' : 'bg-[#1F1F1F]'
                    }`}
                    onPress={() => setFormData({...formData, ageCategory: age})}
                  >
                    <Text className={`text-sm font-medium ${
                      formData.ageCategory === age ? 'text-black' : 'text-white'
                    }`}>
                      {age}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Genre</Text>
              <CustomPicker
                selectedValue={formData.genre}
                onValueChange={(value) => setFormData({...formData, genre: value})}
                items={CATEGORIES}
                placeholder="Select Genre"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Mood</Text>
              <CustomPicker
                selectedValue={formData.mood}
                onValueChange={(value) => setFormData({...formData, mood: value})}
                items={MOODS}
                placeholder="Select Mood"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Tags (comma-separated)</Text>
              <TextInput
                className="bg-[#1F1F1F] text-white px-4 py-3 rounded-lg"
                placeholder="Enter tags (e.g., adventure, fantasy, magic)"
                placeholderTextColor="#666"
                value={formData.tags}
                onChangeText={(text) => setFormData({...formData, tags: text})}
              />
            </View>

            <View className="flex-row items-center mb-4">
              <Switch
                value={formData.hasPermission}
                onValueChange={(value) => setFormData({...formData, hasPermission: value})}
                trackColor={{ false: '#1F1F1F', true: '#1DB954' }}
                thumbColor={formData.hasPermission ? '#fff' : '#f4f3f4'}
              />
              <Text className="text-white text-sm ml-2 flex-1">
                I confirm I have permission to use this audio and story
              </Text>
            </View>
          </View>

          {/* Upload Section */}
          <View className="bg-[#282828] rounded-xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">Upload Files</Text>
            
            <TouchableOpacity 
              className="flex-row items-center bg-[#1F1F1F] p-4 rounded-lg mb-4"
              onPress={handleAudioUpload}
              disabled={isLoading}
            >
              <Ionicons name="mic" size={24} color="#1DB954" />
              <View className="ml-3 flex-1">
                <Text className="text-white font-medium">
                  {audioFile ? audioFile.name : 'Upload Audio'}
                </Text>
                {audioFile && (
                  <Text className="text-gray-400 text-sm">{audioFile.size}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center bg-[#1F1F1F] p-4 rounded-lg"
              onPress={handleStoryUpload}
              disabled={isLoading}
            >
              <Ionicons name="document-text" size={24} color="#1DB954" />
              <View className="ml-3 flex-1">
                <Text className="text-white font-medium">
                  {storyFile ? storyFile.name : 'Upload Story'}
                </Text>
                {storyFile && (
                  <Text className="text-gray-400 text-sm">{storyFile.size}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-xl items-center ${
              audioFile && storyFile && formData.title && formData.hasPermission && !isLoading
                ? 'bg-[#1DB954]'
                : 'bg-[#1F1F1F]'
            }`}
            onPress={handleGenerateStory}
            disabled={!(audioFile && storyFile && formData.title && formData.hasPermission) || isLoading}
          >
            <Text className="text-white font-semibold text-lg">
              {isLoading ? 'Processing...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Previous Stories Section */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Previous Stories</Text>
          {isLoading ? (
            <View className="items-center py-4">
              <Text className="text-gray-400">Loading stories...</Text>
            </View>
          ) : uploadedPdfs.length === 0 ? (
            <View className="items-center py-4">
              <Text className="text-gray-400">No stories uploaded yet</Text>
            </View>
          ) : (
            uploadedPdfs.map((pdf) => (
              <TouchableOpacity
                key={pdf.id}
                className="flex-row items-center bg-[#282828] p-4 rounded-xl mb-3"
                onPress={() => handleViewStory(pdf)}
              >
                <View className="w-12 h-12 rounded-lg bg-[#1F1F1F] justify-center items-center mr-3">
                  <Ionicons name="document-text" size={24} color="#1DB954" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium mb-1" numberOfLines={1}>
                    {pdf.title}
                  </Text>
                  <Text className="text-gray-400 text-sm" numberOfLines={1}>
                    {pdf.narrator} • {pdf.duration}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          className="mx-4 mb-6 py-4 rounded-xl bg-[#282828] items-center"
          onPress={clearStorage}
          disabled={isLoading}
        >
          <Text className="text-red-500 font-semibold">
            {isLoading ? 'Clearing...' : 'Clear Storage'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: 'white',
    height: 55,
  },
});