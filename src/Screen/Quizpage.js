import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API from '../API/axiosConfig';
import MockTest from './MockTest';
import Icon1 from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

/* ---------- Responsive Helpers ---------- */
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;

const responsiveFontSize = size => {
  const scaleFactor = width / 375;
  return size * scaleFactor;
};

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

const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

/* ---------- BASE API ---------- */
const START_TEST_API =
  'https://fornix-medical.vercel.app/api/v1/mobile/mock-tests';

/* ===================================================== */
const Quizpage = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  /* ---------- Route Params (Mood Screen) ---------- */
  const { mode, testId, examId } = route.params || {};

  /* ---------- States ---------- */
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // {0:'a',1:'b'}
  const [testName, setTestName] = useState('');

  const [timeLeft, setTimeLeft] = useState(60);

  const timerRef = useRef(null);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  /* ---------- Fetch User ID + Start Test ---------- */
  useEffect(() => {
    initTest();
  }, []);

  const initTest = async () => {
    try {
      setLoading(true);

      // ✅ PRE-FILLED QUESTIONS (e.g., University Exams)
      if (route.params?.questions && route.params?.questions.length > 0) {
        setQuestions(route.params.questions);
        setAttemptId(route.params.attemptId || null);
        setLoading(false);
        return;
      }

      const userId = await AsyncStorage.getItem('user_id');
      const token = await AsyncStorage.getItem('token');

      console.log('� MODE:', mode);
      console.log('👤 USER ID:', userId);

      const idToUse = mode === 'university_exam' ? examId : testId;

      if (!userId || !idToUse) {
        console.log('❌ Missing IDs:', { userId, testId, examId, mode });
        Alert.alert('Error', `Required ID missing (${mode === 'university_exam' ? 'Exam ID' : 'Test ID'})`);
        setLoading(false);
        return;
      }

      let res;
      if (mode === 'university_exam') {
        console.log('🎓 Starting University Exam:', examId);
        res = await API.post(
          '/university-exams/details',
          {
            user_id: userId,
            exam_id: examId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        console.log('🧪 Starting Mock Test:', testId);
        // Using centralized API for Mock Test as well
        res = await API.post(
          `/mobile/mock-tests/${testId}/start`,
          {
            user_id: userId,
            mode: 'practice', // Default mode for mock tests
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }

      console.log('📦 START RESPONSE:', res.data);

      if (res.data?.success) {
        if (mode === 'university_exam') {
          setAttemptId(res.data.attempt_id);
          setQuestions(res.data.questions || []);
          setTestName(res.data.exam?.name || 'University Exam');
        } else {
          setAttemptId(res.data.attempt?.id);
          setQuestions(res.data.questions || []);
          setTestName(res.data.test?.title || 'Mock Test');
        }
      } else {
        Alert.alert('Error', res.data?.message || 'Unable to load test questions');
      }
    } catch (err) {
      console.log('❌ INIT TEST ERROR:', err?.response?.data || err);
      Alert.alert('Error', err?.response?.data?.message || 'Something went wrong while starting the test');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Timer ---------- */

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
        setTotalTimeTaken(prev => prev + 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);


  const formatTime = seconds => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  /* ---------- Option Select ---------- */
  const handleOptionSelect = key => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: key,
    }));

    Animated.spring(progressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const selectedOption = answers[currentIndex] || null;

  /* ---------- Navigation ---------- */
  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(60);
      progressAnim.setValue(0);
    } else {
      handleSubmit();
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setTimeLeft(60);
      progressAnim.setValue(0);
    }
  };
  const buildSubmitPayload = () => {
    return Object.keys(answers).map(index => ({
      question_id: questions[index]?.id,
      selected_option: answers[index],
    }))
  }

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const userId = await AsyncStorage.getItem('user_id');
      const token = await AsyncStorage.getItem('token');

      if (!userId) {
        Alert.alert("Error", "User Not Found");
        return;
      }

      let endpoint = '';
      let payload = {};

      if (mode === 'university_exam') {
        // ✅ NEW FLOW FOR UNIVERSITY EXAMS
        endpoint = '/university-exams/attempt';

        // Format answers as { "question_id": "selected_option" }
        const universityAnswers = {};
        Object.keys(answers).forEach(index => {
          const qId = questions[index]?.id;
          if (qId) {
            universityAnswers[qId] = answers[index];
          }
        });

        payload = {
          user_id: userId,
          exam_id: examId,
          answers: universityAnswers,
        };
      } else {
        // ✅ EXISTING FLOW FOR MOCK TESTS
        endpoint = `/mobile/mock-tests/${testId}/submit`;
        payload = {
          user_id: userId,
          attempt_id: attemptId,
          answers: buildSubmitPayload(),
          time_taken_seconds: totalTimeTaken,
        };
      }

      console.log('Submit Endpoint:', endpoint);
      console.log('Submit Payload:', JSON.stringify(payload, null, 2));

      const res = await API.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('SUBMIT RESPONSE:', res.data);

      if (res.data?.success) {
        // Support both nested and flat response structures
        let resultData = res.data.result || res.data.data || res.data.submission || res.data;

        // If it's a university exam without percentage, calculate it
        if (mode === 'university_exam' && resultData.score !== undefined && !resultData.percentage) {
          resultData.total_questions = resultData.total_marks || questions.length;
          resultData.correct_answers = resultData.score;
          resultData.percentage = ((resultData.score / (resultData.total_questions || 1)) * 100).toFixed(1);
        }

        navigation.navigate('MockTestResults', {
          source: mode === 'university_exam' ? 'university' : 'mocktest',
          result: resultData,
          questions: questions,
        });
      } else {
        Alert.alert('Error', res.data?.message || "Submission failed");
      }
    } catch (error) {
      console.log("SUBMIT ERROR:", error?.response?.data || error);
      const errorMsg = error?.response?.data?.message || 'Something went wrong while Submitting';
      Alert.alert("Error", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Loading / Submitting States ---------- */
  if (loading || submitting) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar backgroundColor="#F87F16" barStyle="light-content" />
        <ActivityIndicator size="large" color="#F87F16" />
        <Text style={styles.loaderText}>
          {submitting ? 'Submitting your results...' : 'Loading mock test...'}
        </Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#F5F5F5' }]}>
        <StatusBar backgroundColor="#F87F16" barStyle="light-content" />

        {/* 🔹 Header */}
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
              <Text style={styles.headerTitle} numberOfLines={1}>
                {mode === 'university_exam' ? 'University Exam' : 'Mock Test'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: responsiveFontSize(18), fontFamily: 'Poppins-SemiBold', color: '#000', textAlign: 'center' }}>
            No questions available for this {mode === 'university_exam' ? 'Exam' : 'Mock'}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1A3848', borderRadius: 8 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#F87F16" barStyle="dark-content" />

      {/* 🔹 Header added for consistency */}
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {testName || (mode === 'university_exam' ? 'University Exam' : 'Mock Test')}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { marginTop: -verticalScale(30), paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {questions.length}
        </Text>

        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

        <Text style={styles.questionText}>
          {currentIndex + 1}. {currentQuestion?.text || currentQuestion?.question || 'No question text'}
        </Text>

        {currentQuestion?.image_url && (
          <Image
            source={{ uri: currentQuestion.image_url }}
            style={styles.questionImage}
            resizeMode="contain"
          />
        )}

        {(currentQuestion?.options || [
          { key: 'a', content: currentQuestion?.option_a },
          { key: 'b', content: currentQuestion?.option_b },
          { key: 'c', content: currentQuestion?.option_c },
          { key: 'd', content: currentQuestion?.option_d },
        ].filter(opt => opt.content)).map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              selectedOption === option.key && styles.optionSelected,
            ]}
            onPress={() => handleOptionSelect(option.key)}>

            <View style={styles.optionContent}>
              <View
                style={[
                  styles.optionCircle,
                  selectedOption === option.key &&
                  styles.optionCircleSelected,
                ]}>
                <Text
                  style={[
                    styles.optionId,
                    selectedOption === option.key &&
                    styles.optionIdSelected,
                  ]}>
                  {option.key.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.optionText}>{option.content}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.navButton} onPress={goPrevious}>
            <Text style={styles.navButtonTextp}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={goNext}>
            <Text style={styles.navButtonText}>
              {currentIndex === questions.length - 1 ? 'Submit' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
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
  headerTitle: {
    fontSize: moderateScale(getResponsiveSize(24)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginBottom: verticalScale(getResponsiveSize(25)),
    includeFontPadding: false,
  },
  scrollContent: { padding: scale(20), paddingBottom: verticalScale(30) },
  progressText: {
    color: '#000',
    textAlign: 'center',
    fontSize: responsiveFontSize(14),
    marginBottom: verticalScale(10),
  },
  timerText: {
    color: '#000',
    textAlign: 'center',
    fontSize: responsiveFontSize(30),
    marginBottom: verticalScale(20),
    fontFamily: 'Poppins-Bold',
  },
  questionText: {
    color: '#000',
    fontSize: responsiveFontSize(18),
    marginBottom: verticalScale(20),
    fontFamily: 'Poppins-SemiBold',
  },
  questionImage: {
    width: '100%',
    height: verticalScale(200),
    marginBottom: verticalScale(20),
    borderRadius: 10,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    padding: scale(15),
    marginBottom: verticalScale(12),
  },
  optionSelected: {
    backgroundColor: '#1A3848',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionCircleSelected: {
    backgroundColor: '#000',
  },
  optionId: {
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
  },
  optionIdSelected: {
    color: '#1A3848',
  },
  optionText: {
    flex: 1,
    color: '#000',
    fontSize: responsiveFontSize(15),
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(20),
  },
  navButton: {
    flex: 0.48,
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: verticalScale(14),
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#1A3848',
    borderColor: '#1A3848',
  },
  navButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
  navButtonTextp: {
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    color: '#1A3848',
    fontFamily: 'Poppins-Medium',
  },
});

export default Quizpage;
