import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Animated, Easing, TextInput, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const inputsSlideUp = useRef([0, 1].map(() => new Animated.Value(20))).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const inputScales = useRef([0, 1].map(() => new Animated.Value(1))).current;

  // Initial animations
  useEffect(() => {
    const animations = [
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      ...inputsSlideUp.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          delay: 100 * index,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ),
    ];

    Animated.parallel(animations).start();
  }, []);

  const handleFocus = (index) => {
    Animated.spring(inputScales[index], {
      toValue: 1.02,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = (index) => {
    Animated.spring(inputScales[index], {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // Add validation function
  const validateInputs = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
    };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Add handleSubmit function
  const handleSubmit = async () => {
    if (!validateInputs()) {
      const firstError = Object.values(errors).find(error => error !== '');
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
      return;
    }

    setIsLoading(true);
    const { email, password } = formData;

    try {
      const response = await fetch('http://192.168.0.105:3000/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Call signIn from AuthContext
      await signIn(data.user);
      
      // Navigate after successful login
      router.replace('/(tabs)/home');

    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update renderInput to show error messages
  const renderInput = (input, index) => {
    const isPassword = input.placeholder.toLowerCase().includes('password');
    const fieldName = input.placeholder.toLowerCase().includes('email') 
      ? 'email' 
      : 'password';

    return (
      <Animated.View
        key={index}
        style={[{
          transform: [
            { translateY: inputsSlideUp[index] },
            { scale: inputScales[index] }
          ],
          width: '100%',
        }]}
      >
        <View style={[
          styles.inputContainer,
          errors[fieldName] ? styles.inputError : null
        ]}>
          <Text style={styles.inputIcon}>{input.icon}</Text>
          <TextInput
            style={styles.input}
            placeholder={input.placeholder}
            placeholderTextColor="#999"
            value={input.value}
            onChangeText={(text) => {
              setFormData({ ...formData, [fieldName]: text });
              if (errors[fieldName]) {
                setErrors({ ...errors, [fieldName]: '' });
              }
            }}
            secureTextEntry={isPassword && !showPassword}
            keyboardType={input.keyboardType}
            autoCapitalize="none"
            onFocus={() => handleFocus(index)}
            onBlur={() => handleBlur(index)}
            maxLength={isPassword ? 32 : 50}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          )}
        </View>
        {errors[fieldName] ? (
          <Text style={styles.errorText}>{errors[fieldName]}</Text>
        ) : null}
      </Animated.View>
    );
  };

  // Add renderButton function
  const renderButton = () => (
    <TouchableOpacity
      onPress={handleSubmit}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.buttonContainer}
      activeOpacity={0.9}
      disabled={isLoading}
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
          style={styles.button}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2C3E50', '#3498DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <View style={styles.card}>
              <View style={styles.headerContainer}>
                <Text style={styles.welcomeText}>Welcome Back!</Text>
                <Text style={styles.subtitleText}>
                  Continue your storytelling journey
                </Text>
              </View>

              {[
                {
                  placeholder: 'Email Address',
                  value: formData.email,
                  onChange: (text) => setFormData({ ...formData, email: text }),
                  icon: '✉️',
                  keyboardType: 'email-address',
                },
                {
                  placeholder: 'Password',
                  value: formData.password,
                  onChange: (text) => setFormData({ ...formData, password: text }),
                  icon: '🔒',
                  secureTextEntry: true,
                },
              ].map((input, index) => renderInput(input, index))}

              <TouchableOpacity
                style={styles.forgotPassword}
                activeOpacity={0.7}
                onPress={() => {/* Handle forgot password */}}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {renderButton()}

              <TouchableOpacity
                onPress={() => router.push("/auth/signUp")}
                style={styles.signUpLink}
                activeOpacity={0.7}
              >
                <Text style={styles.signUpText}>
                  New to StoryTime? <Text style={styles.signUpTextBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
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
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#636366',
    textAlign: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    marginBottom: 16,
    padding: 4,
    width: '100%',
    minHeight: 60,
  },
  inputIcon: {
    fontSize: 20,
    padding: 12,
    width: 48,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 52,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -5,
  },
  forgotPasswordText: {
    color: '#0A84FF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#0A84FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signUpLink: {
    marginTop: 20,
    padding: 10,
  },
  signUpText: {
    color: '#636366',
    fontSize: 15,
  },
  signUpTextBold: {
    color: '#0A84FF',
    fontWeight: '600',
  },
  passwordToggle: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
});