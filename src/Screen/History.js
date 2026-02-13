import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../API/axiosConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Also missing?
import Icon1 from 'react-native-vector-icons/Ionicons'; // Also missing?

// Screen dimensions
const { width, height } = Dimensions.get('window');

// 🔹 Responsive scaling
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

const History = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);

  // 🔹 Blink animation for header (optional - you can remove if not needed)
  const blinkAnim = new Animated.Value(0);
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

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setError(null);
      const userId = await AsyncStorage.getItem('user_id');

      if (!userId) {
        setError('Please login to view history');
        setLoading(false);
        return;
      }

      const response = await API.post(
        '/quiz-history',
        {
          user_id: userId,
        }
      );

      if (response.data.success) {
        // Sort by most recent first
        const sortedData = response.data.data.sort((a, b) =>
          new Date(b.started_at) - new Date(a.started_at)
        );
        setHistoryData(sortedData);
      } else {
        setError('Failed to load history');
      }
    } catch (error) {
      console.log('❌ HISTORY API ERROR:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green for high scores
    if (score >= 60) return '#FF9800'; // Orange for medium scores
    return '#F44336'; // Red for low scores
  };

  const formatTimeTaken = (seconds) => {
    const time = Number(seconds);
    if (!time || isNaN(time)) return 'N/A';

    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };


  const renderHistoryItem = (item, index) => {
    const scoreColor = getScoreColor(item.score) || 0;
    const totalQuestions = Number(item.total_questions) || 0;
    const correctAnswers = Number(item.correct_answers) || 0;
    const accuracy = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

    return (
      <TouchableOpacity
        key={item.id || index}
        style={styles.historyCard}
        onPress={() =>
          navigation.navigate('Results', {
            resultData: item,
            timeTaken: item.time_taken_seconds || 0,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.attemptInfo}>
            <Icon name="history" size={moderateScale(getResponsiveSize(18))} color="#666" />
            <Text style={styles.attemptText}>Attempt #{index + 1}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.started_at)}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {item.score}%
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Icon name="check-circle" size={moderateScale(getResponsiveSize(14))} color="#4CAF50" />
              <Text style={styles.statText}>
                Correct: {item.correct_answers}/{item.total_questions}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Icon name="chart-line" size={moderateScale(getResponsiveSize(14))} color="#2196F3" />
              <Text style={styles.statText}>
                Accuracy: {accuracy}%
              </Text>
            </View>
            <View style={styles.statRow}>
              <Icon name="timer" size={moderateScale(getResponsiveSize(14))} color="#FF9800" />
              <Text style={styles.statText}>
                Time: {formatTimeTaken(item.time_taken_seconds)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.subjectText}>
            {item.quiz_type || item.category || 'General Quiz'}
          </Text>
          <Icon name="chevron-right" size={moderateScale(getResponsiveSize(20))} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="history-off" size={moderateScale(getResponsiveSize(60))} color="#DDD" />
      <Text style={styles.emptyTitle}>No Quiz History</Text>
      <Text style={styles.emptyText}>
        You haven't taken any quizzes yet. Start practicing to build your history!
      </Text>
      <TouchableOpacity
        style={styles.startQuizButton}
        onPress={() => navigation.navigate('BasicPlan')}
      >
        <Text style={styles.startQuizText}>Start a Quiz</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={moderateScale(getResponsiveSize(50))} color="#F44336" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={fetchHistory}
      >
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.loadingText}>Loading history...</Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }>

        {/* 🔹 Header - Same as original */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}>
                <Icon1
                  name="arrow-back"
                  size={moderateScale(getResponsiveSize(28))}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <Text style={styles.title}>Quiz History</Text>
            </View>
            <Text style={styles.sectionTitle1}>Your Performance Records</Text>
          </View>
        </View>

        {/* 🔹 History Content Section */}
        <View style={styles.sectionContainer}>
          {loading ? (
            renderLoading()
          ) : error ? (
            renderErrorState()
          ) : historyData.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <Text style={styles.summaryText}>
                {historyData.length} attempt{historyData.length !== 1 ? 's' : ''} recorded
              </Text>
              {historyData.map(renderHistoryItem)}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// 🔹 Styles - Combined from both components
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
    paddingTop: verticalScale(getResponsiveSize(60)),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: width < 375 ? -25 : -30,
    paddingHorizontal: scale(getResponsiveSize(10)),
    zIndex: 1,
  },
  title: {
    fontSize: moderateScale(getResponsiveSize(25)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginBottom: verticalScale(getResponsiveSize(25)),
    includeFontPadding: false,
  },
  sectionTitle1: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginTop: verticalScale(getResponsiveSize(-20)),
    includeFontPadding: false,
  },
  sectionContainer: {
    marginHorizontal: scale(getResponsiveSize(20)),
    borderRadius: moderateScale(getResponsiveSize(16)),
    padding: scale(getResponsiveSize(20)),
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    marginBottom: verticalScale(getResponsiveSize(30)),
    minHeight: verticalScale(getResponsiveSize(300)),
  },
  // History Card Styles
  historyCard: {
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(12)),
    padding: scale(getResponsiveSize(16)),
    marginBottom: verticalScale(getResponsiveSize(12)),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(12)),
  },
  attemptInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attemptText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginLeft: scale(getResponsiveSize(8)),
  },
  dateText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Regular',
    color: '#fff',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(12)),
  },
  scoreCircle: {
    width: scale(getResponsiveSize(60)),
    height: scale(getResponsiveSize(60)),
    borderRadius: scale(getResponsiveSize(30)),
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(getResponsiveSize(16)),
    borderWidth: 2,
  },
  scoreText: {
    fontSize: moderateScale(getResponsiveSize(18)),
    fontFamily: 'Poppins-Bold',
  },
  statsContainer: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(6)),
  },
  statText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    marginLeft: scale(getResponsiveSize(8)),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: verticalScale(getResponsiveSize(12)),
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  subjectText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    fontStyle: 'italic',
  },
  // Loading, Error, Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(getResponsiveSize(40)),
  },
  loadingText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: verticalScale(getResponsiveSize(10)),
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(getResponsiveSize(40)),
  },
  errorText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: verticalScale(getResponsiveSize(10)),
    marginBottom: verticalScale(getResponsiveSize(20)),
    paddingHorizontal: scale(getResponsiveSize(20)),
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: scale(getResponsiveSize(30)),
    paddingVertical: verticalScale(getResponsiveSize(12)),
    borderRadius: moderateScale(getResponsiveSize(8)),
  },
  retryText: {
    color: '#FFF',
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(getResponsiveSize(60)),
    paddingHorizontal: scale(getResponsiveSize(20)),
  },
  emptyTitle: {
    fontSize: moderateScale(getResponsiveSize(24)),
    fontFamily: 'Poppins-Bold',
    color: '#999',
    marginTop: verticalScale(getResponsiveSize(16)),
    marginBottom: verticalScale(getResponsiveSize(8)),
  },
  emptyText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-Regular',
    color: '#AAA',
    textAlign: 'center',
    lineHeight: verticalScale(getResponsiveSize(22)),
    marginBottom: verticalScale(getResponsiveSize(24)),
  },
  startQuizButton: {
    backgroundColor: '#F87F16',
    paddingHorizontal: scale(getResponsiveSize(32)),
    paddingVertical: verticalScale(getResponsiveSize(12)),
    borderRadius: moderateScale(getResponsiveSize(8)),
  },
  startQuizText: {
    color: '#FFF',
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
  },
  summaryText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: verticalScale(getResponsiveSize(16)),
    marginLeft: scale(getResponsiveSize(4)),
  },
});

export default History;