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

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('user_id');
      console.log('Fetching exams for ID:', userId);

      const response = await API.post(
        '/university-exams/list',
        { user_id: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Full API Response:', response.data);

      if (response.data?.success) {
        setExams(response.data.data || []);
      }
    } catch (error) {
      console.log('Error fetching university exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderExamCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Icon name="university" size={20} color="#F87F16" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.examName}>{item.name}</Text>
          <Text style={styles.universityName}>{item.university_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.is_attempted ? '#E8F5E9' : '#FFF3E0' }]}>
          <Text style={[styles.statusText, { color: item.is_attempted ? '#2E7D32' : '#E65100' }]}>
            {item.is_attempted ? 'Attempted' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Icon name="graduation-cap" size={14} color="#1A3848" />
          <Text style={styles.detailText}>{item.academic_year}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="clock" size={14} color="#1A3848" />
          <Text style={styles.detailText}>{item.duration_minutes} mins</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="book" size={14} color="#1A3848" />
          <Text style={styles.detailText}>{item.subjects}</Text>
        </View>
      </View>

      {item.is_attempted && (
        <View style={styles.scoreContainer}>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Score:</Text>
            <Text style={styles.scoreValue}>{item.attempt_score}/{item.attempt_total_marks}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(item.attempt_score / item.attempt_total_marks) * 100}%` }
              ]}
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.startButton}
        activeOpacity={0.8}
        onPress={() => handleStartExam(item.id)}
      >
        <Text style={styles.startButtonText}>
          {item.is_attempted ? 'Retake Exam' : 'Start Exam'}
        </Text>
        <Icon1 name="arrow-forward" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );

  const handleStartExam = async (examId) => {
    try {
      console.log('--- START EXAM FLOW ---');
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
      console.log('--- END EXAM FLOW ---');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} backgroundColor="#F5F5F5" />

      {/* Header */}
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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F87F16" />
          <Text style={styles.loadingText}>Fetching Exams...</Text>
        </View>
      ) : exams.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="clipboard-list" size={60} color="#DDD" />
          <Text style={styles.emptyText}>No University Exams Available</Text>
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={item => item.id}
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
  header: {
    backgroundColor: '#F87F16',
    height: moderateScale(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
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
