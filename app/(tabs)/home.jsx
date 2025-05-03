import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenWrapper from '../components/ScreenWrapper';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export default function Home() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const featuredStories = [
    { id: 1, title: "The Magic Forest", age: "4-6", duration: "5 min", color: ['#FFB7B7', '#FF8C8C'] },
    { id: 2, title: "Space Adventure", age: "5-7", duration: "8 min", color: ['#B7D4FF', '#8CB4FF'] },
    { id: 3, title: "Dragon's Tale", age: "6-8", duration: "10 min", color: ['#B7FFD8', '#8CFFC0'] },
  ];

  const categories = [
    { id: 1, title: "Bedtime Stories", icon: "moon" },
    { id: 2, title: "Adventure", icon: "compass" },
    { id: 3, title: "Animals", icon: "paw" },
    { id: 4, title: "Fantasy", icon: "color-wand" },
  ];

  return (
    // <ScreenWrapper>
    //   <ScrollView
    //     showsVerticalScrollIndicator={false}
    //     onScroll={Animated.event(
    //       [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    //       { useNativeDriver: false }
    //     )}
    //     scrollEventThrottle={16}
    //     contentContainerStyle={styles.scrollContent}
    //   >
    //     <View style={styles.header}>
    //       <View>
    //         <Text style={styles.greeting}>Good Morning! 👋</Text>
    //         <Text style={styles.name}>Little Explorer</Text>
    //       </View>
    //       <TouchableOpacity style={styles.searchButton}>
    //         <Ionicons name="search" size={24} color="#666" />
    //       </TouchableOpacity>
    //     </View>

    //     <Text style={styles.sectionTitle}>Continue Reading</Text>
        
    //     <ScrollView
    //       horizontal
    //       showsHorizontalScrollIndicator={false}
    //       contentContainerStyle={styles.featuredContainer}
    //       decelerationRate="fast"
    //       snapToInterval={CARD_WIDTH + 20}
    //     >
    //       {featuredStories.map((story, index) => (
    //         <Animated.View
    //           key={story.id}
    //           style={[
    //             styles.featuredCard,
    //             {
    //               opacity: fadeAnim,
    //               transform: [
    //                 {
    //                   translateY: fadeAnim.interpolate({
    //                     inputRange: [0, 1],
    //                     outputRange: [50, 0],
    //                   }),
    //                 },
    //               ],
    //             },
    //           ]}
    //         >
    //           <LinearGradient
    //             colors={story.color}
    //             style={styles.cardGradient}
    //             start={{ x: 0, y: 0 }}
    //             end={{ x: 1, y: 1 }}
    //           >
    //             <View style={styles.cardContent}>
    //               <Text style={styles.cardTitle}>{story.title}</Text>
    //               <View style={styles.cardMeta}>
    //                 <Text style={styles.cardMetaText}>Age {story.age}</Text>
    //                 <Text style={styles.cardMetaText}>{story.duration}</Text>
    //               </View>
    //               <TouchableOpacity style={styles.playButton}>
    //                 <Ionicons name="play" size={24} color="#FF6B6B" />
    //               </TouchableOpacity>
    //             </View>
    //           </LinearGradient>
    //         </Animated.View>
    //       ))}
    //     </ScrollView>

    //     <Text style={styles.sectionTitle}>Categories</Text>
    //     <View style={styles.categoriesGrid}>
    //       {categories.map((category) => (
    //         <TouchableOpacity key={category.id} style={styles.categoryCard}>
    //           <View style={styles.categoryIcon}>
    //             <Ionicons name={category.icon} size={24} color="#FF6B6B" />
    //           </View>
    //           <Text style={styles.categoryTitle}>{category.title}</Text>
    //         </TouchableOpacity>
    //       ))}
    //     </View>

    //     <View style={styles.recommendedSection}>
    //       <Text style={styles.sectionTitle}>Recommended for You</Text>
    //       <TouchableOpacity style={styles.recommendedCard}>
    //         <LinearGradient
    //           colors={['#FFE5E5', '#FFD6D6']}
    //           style={styles.recommendedGradient}
    //         >
    //           <View style={styles.recommendedContent}>
    //             <Text style={styles.recommendedTitle}>New Stories Added!</Text>
    //             <Text style={styles.recommendedSubtitle}>
    //               Discover 5 new magical adventures
    //             </Text>
    //           </View>
    //         </LinearGradient>
    //       </TouchableOpacity>
    //     </View>
    //   </ScrollView>
    // </ScreenWrapper>
    <View style = {{flex:1, justifyContent:'center', alignItems:'center'}}>
      <Text>Home Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 80,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  searchButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  featuredContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  featuredCard: {
    width: CARD_WIDTH,
    height: 180,
    marginRight: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  cardMetaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  playButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  recommendedSection: {
    padding: 20,
  },
  recommendedCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  recommendedGradient: {
    padding: 20,
  },
  recommendedContent: {
    padding: 15,
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  recommendedSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});