import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Added useSafeAreaInsets import
import API from '../API/axiosConfig'; // Added API import

const inputdata = [
  { id: 1, label: "Name", icon: "person-outline", key: "full_name" }, // Added key for mapping
  { id: 2, label: "Mobile", icon: "call-outline", key: "phone" }, // Added key for mapping
  { id: 3, label: "Email", icon: "mail-outline", key: "email" }, // Added key for mapping
  { id: 4, label: "Gender", icon: "male-female-outline", key: "gender" }, // Added key for mapping
];

const { width } = Dimensions.get('window');

const Editprofile = () => { // Removed props
  const insets = useSafeAreaInsets(); // Added useSafeAreaInsets
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ // Changed from formData to userData
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    profile_picture: null,
  });
  const [isFocused, setIsFocused] = useState({}); // Kept isFocused state

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      const token = await AsyncStorage.getItem("token");

      if (!userId || !token) return;

      const response = await API.post( // Used API instance
        "/user/get", // Relative URL
        { id: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUserData({
          full_name: response.data.user.full_name,
          email: response.data.user.email,
          phone: response.data.user.phone,
          gender: response.data.user.gender,
          profile_picture: response.data.user.profile_picture,
        });
      }
    } catch (error) {
      console.log("FETCH USER DATA ERROR", error.response?.data || error.message);
    }
  };

  const handleChange = (key, value) => { // Modified handleChange to use userData
    setUserData(prev => ({ ...prev, [key]: value }));
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async () => { // Renamed from handleUpdate to handleSubmit for consistency
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");

      if (!token || !userId) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const response = await API.put( // Used API instance and relative URL
        "/user/update",
        {
          id: userId,
          full_name: userData.full_name,
          phone: userData.phone,
          email: userData.email,
          gender: userData.gender,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) { // Check for success property
        Alert.alert("Success", "Profile updated successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", response.data.message || "Failed to update profile");
      }

    } catch (error) {
      Alert.alert("Error", error.response?.data.message || "Failed to update profile");
      console.log("API ERROR ", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F87F16" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon1 name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Icon Card */}
          <View style={styles.profileIconContainer}>
            <View style={styles.profileIcon}>
              <Image source={{
                uri: userData.profile_picture
              }} style={{ height: 100, width: 100, borderRadius: 50, }} />
              {/* <Icon1 name="person" size={70} color="#F87F16" /> */}
            </View>
            <Text style={styles.profileText}>Update your personal information</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {inputdata.map(item => (
              <View key={item.id} style={styles.inputCard}>
                <View style={styles.inputHeader}>
                  <Icon1
                    name={item.icon}
                    size={20}
                    color={isFocused[item.label] ? "#F87F16" : "#1A3848"}
                    style={styles.inputIcon}
                  />
                  <Text style={styles.label}>{item.label}</Text>
                </View>

                <View style={[
                  styles.inputWrapper,
                  isFocused[item.label] && styles.inputWrapperFocused
                ]}>
                  <TextInput
                    placeholder={`Enter ${item.label.toLowerCase()}`}
                    placeholderTextColor="#888"
                    style={styles.input}
                    value={userData[item.key] || ""}
                    autoCapitalize={item.label === "Email" ? "none" : "words"}
                    maxLength={item.label === "Mobile" ? 10 : 50}
                    keyboardType={
                      item.label === "Mobile"
                        ? "number-pad"
                        : item.label === "Email"
                          ? "email-address"
                          : "default"
                    }
                    onChangeText={(text) => handleChange(item.key, text)}
                  // onFocus={() => handleFocus(item.label)}
                  // onBlur={() => handleBlur(item.label)}
                  />
                </View>

                {item.label === "Mobile" && (
                  <Text style={styles.hintText}>Enter 10-digit mobile number</Text>
                )}
                {item.label === "Email" && (
                  <Text style={styles.hintText}>Enter valid email address</Text>
                )}
              </View>
            ))}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              disabled={loading}
              activeOpacity={0.9}
            >
              <View style={styles.buttonContent}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Icon1 name="refresh" size={20} color="#FFFFFF" />
                    <Text style={styles.submitText}>Updating...</Text>
                  </View>
                ) : (
                  <>
                    <Icon1 name="checkmark-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.submitText}>Update Profile</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Editprofile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F87F16",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F87F16',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 44,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileIconContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  profileIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 40,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: 600,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  inputCard: {
    marginBottom: 25,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  label: {
    color: "#1A3848",
    fontSize: 16,
    fontWeight: "700",
  },
  inputWrapper: {
    backgroundColor: "#F8F9FA",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperFocused: {
    borderColor: '#F87F16',
    backgroundColor: '#FFF9F2',
    elevation: 2,
    shadowColor: '#F87F16',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A3848',
    padding: 0,
    fontWeight: '500',
  },
  hintText: {
    color: '#6C757D',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 8,
    fontWeight: '400',
  },
  submitButton: {
    backgroundColor: '#1A3848',
    borderRadius: 15,
    paddingVertical: 18,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#1A3848',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
  },
});