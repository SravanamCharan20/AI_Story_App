import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function Stories() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const storyCategories = [
    { id: 1, title: "Popular Stories", color: ['#FFB7B7', '#FF8C8C'] },
    { id: 2, title: "New Arrivals", color: ['#B7D4FF', '#8CB4FF'] },
    { id: 3, title: "Age 3-5", color: ['#B7FFD8', '#8CFFC0'] },
    { id: 4, title: "Age 6-8", color: ['#FFE4B7', '#FFD28C'] },
  ];

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Magical Stories</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <Text style={styles.searchPlaceholder}>Search stories...</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {storyCategories.map((category, index) => (
            <TouchableOpacity key={category.id} style={styles.categoryButton}>
              <LinearGradient
                colors={category.color}
                style={styles.categoryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.categoryText}>{category.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.storiesGrid}>
          {featuredStories.map((story) => (
            <Animated.View
              key={story.id}
              style={[
                styles.storyCard,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.storyIconContainer}>
                <Ionicons name={story.icon} size={30} color="#FF6B6B" />
              </View>
              <View style={styles.storyInfo}>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyAuthor}>{story.author}</Text>
                <View style={styles.storyMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{story.duration}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={14} color="#FFB800" />
                    <Text style={styles.metaText}>{story.rating}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.playButton}>
                <Ionicons name="play" size={20} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: '#666',
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  categoryButton: {
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  categoryGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  storiesGrid: {
    paddingHorizontal: 20,
  },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  storyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  storyInfo: {
    flex: 1,
    marginLeft: 15,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  storyAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});