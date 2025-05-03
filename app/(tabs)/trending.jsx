import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

export default function Trending() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const trendingStories = [
    {
      id: 1,
      title: "The Dragon's Quest",
      views: "12.5K",
      trend: "+25%",
      color: ['#FF9A9E', '#FAD0C4'],
      icon: "flame",
    },
    {
      id: 2,
      title: "Space Explorers",
      views: "10.2K",
      trend: "+18%",
      color: ['#A18CD1', '#FBC2EB'],
      icon: "rocket",
    },
    {
      id: 3,
      title: "Underwater Friends",
      views: "9.8K",
      trend: "+15%",
      color: ['#84FAB0', '#8FD3F4'],
      icon: "water",
    },
  ];

  const weeklyHighlights = [
    {
      id: 1,
      title: "Most Read Story",
      story: "The Magical Forest",
      count: "15.2K reads",
      icon: "book",
    },
    {
      id: 2,
      title: "Most Liked Story",
      story: "Princess Adventure",
      count: "8.5K likes",
      icon: "heart",
    },
    {
      id: 3,
      title: "Most Shared Story",
      story: "The Brave Knight",
      count: "5.2K shares",
      icon: "share",
    },
  ];

  return (
    // <SafeAreaView style={styles.container}>
    //   <ScrollView
    //     showsVerticalScrollIndicator={false}
    //     contentContainerStyle={styles.scrollContent}
    //   >
    //     <View style={styles.header}>
    //       <Text style={styles.headerTitle}>Trending Now 🔥</Text>
    //       <TouchableOpacity style={styles.statsButton}>
    //         <Ionicons name="stats-chart" size={22} color="#666" />
    //       </TouchableOpacity>
    //     </View>

    //     <ScrollView
    //       horizontal
    //       showsHorizontalScrollIndicator={false}
    //       contentContainerStyle={styles.trendingContainer}
    //       decelerationRate="fast"
    //       snapToInterval={CARD_WIDTH + 20}
    //     >
    //       {trendingStories.map((story, index) => (
    //         <Animated.View
    //           key={story.id}
    //           style={[
    //             styles.trendingCard,
    //             {
    //               opacity: fadeAnim,
    //               transform: [{ scale: scaleAnim }],
    //             },
    //           ]}
    //         >
    //           <LinearGradient
    //             colors={story.color}
    //             style={styles.cardGradient}
    //             start={{ x: 0, y: 0 }}
    //             end={{ x: 1, y: 1 }}
    //           >
    //             <View style={styles.trendingHeader}>
    //               <Ionicons name={story.icon} size={28} color="#FFF" />
    //               <View style={styles.trendBadge}>
    //                 <Ionicons name="trending-up" size={14} color="#00B07C" />
    //                 <Text style={styles.trendText}>{story.trend}</Text>
    //               </View>
    //             </View>
    //             <Text style={styles.trendingTitle}>{story.title}</Text>
    //             <Text style={styles.viewsText}>{story.views} readers this week</Text>
    //           </LinearGradient>
    //         </Animated.View>
    //       ))}
    //     </ScrollView>

    //     <View style={styles.weeklySection}>
    //       <Text style={styles.sectionTitle}>Weekly Highlights</Text>
    //       {weeklyHighlights.map((highlight, index) => (
    //         <Animated.View
    //           key={highlight.id}
    //           style={[
    //             styles.highlightCard,
    //             {
    //               opacity: fadeAnim,
    //               transform: [{
    //                 translateY: fadeAnim.interpolate({
    //                   inputRange: [0, 1],
    //                   outputRange: [50 * (index + 1), 0],
    //                 }),
    //               }],
    //             },
    //           ]}
    //         >
    //           <View style={styles.highlightIcon}>
    //             <Ionicons name={highlight.icon} size={24} color="#FF6B6B" />
    //           </View>
    //           <View style={styles.highlightInfo}>
    //             <Text style={styles.highlightTitle}>{highlight.title}</Text>
    //             <Text style={styles.highlightStory}>{highlight.story}</Text>
    //             <Text style={styles.highlightCount}>{highlight.count}</Text>
    //           </View>
    //           <TouchableOpacity style={styles.arrowButton}>
    //             <Ionicons name="chevron-forward" size={20} color="#666" />
    //           </TouchableOpacity>
    //         </Animated.View>
    //       ))}
    //     </View>

    //     <View style={styles.statsSection}>
    //       <Text style={styles.sectionTitle}>Quick Stats</Text>
    //       <View style={styles.statsGrid}>
    //         {[
    //           { title: "Total Reads", value: "45.2K", icon: "book" },
    //           { title: "Active Readers", value: "12.8K", icon: "people" },
    //           { title: "Avg. Rating", value: "4.8", icon: "star" },
    //           { title: "Stories", value: "250+", icon: "library" },
    //         ].map((stat, index) => (
    //           <View key={index} style={styles.statCard}>
    //             <Ionicons name={stat.icon} size={24} color="#FF6B6B" />
    //             <Text style={styles.statValue}>{stat.value}</Text>
    //             <Text style={styles.statTitle}>{stat.title}</Text>
    //           </View>
    //         ))}
    //       </View>
    //     </View>
    //   </ScrollView>
    // </SafeAreaView>
    <View style = {{flex:1, justifyContent:'center', alignItems:'center',fontSize:20}}>
      <Text>Trending Page</Text>
    </View>
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
  statsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingContainer: {
    paddingLeft: 20,
    paddingRight: 10,
    marginBottom: 30,
  },
  trendingCard: {
    width: CARD_WIDTH,
    height: 180,
    marginRight: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendText: {
    color: '#00B07C',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  trendingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 1,
  },
  viewsText: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  weeklySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },
  highlightIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  highlightInfo: {
    flex: 1,
    marginLeft: 15,
  },
  highlightTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  highlightStory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  highlightCount: {
    fontSize: 13,
    color: '#666',
  },
  arrowButton: {
    padding: 5,
  },
  statsSection: {
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
});