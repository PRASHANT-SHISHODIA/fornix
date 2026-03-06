import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  TextInput,
  Animated,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Screen width and height
const { width, height } = Dimensions.get('window');

// 🔹 Scale function to adjust UI for all screen sizes
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// 🔹 Responsive size function based on screen width
const getResponsiveSize = (size) => {
  if (width < 375) { // Small phones
    return size * 0.85;
  } else if (width > 414) { // Large phones
    return size * 1.15;
  }
  return size; // Normal phones
};

// 🔹 Get responsive transform values for header
const getHeaderTransform = () => {
  if (width < 375) return 1.6; // Small phones
  if (width > 414) return 1.8; // Large phones
  return 1.7; // Normal phones
};

// 🔹 Get responsive search container transform
const getSearchTransform = () => {
  if (width < 375) return 0.62; // Small phones
  if (width > 414) return 0.55; // Large phones
  return 0.58; // Normal phones
};

const FEATURES_CONFIG = [
  {
    id: '1',
    title: 'Q Bank',
    icon: 'question-circle',
    description: 'Access question bank',
    screen: 'Qbanksubject',
    bgColor: '#E3F2FD',
    iconColor: '#1976D2',
  },
  {
    id: '2',
    title: 'PYQs', // Will handle PYTs separately based on course
    icon: 'file-alt',
    description: 'Previous year questions',
    screen: 'PYQs',
    bgColor: '#FFF3E0',
    iconColor: '#F57C00',
  },
  {
    id: '3',
    title: 'Mock Test',
    icon: 'clipboard-list',
    description: 'Take mock tests',
    screen: 'MockTest',
    bgColor: '#E8F5E9',
    iconColor: '#388E3C',
  },
  {
    id: '4',
    title: 'Analysis',
    icon: 'chart-bar',
    description: 'Performance analysis',
    screen: 'AnalysisScreen',
    bgColor: '#F3E5F5',
    iconColor: '#7B1FA2',
  },
  {
    id: '5',
    title: 'Notes',
    icon: 'sticky-note',
    description: 'Study notes',
    screen: 'Notes',
    bgColor: '#FFFDE7',
    iconColor: '#FBC02D',
  },
  {
    id: '6',
    title: 'Smart Tracking',
    icon: 'chart-line',
    screen: 'SmartTracking',
    bgColor: '#E0F2F1',
    iconColor: '#00796B',
  },
  {
    id: '7',
    title: 'AI Bot',
    icon: 'robot',
    description: 'AI interaction',
    screen: 'AiBot',
    bgColor: '#FFEBEE',
    iconColor: '#D32F2F',
  },
  {
    id: '8',
    title: 'University exams',
    icon: 'university',
    description: 'University exams',
    screen: 'UniversityExams',
    bgColor: '#E1F5FE',
    iconColor: '#0288D1',
  },
];

const BasicPlan = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await loadCourse();
    await fetchSubscriptions();
  };

  const loadCourse = async () => {
    const courseData = await AsyncStorage.getItem('selectedCourse');
    if (courseData) {
      const parsed = JSON.parse(courseData);
      setSelectedCourse(parsed);
    }
  };
  console.log("selectedCourse", selectedCourse);

  const fetchSubscriptions = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");

      if (!token || !userId) return;

      const response = await axios.post(
        "https://fornix-medical.vercel.app/api/v1/user/get",
        { id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        setSubscriptions(response.data.subscriptions || []);
      }
    } catch (error) {
      console.log("Error fetching subscriptions:", error);
    }
  };




  const features = FEATURES_CONFIG.map(item => {
    // Especial handling for PYQs/PYTs based on Course
    if (item.id === '2') {
      const isAMC = selectedCourse?.courseName?.includes('AMC');
      return {
        ...item,
        title: isAMC ? 'PYTs' : 'PYQs',
        onPress: () => navigation.navigate('PYTS'),
      };
    }
    return {
      ...item,
      onPress: () => navigation.navigate(item.screen),
    };
  });

  // 🔹 Blinking button animation
  const blinkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [blinkAnim]);

  const backgroundColor = blinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1A3848', '#F87F16'],
  });



  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon1
                name="search"
                size={moderateScale(getResponsiveSize(20))}
                color="white"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="white"
              />
            </View>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Icon name="star" size={18} color="#F87F16" solid />
          <Text style={styles.sectionTitle}>My Plan Features</Text>
        </View>

        {/* Features Grid */}
        <FlatList
          data={features}
          keyExtractor={item => item.id}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.featuresGrid}
          columnWrapperStyle={{ justifyContent: 'flex-start' }}
          renderItem={({ item }) => (
            <View style={styles.featureItem}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.featureCard}
                onPress={item.onPress}>
                <View style={[styles.featureIconContainer, { backgroundColor: item.bgColor }]}>
                  <Icon
                    name={item.icon}
                    size={moderateScale(getResponsiveSize(22))}
                    color={item.iconColor}
                  />
                </View>
              </TouchableOpacity>
              <Text style={styles.featureTitle}>{item.title}</Text>
            </View>
          )}
        />
      </ScrollView>
      {subscriptions.length === 0 && (
        <Animated.View
          style={[
            styles.upgradeButton,
            { backgroundColor }
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("CourseSunscription", { params: { course: selectedCourse } })}
            style={styles.upgradeButtonInner}
          >
            <Icon name="crown" size={16} color="#fff" />
            <Text style={styles.upgradeButtonText}>Go Pro</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(getResponsiveSize(20)),
  },
  header: {
    backgroundColor: '#F87F16',
    marginBottom: verticalScale(getResponsiveSize(40)),
    paddingBottom: verticalScale(getResponsiveSize(10)),
    height: verticalScale(getResponsiveSize(170)),
    borderBottomLeftRadius: scale(getResponsiveSize(400)),
    borderBottomRightRadius: scale(getResponsiveSize(400)),
    transform: [{ scaleX: getHeaderTransform() }],
  },
  searchContainer: {
    paddingHorizontal: scale(getResponsiveSize(50)),
    paddingVertical: verticalScale(getResponsiveSize(20)),
    transform: [{ scaleX: getSearchTransform() }],
    paddingTop: verticalScale(getResponsiveSize(40)),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(22)),
    paddingHorizontal: scale(getResponsiveSize(15)),
    paddingVertical: verticalScale(getResponsiveSize(3)),
  },
  searchIcon: {
    marginRight: scale(getResponsiveSize(10)),
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: moderateScale(getResponsiveSize(14)),
    color: 'white',
    includeFontPadding: false,
  },
  featuresGrid: {
    paddingHorizontal: scale(getResponsiveSize(30)),
    marginBottom: verticalScale(getResponsiveSize(30)),
  },
  featureItem: {
    width: (width - scale(getResponsiveSize(60))) / 3,
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(25)),
  },
  featureCard: {
    width: scale(getResponsiveSize(70)),
    height: scale(getResponsiveSize(70)),
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(16)),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(getResponsiveSize(8)),
  },
  featureIconContainer: {
    width: scale(getResponsiveSize(55)),
    height: scale(getResponsiveSize(55)),
    borderRadius: scale(getResponsiveSize(27.5)),
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    // Remove border for a cleaner look
    // borderWidth: 2,
    // borderColor: '#F87F16',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureTitle: {
    fontSize: moderateScale(getResponsiveSize(11)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: verticalScale(getResponsiveSize(5)),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(getResponsiveSize(30)),
    marginBottom: verticalScale(getResponsiveSize(15)),
  },
  sectionTitle: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    marginLeft: scale(getResponsiveSize(10)),
    includeFontPadding: false,
  },
  upgradeButton: {
    position: 'absolute',
    right: scale(20),
    bottom: verticalScale(90), // footer se thoda upar
    borderRadius: moderateScale(30),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  upgradeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
  },

  upgradeButtonText: {
    color: '#fff',
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-SemiBold',
    marginLeft: scale(8),
  },

});

export default BasicPlan;