import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../API/axiosConfig';

const { width, height } = Dimensions.get('window');

// Responsive scaling
const scale = size => (width / 375) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const UniversityExams = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' or 'history'
  const [startingExamName, setStartingExamName] = useState('');

  useEffect(() => {
    if (activeTab === 'exams') {
      fetchExams();
    } else {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('user_id');
      const response = await API.post(
        '/university-exams/list',
        { user_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.success) {
        setExams(response.data.data || []);
      }
    } catch (error) {
      console.log('Error fetching university exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('user_id');

      console.log('--- FETCHING HISTORY ---');
      console.log('User ID:', userId);

      const response = await API.post(
        '/university-exams/history',
        { user_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('HISTORY API SUCCESS:', response.data);

      if (response.data?.success) {
        setHistory(response.data.data || []);
      }
    } catch (error) {
      console.log('--- HISTORY API ERROR ---');
      console.log('Error:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderExamCard = ({ item }) => {
    const isHistory = activeTab === 'history';

    const CardContent = (
      <>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Icon name="university" size={20} color="#F87F16" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.examName}>{item.exam_name || item.name}</Text>
            <Text style={styles.universityName}>{item.university_name || 'University Exam'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (item.is_attempted || isHistory) ? '#E8F5E9' : '#FFF3E0' }]}>
            <Text style={[styles.statusText, { color: (item.is_attempted || isHistory) ? '#2E7D32' : '#E65100' }]}>
              {isHistory ? 'Completed' : (item.is_attempted ? 'Attempted' : 'Pending')}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Icon name="graduation-cap" size={14} color="#1A3848" />
            <Text style={styles.detailText}>{item.academic_year || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="clock" size={14} color="#1A3848" />
            <Text style={styles.detailText}>{item.duration_minutes} mins</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="book" size={14} color="#1A3848" />
            <Text style={styles.detailText}>{item.exam_subjects || item.subjects || 'N/A'}</Text>
          </View>
        </View>

        {(item.is_attempted || isHistory || item.score !== undefined || item.attempt_score !== undefined) && (
          <View style={styles.scoreContainer}>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Final Score:</Text>
              <Text style={styles.scoreValue}>
                {item.score !== undefined ? item.score : (item.attempt_score !== undefined ? item.attempt_score : 0)}
                /
                {item.total_marks || item.attempt_total_marks || 0}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${((item.score ?? item.attempt_score ?? 0) / (item.total_marks ?? (item.attempt_total_marks || 1))) * 100}%`
                  }
                ]}
              />
            </View>
            {isHistory && item.completed_at && (
              <Text style={[styles.detailText, { marginTop: 8, fontSize: 10, color: '#666' }]}>
                Completed on: {new Date(item.completed_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {!isHistory && (
          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.8}
            onPress={() => handleStartExam(item.id, item.name || item.exam_name)}
          >
            <Text style={styles.startButtonText}>
              {item.is_attempted ? 'Retake Exam' : 'Start Exam'}
            </Text>
            <Icon1 name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        )}
      </>
    );

    if (isHistory) {
      return (
        <TouchableOpacity
          style={styles.card}
          // activeOpacity={0.9}
          // onPress={() => item.is_attempted && navigation.navigate('MockTestResults', { result: item, source: 'university' })}
          onPress={() => isHistory ? navigation.navigate('UniversityExamResults', { examId: item.exam_id || item.id, examName: item.exam_name || item.name }) : handleStartExam(item.id, item.name || item.exam_name)}
        >
          {CardContent}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.card}>
        {CardContent}
      </View>
    );
  };

  const handleStartExam = async (examId, examName = '') => {
    try {
      console.log('--- START EXAM FLOW ---');
      setStartingExamName(examName);
      setLoading(true);
      const userId = await AsyncStorage.getItem('user_id');
      const token = await AsyncStorage.getItem('token');

      console.log('Auth Check:', { userId, tokenExists: !!token });

      if (!userId || !token) {
        Alert.alert('Error', 'Session Expired. Please login again.');
        return;
      }

      console.log('API Request:', {
        url: '/university-exams/details',
        payload: { user_id: userId, exam_id: examId }
      });

      const response = await API.post(
        '/university-exams/details',
        {
          user_id: userId,
          exam_id: examId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('API RESPONSE SUCCESS:', response.data);

      if (response.data?.success) {
        navigation.navigate('Quizpage', {
          questions: response.data.data || [],
          attemptId: response.data.attempt_id,
          mode: 'university_exam',
          examId: examId,
        });
      } else {
        console.log('API SUCCESS FALSE:', response.data);
        Alert.alert('Alert', response.data?.message || 'Failed to start exam');
      }
    } catch (error) {
      console.log('--- API ERROR STARTING EXAM ---');
      if (error.response) {
        console.log('Status Code:', error.response.status);
        console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error Message:', error.message);
      }

      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Unable to start exam. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
      setStartingExamName('');
      console.log('--- END EXAM FLOW ---');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon1 name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>University Exams</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'exams' && styles.activeTabButton]}
            onPress={() => setActiveTab('exams')}
          >
            <Text style={[styles.tabText, activeTab === 'exams' && styles.activeTabText]}>Exams</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F87F16" />
          <Text style={styles.loadingText}>
            {startingExamName ? `Starting ${startingExamName}...` : `Loading ${activeTab === 'exams' ? 'Exams' : 'History'}...`}
          </Text>
        </View>
      ) : (activeTab === 'exams' ? exams : history).length === 0 ? (
        <View style={styles.centered}>
          <Icon name="clipboard-list" size={60} color="#DDD" />
          <Text style={styles.emptyText}>No {activeTab === 'exams' ? 'Exams' : 'History'} Available</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'exams' ? exams : history}
          keyExtractor={(item, index) => (item.attempt_id || item.id || index.toString())}
          renderItem={renderExamCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    backgroundColor: '#F87F16',
    elevation: 4,
  },
  header: {
    height: moderateScale(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: 'white',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Poppins-Medium',
    fontSize: moderateScale(14),
  },
  activeTabText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: moderateScale(18),
    fontFamily: 'Poppins-Bold',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  examName: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
  },
  universityName: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: moderateScale(10),
    fontFamily: 'Poppins-Medium',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins-Medium',
    color: '#1A3848',
    marginLeft: 6,
  },
  scoreContainer: {
    marginBottom: 15,
  },
  scoreInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  scoreValue: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Bold',
    color: '#2E7D32',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F87F16',
  },
  startButton: {
    backgroundColor: '#1A3848',
    borderRadius: 10,
    height: 45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Bold',
    marginRight: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  emptyText: {
    marginTop: 15,
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-Medium',
    color: '#999',
    textAlign: 'center',
  },
});

export default UniversityExams;
