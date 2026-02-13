import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import API from '../API/axiosConfig';

const { width } = Dimensions.get('window');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;

const LoginDetail = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // States for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation state
  const [errorFields, setErrorFields] = useState({ email: false, password: false });

  const getSelectedCourseFromStorage = async () => {
    try {
      const data = await AsyncStorage.getItem('selectedCourse');
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.log('Read selectedCourse error', e);
      return null;
    }
  };


  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle login
  const handleLogin = async () => {
    const newErrors = {
      email: email.trim() === '',
      password: password.trim() === '',
    };

    setErrorFields(newErrors);

    if (Object.values(newErrors).some(val => val)) {
      Alert.alert('Missing Fields!', 'Please fill all the fields.');
      return;
    }

    try {
      const response = await API.post('/auth/login', {
        identifier: email,
        password: password,
      });

      const data = response.data;
      console.log("LOGIN RESPONSE", data);

      if (data.success) {

        await AsyncStorage.setItem("token", data.token);

        await AsyncStorage.setItem("user_id", data.user.id);
        await AsyncStorage.setItem("user_data", JSON.stringify(data.user));

        // await fetchAndSaveSubjects(data.token)
        console.log("TOKEN SAVED", data.token);
        console.log("USER ID SAVED", data.user.id);
        // 🔥 READ COURSE SELECTION
        const selectedCourse = await getSelectedCourseFromStorage();

        Alert.alert('Success', 'Login successful!');

        if (selectedCourse && selectedCourse.planId) {
          // ✅ Plan already purchased
          navigation.reset({
            index: 0,
            routes: [{ name: 'TabNavigation' }],
          });
        } else {
          // ❌ No plan → choose course
          navigation.reset({
            index: 0,
            routes: [{ name: 'TabNavigation' }],
          });
        }


        // Alert.alert('Success', 'Login successful!');
        // navigation.navigate('TabNavigation');
      } else {
        Alert.alert('Invalid Credentials', data.message || 'Try again.');
      }

    } catch (error) {
      console.log("LOGIN ERROR", error.response?.data || error.message);
      const errorData = error.response?.data;
      const errorMsg = errorData?.error || errorData?.message || 'Network error. Please try again.';
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Email / Phone Input */}
        <View
          style={[
            styles.inputContainer,
            {
              borderWidth: errorFields.email ? 1.5 : 0,
              borderColor: errorFields.email ? 'red' : 'transparent',
            },
          ]}>
          <Icon name="mail" size={20} color="#000" style={styles.leftIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Email / Phone no."
            placeholderTextColor="#999"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (text.trim() !== '')
                setErrorFields(prev => ({ ...prev, email: false }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View
          style={[
            styles.inputContainer,
            {
              borderWidth: errorFields.password ? 1.5 : 0,
              borderColor: errorFields.password ? 'red' : 'transparent',
            },
          ]}>
          <Icon name="bag" size={20} color="#000" style={styles.leftIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (text.trim() !== '')
                setErrorFields(prev => ({ ...prev, password: false }));
            }}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.rightIcon}>
            <Icon
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#000"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.forgotContainer}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        {/* Cancel Button */}
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.replace('Signup');
          }
        }}>
          <Text style={styles.canceltext}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F87F16',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: '40%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 0,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 16,
    height: 50,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#000000CC',
    marginLeft: 10,
  },
  leftIcon: {
    marginRight: 5,
  },
  rightIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: '#1A3848',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 30,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  canceltext: {
    textAlign: 'center',
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
  },
  forgotContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },

  forgotText: {
    color: '#1A3848',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },

});

export default LoginDetail;
