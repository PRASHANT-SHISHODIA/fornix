import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../API/axiosConfig';

const { width } = Dimensions.get('window');
const scale = size => (width / 375) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const UniversityExamResults = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const { examId, examName } = route.params || {};

  useEffect(() => {
    fetchResultDetails();
  }, []);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('user_id');

      console.log('Fetching result details for User:', userId, 'Exam:', examId);

      const response = await API.post(
        '/university-exams/history',
        {
          user_id: userId,
          exam_id: examId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('RESULT DETAILS API RESPONSE:', JSON.stringify(response.data.data, null, 2));

      if (response.data?.success) {
        // Normalize the response: handle cases where data is at root or inside a 'data' key
        const resultPayload = response.data.attempt ? response.data : (response.data.data || response.data);
        setData(resultPayload);
      }
    } catch (error) {
      console.log('Error fetching result details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F87F16" />
        <Text style={styles.loadingText}>Loading {examName ? `${examName} Results` : 'Results'}...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Icon name="exclamation-circle" size={50} color="#DDD" />
        <Text style={styles.emptyText}>No Result Details Found</Text>
        <Text style={{ color: '#999', marginTop: 5 }}>Exam ID: {examId}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonAction}>
          <Text style={{ color: '#fff' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract the main object from either a flat response, nested data, or array
  const resultPayload = Array.isArray(data) ? data[0] : (data.data && Array.isArray(data.data) ? data.data[0] : data);

  // Try to find the attempt info: either in .attempt, or the object itself if it has score/id
  const attempt = resultPayload.attempt || resultPayload;
  const questions_review = resultPayload.questions_review || resultPayload.review || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon1 name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{attempt.exam_name} Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>{attempt.score}/{attempt.total_marks}</Text>

          {/* Defensive stats handling */}
          {(() => {
            const stats = attempt.stats || {
              correct: attempt.score || 0,
              incorrect: Math.max(0, (attempt.total_marks || 0) - (attempt.score || 0)),
              skipped: 0
            };

            return (
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#2E7D32' }]}>{stats.correct}</Text>
                  <Text style={styles.statLabel}>Correct</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#D32F2F' }]}>{stats.incorrect}</Text>
                  <Text style={styles.statLabel}>Incorrect</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#666' }]}>{stats.skipped || 0}</Text>
                  <Text style={styles.statLabel}>Skipped</Text>
                </View>
              </View>
            );
          })()}
        </View>

        <Text style={styles.sectionTitle}>Question Review</Text>

        {questions_review.map((item, index) => (
          <View key={item.id || index.toString()} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNum}>Question {index + 1}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.is_correct ? '#E8F5E9' : '#FFEBEE' }]}>
                <Text style={[styles.statusText, { color: item.is_correct ? '#2E7D32' : '#D32F2F' }]}>
                  {item.is_correct ? 'Correct' : 'Incorrect'}
                </Text>
              </View>
            </View>

            <Text style={styles.questionText}>{item.question}</Text>

            <View style={styles.optionsList}>
              {['a', 'b', 'c', 'd'].map((letter) => {
                const optionKey = `option_${letter}`;
                const optionText = item[optionKey];
                if (!optionText) return null;

                const isSelected = item.student_answer === letter;
                const isCorrect = item.correct_option === letter;

                return (
                  <View
                    key={letter}
                    style={[
                      styles.optionItem,
                      isSelected && (item.is_correct ? styles.correctSelected : styles.wrongSelected),
                      isCorrect && !item.is_correct && styles.correctBorder
                    ]}
                  >
                    <Text style={[styles.optionLetter, (isSelected || isCorrect) && { fontWeight: 'bold' }]}>
                      {letter.toUpperCase()}.
                    </Text>
                    <Text style={styles.optionContent}>{optionText}</Text>
                    {isCorrect && <Icon name="check-circle" size={16} color="#2E7D32" />}
                    {isSelected && !is_correct && <Icon name="times-circle" size={16} color="#D32F2F" />}
                  </View>
                );
              })}
            </View>

            {item.explanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationTitle}>Explanation:</Text>
                <Text style={styles.explanationText}>{item.explanation}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#F87F16',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'Poppins-Bold' },
  scrollContent: { padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  scoreLabel: { fontSize: 16, color: '#666', fontFamily: 'Poppins-Medium' },
  scoreValue: { fontSize: 36, color: '#1A3848', fontFamily: 'Poppins-Bold', marginVertical: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 18, fontFamily: 'Poppins-Bold' },
  statLabel: { fontSize: 12, color: '#999', fontFamily: 'Poppins-Regular' },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#1A3848', marginBottom: 15 },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  questionNum: { fontSize: 14, color: '#F87F16', fontFamily: 'Poppins-SemiBold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontFamily: 'Poppins-Medium' },
  questionText: { fontSize: 15, color: '#1A3848', fontFamily: 'Poppins-Medium', marginBottom: 15 },
  optionsList: { marginBottom: 10 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 8,
  },
  optionLetter: { marginRight: 10, fontSize: 14, color: '#666' },
  optionContent: { flex: 1, fontSize: 14, color: '#444' },
  correctSelected: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  wrongSelected: { backgroundColor: '#FFEBEE', borderColor: '#D32F2F' },
  correctBorder: { borderColor: '#2E7D32', borderWidth: 1.5 },
  explanationBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F87F16',
  },
  explanationTitle: { fontSize: 13, fontFamily: 'Poppins-Bold', color: '#1A3848', marginBottom: 4 },
  explanationText: { fontSize: 13, color: '#666', lineHeight: 18 },
  backButtonAction: { marginTop: 20, padding: 12, backgroundColor: '#1A3848', borderRadius: 8 },
  loadingText: { marginTop: 10, color: '#666' },
});

export default UniversityExamResults;
