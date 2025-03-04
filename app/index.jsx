import { Text, View, TouchableOpacity, Dimensions, Animated, Easing, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const emojiScale = useRef(Array(5).fill(0).map(() => new Animated.Value(0))).current;

  // Initial animations sequence
  useEffect(() => {
    // Main content fade in and slide up
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ]).start();

    // Staggered emoji entrance
    Animated.stagger(200, 
      emojiScale.map(scale => 
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      )
    ).start();

    // Subtle icon rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const spin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg']
  });

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2C3E50', '#3498DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.98)',
              borderRadius: 35,
              padding: 32,
              width: width * 0.9,
              alignItems: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 15 },
              shadowOpacity: 0.2,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            <Animated.View 
              style={{ 
                transform: [{ rotate: spin }],
                marginBottom: 25,
              }}
            >
              <View style={{
                flexDirection: 'row',
                gap: 8,
              }}>
                <Text style={{ fontSize: 42 }}>📖</Text>
                <Text style={{ fontSize: 42 }}>✨</Text>
              </View>
            </Animated.View>
            
            <Text
              style={{
                fontSize: 15,
                color: '#0A84FF',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Welcome to
            </Text>

            <Text
              style={{
                fontSize: 36,
                fontWeight: "800",
                color: '#1C1C1E',
                marginBottom: 12,
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              StoryTime
            </Text>

            <Text
              style={{
                fontSize: 19,
                color: '#636366',
                textAlign: "center",
                marginBottom: 32,
                lineHeight: 26,
                fontWeight: "400",
                paddingHorizontal: 15,
              }}
            >
              Discover a world of magical stories crafted specially for young minds
            </Text>

            <View
              style={{
                marginBottom: 35,
                backgroundColor: '#F2F2F7',
                borderRadius: 22,
                padding: 20,
                width: '100%',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {['🦁', '🧚‍♀️', '🐉', '🤴', '👸'].map((emoji, index) => (
                  <Animated.View 
                    key={index}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 18,
                      width: 45,
                      height: 45,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 3,
                      transform: [{ scale: emojiScale[index] }],
                    }}
                  >
                    <Text style={{ fontSize: 25 }}>{emoji}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/auth/signUp")}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={{ width: '100%' }}
            >
              <Animated.View
                style={{
                  transform: [{ scale: buttonScale }],
                  width: '100%',
                }}
              >
                <LinearGradient
                  colors={['#0A84FF', '#0066CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 18,
                    borderRadius: 16,
                    alignItems: 'center',
                    shadowColor: "#0A84FF",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 18,
                      fontWeight: "600",
                      letterSpacing: 0.5,
                    }}
                  >
                    Begin Your Journey
                  </Text>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </>
  );
} 