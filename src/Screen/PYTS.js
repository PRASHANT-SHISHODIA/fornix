import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/* ===================== SCREEN SIZE ===================== */
const { width, height } = Dimensions.get('window');

/* ===================== RESPONSIVE HELPERS ===================== */
const scale = s => (width / 375) * s;
const verticalScale = s => (height / 812) * s;
const moderateScale = (s, f = 0.5) => s + (scale(s) - s) * f;

const getResponsiveSize = size => {
  if (width < 375) return size * 0.85;
  if (width > 414) return size * 1.15;
  return size;
};

const getHeaderTransform = () => {
  if (width < 375) return 1.6;
  if (width > 414) return 1.8;
  return 1.7;
};

const getSearchTransform = () => {
  if (width < 375) return 0.62;
  if (width > 414) return 0.55;
  return 0.58;
};

/* ===================== API ===================== */
const api = axios.create({
  baseURL: 'https://fornix-medical.vercel.app/api/v1/mobile',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const PYTsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log('suject', subjects)

  /* ===================== LOAD COURSE ===================== */
  useEffect(() => {
    const loadCourse = async () => {
      try {
        const stored = await AsyncStorage.getItem('selectedCourse');
        if (!stored) {
          setError('No course selected');
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(stored);
        if (!parsed?.courseId) {
          setError('Invalid course data');
          setLoading(false);
          return;
        }

        setSelectedCourse(parsed);
      } catch {
        setError('Failed to load course');
        setLoading(false);
      }
    };

    loadCourse();
  }, []);

  /* ===================== FETCH SUBJECTS ===================== */
  const fetchPYTSubjects = useCallback(async () => {
    if (!selectedCourse?.courseId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/pyt/subjects', {
        course_id: selectedCourse.courseId,
      });

      if (res.data?.success) {
        setSubjects(res.data.subjects || []);
      } else {
        setError(res.data?.message || 'Failed to load subjects');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse?.courseId) {
      fetchPYTSubjects();
    }
  }, [selectedCourse, fetchPYTSubjects]);

  /* ===================== FILTER ===================== */
  const filteredSubjects = subjects.filter(s =>
    s?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ===================== LOADING ===================== */
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
            >
              <Icon1 name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <Icon1 name="search" size={20} color="white" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="white"
                editable={false}
              />
            </View>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A3848" />
          <Text style={styles.loadingText}>Loading subjects...</Text>
        </View>
      </View>
    );
  }

  /* ===================== ERROR ===================== */
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Icon name="exclamation-circle" size={60} color="#F87F16" />
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={fetchPYTSubjects}>
            <Icon name="sync-alt" size={16} color="white" />
            <Text style={styles.retryButtonText}> Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ===================== MAIN UI ===================== */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
            >
              <Icon1 name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <Icon1 name="search" size={20} color="white" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search subjects"
                placeholderTextColor="white"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon1 name="close-circle" size={18} color="white" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.courseTitleContainer}>
          <Text style={styles.courseTitle}>
            {selectedCourse?.courseName} - Subjects
          </Text>
          <Text style={styles.subjectCount}>
            {filteredSubjects.length} Subjects
          </Text>
        </View>

        {/* Subject Cards */}
        <View style={styles.subjectsContainer}>
          {filteredSubjects.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.subjectCard,
                index % 2 === 0
                  ? styles.subjectCardEven
                  : styles.subjectCardOdd,
              ]}
              onPress={() =>
                navigation.navigate('PYTsTopicScreen', {
                  subjectId: item.id,              // ✅ MAIN THING
                  subjectName: item.name,
                  courseId: selectedCourse.courseId,
                  courseName: selectedCourse.courseName,
                })
              }>

              <Text style={styles.subjectName}>{item.name}</Text>

              {/* YEARS INSIDE CARD */}
              {item?.years?.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.yearsContainer}>
                  {item.years.map((year, idx) => (
                    <View key={idx} style={styles.yearTag}>
                      <Text style={styles.yearText}>{year}</Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noYearsContainer}>
                  <Text style={styles.noYearsText}>No years available</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

/* ===================== STYLES (UNCHANGED VISUALLY) ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    backgroundColor: '#F87F16',
    marginBottom: verticalScale(getResponsiveSize(40)),
    height: verticalScale(getResponsiveSize(170)),
    borderBottomLeftRadius: scale(getResponsiveSize(400)),
    borderBottomRightRadius: scale(getResponsiveSize(400)),
    transform: [{ scaleX: getHeaderTransform() }],
  },

  searchContainer: {
    paddingHorizontal: scale(getResponsiveSize(50)),
    paddingTop: verticalScale(getResponsiveSize(40)),
    transform: [{ scaleX: getSearchTransform() }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  headerBackButton: {
    marginRight: scale(5),
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(22),
    paddingHorizontal: scale(15),
    flex: 1,
  },

  searchInput: {
    flex: 1,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },

  courseTitleContainer: {
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
  },

  courseTitle: {
    fontSize: moderateScale(18),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
  },

  subjectCount: {
    fontSize: moderateScale(14),
    color: '#666',
  },

  subjectsContainer: {
    paddingHorizontal: scale(15),
  },

  subjectCard: {
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(15),
    padding: scale(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  subjectCardEven: {
    borderLeftWidth: scale(4),
    borderLeftColor: '#1A3848',
  },

  subjectCardOdd: {
    borderLeftWidth: scale(4),
    borderLeftColor: '#F87F16',
  },

  subjectName: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    marginBottom: verticalScale(8),
  },

  yearsContainer: { flexDirection: 'row' },

  yearTag: {
    backgroundColor: '#F0F4F8',
    borderRadius: moderateScale(6),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    marginRight: scale(5),
  },

  yearText: {
    fontSize: moderateScale(10),
    color: '#1A3848',
    fontFamily: 'Poppins-Medium',
  },

  noYearsContainer: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },

  noYearsText: {
    fontSize: moderateScale(10),
    color: '#856404',
    fontFamily: 'Poppins-Medium',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(100),
  },

  loadingText: {
    marginTop: verticalScale(20),
    color: '#1A3848',
    fontFamily: 'Poppins-Medium',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },

  errorText: {
    marginVertical: verticalScale(20),
    color: '#D32F2F',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: '#1A3848',
    padding: scale(12),
    borderRadius: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
  },

  retryButtonText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
  },

  backButton: {
    backgroundColor: '#F87F16',
    marginTop: verticalScale(10),
    padding: scale(12),
    borderRadius: moderateScale(8),
  },

  backButtonText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default PYTsScreen;
