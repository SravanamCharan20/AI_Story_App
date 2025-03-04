import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function Profile() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const achievements = [
    { id: 1, title: "Bookworm", description: "Read 10 stories", icon: "book", progress: 8 },
    { id: 2, title: "Early Bird", description: "Read 5 morning stories", icon: "sunny", progress: 3 },
    { id: 3, title: "Night Owl", description: "Read 5 bedtime stories", icon: "moon", progress: 4 },
  ];

  const favoriteGenres = [
    { id: 1, name: "Adventure", count: 15, color: ['#FF9A9E', '#FAD0C4'] },
    { id: 2, name: "Fantasy", count: 12, color: ['#A18CD1', '#FBC2EB'] },
    { id: 3, name: "Animals", count: 8, color: ['#84FAB0', '#8FD3F4'] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <LinearGradient
              colors={['#FF9A9E', '#FAD0C4']}
              style={styles.avatarContainer}
            >
              <Text style={styles.avatarText}>JD</Text>
            </LinearGradient>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>John Doe</Text>
              <Text style={styles.subtitle}>Little Explorer</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          {[
            { value: "25", label: "Stories Read" },
            { value: "12", label: "Hours Spent" },
            { value: "8", label: "Achievements" },
          ].map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Achievements</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achievementsContainer}
        >
          {achievements.map((achievement) => (
            <Animated.View
              key={achievement.id}
              style={[
                styles.achievementCard,
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.achievementIcon}>
                <Ionicons name={achievement.icon} size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDesc}>{achievement.description}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(achievement.progress / 10) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{achievement.progress}/10</Text>
            </Animated.View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Favorite Genres</Text>
        <View style={styles.genresGrid}>
          {favoriteGenres.map((genre) => (
            <Animated.View
              key={genre.id}
              style={[
                styles.genreCard,
                { opacity: fadeAnim }
              ]}
            >
              <LinearGradient
                colors={genre.color}
                style={styles.genreGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.genreName}>{genre.name}</Text>
                <Text style={styles.genreCount}>{genre.count} stories</Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
    paddingVertical: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  nameContainer: {
    marginLeft: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    marginBottom: 25,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 20,
    marginBottom: 15,
  },
  achievementsContainer: {
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  achievementCard: {
    width: 150,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  genreCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  genreGradient: {
    padding: 15,
  },
  genreName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  genreCount: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
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
});