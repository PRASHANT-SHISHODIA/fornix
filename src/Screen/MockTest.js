import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const getResponsiveSize = (size) => {
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

const MockTest = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [mockTests, setMockTests] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [userId] = useState('00c764c6-2dc0-4e13-a41b-2e3dcd32f471');
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const [courseId, setCourseId] = useState(null);



  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('user_id');
      const courseData = await AsyncStorage.getItem('selectedCourse');
      console.log("stor", storedUserId)
      console.log('courseData', courseData)


      if (!storedUserId) {
        Alert.alert('Error', 'User not found');
        return;
      }

      if (!courseData) {
        Alert.alert('Error', 'Course not found');
        return;
      }

      const course = JSON.parse(courseData);
      setUserId(storedUserId);
      setCourseId(course.courseId);
      console.log('couser', course)
      console.log("setCouserId", courseId)

    } catch (err) {
      console.log('Mock tests API error:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  useEffect(() => {
    if (userId && courseId) {
      fetchMockTests();
    }
  }, [userId, courseId]);


  // const fetchMockTests = async () => {
  //   try {
  //     setLoading(true);

  //     const response = await axios.post(
  //       'https://fornix-medical.vercel.app/api/v1/mobile/mock-tests',
  //       {
  //         course_id: courseId,
  //         user_id: userId,
  //       },
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         timeout: 15000,
  //       }
  //     );

  //     if (response.data?.success) {
  //       setMockTests(response.data.tests || []);
  //     } else {
  //       Alert.alert('Error', 'Failed to load mock tests');
  //     }
  //   } catch (error) {
  //     console.log('Mock tests API error:', error);

  //     if (error.response) {
  //       Alert.alert(
  //         'Error',
  //         error.response.data?.message || 'Server error'
  //       );
  //     } else {
  //       Alert.alert('Error', 'Network error');
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchMockTests = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        'https://fornix-medical.vercel.app/api/v1/mobile/mock-tests',
        {
          course_id: courseId,
          user_id: userId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      if (response?.data?.success) {
        setMockTests(response.data.tests || []);
      } else {
        Alert.alert('Error', 'Failed to load mock tests');
      }
    } catch (error) {
      // SAFE LOGGING (Hermes friendly)
      console.log('Mock tests error message:', error?.message);
      console.log('Mock tests error data:', error?.response?.data);

      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Network error'
      );
    } finally {
      setLoading(false);
    }
  };



  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getScoreText = (score) => {
    return score !== null ? `${score}%` : 'Not Attempted';
  };

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return '#666';
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const handleTestPress = (test) => {
    navigation.navigate('Mood', {
      testId: test.id,
      mode: 'MOCK_TEST'
    });
  };

  const filteredTests = mockTests.filter(test =>
    test.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container2, { paddingTop: insets.top }]}>
        <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />

        {/* Header - Same as PYT screen */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
            >
              <Icon1 name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <Icon1
                name="search"
                size={moderateScale(getResponsiveSize(20))}
                color="white"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search mock tests"
                placeholderTextColor="white"
                value={searchQuery}
                onChangeText={setSearchQuery}
                editable={false}
              />
            </View>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A3848" />
          <Text style={styles.loadingText}>Loading mock tests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Same as PYT screen */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
            >
              <Icon1 name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <Icon1
                name="search"
                size={moderateScale(getResponsiveSize(20))}
                color="white"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search mock tests"
                placeholderTextColor="white"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon1
                    name="close-circle"
                    size={moderateScale(getResponsiveSize(18))}
                    color="white"
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Mock Tests</Text>
          <View style={styles.infoRow}>
            <Text style={styles.count}>
              {filteredTests.length} {filteredTests.length === 1 ? 'Test' : 'Tests'}
            </Text>
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearFilterText}>Clear filter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mock Tests List */}
        {filteredTests.length > 0 ? (
          <View style={styles.testsContainer}>
            {filteredTests.map((test, index) => (
              <TouchableOpacity
                key={test.id}
                style={[
                  styles.testCard,
                  index % 2 === 0 ? styles.testCardEven : styles.testCardOdd,
                ]}
                onPress={() => handleTestPress(test)}
                activeOpacity={0.7}
              >
                <View style={styles.testContent}>
                  {/* Left side - Test info */}
                  <View style={styles.testInfo}>
                    <Text style={styles.testTitle}>{test.title}</Text>

                    <View style={styles.testStats}>
                      <View style={styles.statItem}>
                        <Icon name="question-circle" size={scale(14)} color="#1A3848" />
                        <Text style={styles.statText}>{test.total_questions || 0} Questions</Text>
                      </View>

                      <View style={styles.statItem}>
                        <Icon name="clock" size={scale(14)} color="#1A3848" />
                        <Text style={styles.statText}>{formatTime(test.duration_minutes || 0)}</Text>
                      </View>

                      <View style={styles.statItem}>
                        <Icon name="redo" size={scale(14)} color="#1A3848" />
                        <Text style={styles.statText}>{test.attempts_count || 0} Attempts</Text>
                      </View>
                    </View>

                    {/* Best Score */}
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreLabel}>Best Score: </Text>
                      <Text style={[
                        styles.scoreValue,
                        { color: getScoreColor(test.best_score) }
                      ]}>
                        {getScoreText(test.best_score)}
                      </Text>
                    </View>

                    {/* Description */}
                    {test.description && (
                      <Text style={styles.descriptionText} numberOfLines={2}>
                        {test.description}
                      </Text>
                    )}
                  </View>

                  {/* Right side - Start Button */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.startButton,
                        test.attempts_count > 0 ? styles.attemptedButton : styles.newButton
                      ]}
                      onPress={() => handleTestPress(test)}
                    >
                      <Text style={styles.buttonText}>
                        Start Test
                      </Text>
                      <Icon
                        name="play"
                        size={scale(12)}
                        color="white"
                        style={styles.buttonIcon}
                      />
                    </TouchableOpacity>
                    <Text style={[
                      styles.statusText,
                      test.attempts_count > 0 ? styles.statusAttempted : styles.statusNew
                    ]}>
                      {test.attempts_count > 0 ? 'Attempted' : 'New'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-list" size={scale(70)} color="#1A3848" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No tests found for your search' : 'No mock tests available'}
            </Text>
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Footer Note */}
        {/* <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Complete mock tests to track your progress
          </Text>
        </View> */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container2: {
    flex: 1,
    backgroundColor: '#F87F16',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(getResponsiveSize(20)),
  },
  // Header - Same as PYT screen
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
    borderRadius: moderateScale(getResponsiveSize(22)),
    paddingHorizontal: scale(getResponsiveSize(15)),
    paddingVertical: verticalScale(getResponsiveSize(3)),
    flex: 1,
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
  // Title Section
  titleContainer: {
    paddingHorizontal: scale(getResponsiveSize(20)),
    marginBottom: verticalScale(getResponsiveSize(20)),
  },
  title: {
    fontSize: moderateScale(getResponsiveSize(18)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    marginBottom: verticalScale(getResponsiveSize(5)),
    includeFontPadding: false,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    includeFontPadding: false,
  },
  clearFilterText: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Medium',
    color: '#F87F16',
    textDecorationLine: 'underline',
    includeFontPadding: false,
  },
  // Tests Container
  testsContainer: {
    paddingHorizontal: scale(getResponsiveSize(15)),
  },
  testCard: {
    backgroundColor: 'white',
    borderRadius: moderateScale(getResponsiveSize(12)),
    marginBottom: verticalScale(getResponsiveSize(15)),
    padding: scale(getResponsiveSize(15)),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  testCardEven: {
    borderLeftWidth: scale(4),
    borderLeftColor: '#1A3848',
  },
  testCardOdd: {
    borderLeftWidth: scale(4),
    borderLeftColor: '#F87F16',
  },
  testContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  testInfo: {
    flex: 1,
    marginRight: scale(getResponsiveSize(10)),
  },
  testTitle: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    marginBottom: verticalScale(getResponsiveSize(10)),
    includeFontPadding: false,
  },
  testStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: verticalScale(getResponsiveSize(10)),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scale(getResponsiveSize(15)),
    marginBottom: verticalScale(getResponsiveSize(5)),
  },
  statText: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginLeft: scale(getResponsiveSize(5)),
    includeFontPadding: false,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(10)),
  },
  scoreLabel: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    includeFontPadding: false,
  },
  scoreValue: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-SemiBold',
    includeFontPadding: false,
  },
  descriptionText: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Regular',
    color: '#555',
    lineHeight: moderateScale(getResponsiveSize(16)),
    includeFontPadding: false,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(getResponsiveSize(8)),
    paddingHorizontal: scale(getResponsiveSize(15)),
    paddingVertical: verticalScale(getResponsiveSize(8)),
    marginBottom: verticalScale(getResponsiveSize(5)),
  },
  newButton: {
    backgroundColor: '#F87F16',
  },
  attemptedButton: {
    backgroundColor: '#1A3848',
  },
  buttonText: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    marginRight: scale(getResponsiveSize(5)),
    includeFontPadding: false,
  },
  buttonIcon: {
    marginTop: verticalScale(getResponsiveSize(1)),
  },
  statusText: {
    fontSize: moderateScale(getResponsiveSize(10)),
    fontFamily: 'Poppins-Medium',
    includeFontPadding: false,
  },
  statusNew: {
    color: '#F87F16',
  },
  statusAttempted: {
    color: '#1A3848',
  },
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(getResponsiveSize(100)),
  },
  loadingText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-Medium',
    color: '#1A3848',
    marginTop: verticalScale(getResponsiveSize(20)),
    includeFontPadding: false,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(getResponsiveSize(50)),
    paddingHorizontal: scale(getResponsiveSize(40)),
  },
  emptyText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    textAlign: 'center',
    marginTop: verticalScale(getResponsiveSize(20)),
    includeFontPadding: false,
  },
  clearSearchText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Medium',
    color: '#F87F16',
    marginTop: verticalScale(getResponsiveSize(15)),
    textDecorationLine: 'underline',
    includeFontPadding: false,
  },
  // Footer
  footerContainer: {
    marginTop: verticalScale(getResponsiveSize(30)),
    marginBottom: verticalScale(getResponsiveSize(20)),
    paddingHorizontal: scale(getResponsiveSize(20)),
  },
  footerText: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default MockTest;