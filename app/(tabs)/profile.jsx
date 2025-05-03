import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const MOODS = ['happy', 'sad', 'angry', 'joy', 'surprise', 'calm', 'mysterious', 'exciting'];
const CATEGORIES = ['Fantasy', 'Drama', 'Adventure', 'Mystery', 'Romance', 'Sci-Fi', 'Horror', 'Comedy'];

export default function Profile() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [uploadedPdfs, setUploadedPdfs] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [storyFile, setStoryFile] = useState(null);

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
      const savedPDFs = await AsyncStorage.getItem('uploadedPDFs');
      if (savedPDFs) {
        const parsedPDFs = JSON.parse(savedPDFs);
        setUploadedPdfs(parsedPDFs);
      }
    } catch (error) {
      console.log('Error loading PDFs:', error);
    }
  };

  const handleAudioUpload = async () => {
    try {
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
    }
  };

  const handleStoryUpload = async () => {
    try {
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
    }
  };

  const handleViewStory = (story) => {
    router.push({
      pathname: '/(tabs)/stories',
      params: { storyId: story.id }
    });
  };

  const handleGenerateStory = async () => {
    if (!audioFile || !storyFile) {
      alert('Please upload both audio and story files');
      return;
    }

    // Simulate ML team response
    const mlResponse = {
      mood: MOODS[Math.floor(Math.random() * MOODS.length)],
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      duration: `${Math.floor(Math.random() * 5) + 3}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    };

    // Create a new story with ML team's output
    const newStory = {
      id: Date.now(),
      title: storyFile.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      mood: mlResponse.mood,
      category: mlResponse.category,
      duration: mlResponse.duration,
      type: 'generated',
      audioUrl: audioFile.uri,
      storyUrl: storyFile.uri,
      thumbnail: null,
      size: storyFile.size,
      createdAt: new Date().toISOString(),
    };

    try {
      // Get existing stories
      const existingStories = await AsyncStorage.getItem('uploadedPDFs');
      const stories = existingStories ? JSON.parse(existingStories) : [];
      
      // Add new story
      const updatedStories = [...stories, newStory];
      
      // Save to storage
      await AsyncStorage.setItem('uploadedPDFs', JSON.stringify(updatedStories));
      
      // Update local state
      setUploadedPdfs(updatedStories);
      
      // Clear the uploaded files
      setAudioFile(null);
      setStoryFile(null);
      
      // Navigate to stories tab
      router.push('/(tabs)/stories');
    } catch (error) {
      console.log('Error saving generated story:', error);
      alert('Error saving the generated story. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Upload Files</Text>

        <View style={styles.uploadSection}>
          <TouchableOpacity style={styles.uploadButton} onPress={handleAudioUpload}>
            <Ionicons name="mic" size={24} color="#FF6B6B" />
            <Text style={styles.uploadButtonText}>
              {audioFile ? `Audio: ${audioFile.name}` : 'Upload Audio'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={handleStoryUpload}>
            <Ionicons name="document-text" size={24} color="#FF6B6B" />
            <Text style={styles.uploadButtonText}>
              {storyFile ? `Story: ${storyFile.name}` : 'Upload Story'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.uploadButton, styles.generateButton]} 
            onPress={handleGenerateStory}
          >
            <Ionicons name="create" size={24} color="#FFF" />
            <Text style={[styles.uploadButtonText, styles.generateButtonText]}>
              Generate Story
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Previous Stories</Text>
        <View style={styles.pdfSection}>
          {uploadedPdfs.map((pdf) => (
            <Animated.View key={pdf.id} style={[styles.pdfCard, { opacity: fadeAnim }]}>
              <View style={styles.pdfIconContainer}>
                <Ionicons name="document-text" size={24} color="#FF6B6B" />
              </View>
              <View style={styles.pdfInfo}>
                <Text style={styles.pdfName} numberOfLines={1}>{pdf.title || pdf.name}</Text>
                <Text style={styles.pdfSize}>{pdf.size}</Text>
                <View style={styles.moodCategoryContainer}>
                  <View style={[styles.moodBadge, { backgroundColor: getMoodColor(pdf.mood) }]}>
                    <Text style={styles.badgeText}>{pdf.mood}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.badgeText}>{pdf.category}</Text>
                  </View>
                </View>
                <Text style={styles.pdfDuration}>Duration: {pdf.duration}</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => handleViewStory(pdf)}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* <TouchableOpacity style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const getMoodColor = (mood) => {
  const moodColors = {
    happy: '#FFB7B7',
    sad: '#B7D4FF',
    angry: '#FF8C8C',
    joy: '#FFD700',
    surprise: '#FFA07A',
    calm: '#B7FFD8',
    mysterious: '#B7D4FF',
    exciting: '#FFB88C',
  };
  return moodColors[mood] || '#FF6B6B';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 100 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'black',
    marginLeft: 20,
    marginBottom: 15,
    marginTop: 20,
  },
  uploadSection: { paddingHorizontal: 20, marginBottom: 25 },
  pdfSection: { paddingHorizontal: 20, marginBottom: 25 },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'black',
  },
  generateButton: {
    backgroundColor: '#FF6B6B',
    borderStyle: 'solid',
    borderColor: 'black',
    marginTop: 10,
  },
  generateButtonText: {
    color: '#FFF',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: 10,
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },
  pdfIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  pdfInfo: { flex: 1 },
  pdfName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  pdfSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pdfDuration: {
    fontSize: 12,
    color: '#444',
    marginTop: 2,
  },
  viewButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  signOutButton: {
    margin: 20,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  moodCategoryContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  moodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});