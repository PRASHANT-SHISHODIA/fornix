// Fornixqbank2.js
import React, { useState, useEffect, useRef, use, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Alert,
  BackHandler,
  Image,
  Animated,
  ActivityIndicator,
  Modal, TextInput
} from 'react-native';
// import { SelectableText } from '@rob117/react-native-selectable-text';
// import { useQuizStore } from '../API/store/useQuizStore';
import useQuizStore from '../store/useQuizStore';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/AntDesign';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Tts from 'react-native-tts';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { set } from 'react-hook-form';
import API from '../API/axiosConfig';

// Screen dimensions
const { width, height } = Dimensions.get('window');

// 🔹 Responsive scaling
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// 🔹 Responsive size function based on screen width
const getResponsiveSize = size => {
  if (width < 375) {
    // Small phones
    return size * 0.85;
  } else if (width > 414) {
    // Large phones
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

//* -------------------- MAIN COMPONENT -------------------- */
const HighlightableText = ({ text, style, highlights, onSelectionChange }) => {
  if (!text) return null;

  // Merge overlapping or touch highlights
  let merged = [];
  if (highlights && highlights.length > 0) {
    const sorted = [...highlights].sort((a, b) => a.start - b.start);
    for (const h of sorted) {
      if (merged.length === 0) {
        merged.push({ ...h });
      } else {
        const last = merged[merged.length - 1];
        if (h.start <= last.end) {
          last.end = Math.max(last.end, h.end);
        } else {
          merged.push({ ...h });
        }
      }
    }
  }

  const chunks = [];
  let lastIndex = 0;
  merged.forEach(h => {
    if (h.start > lastIndex) {
      chunks.push({ text: text.substring(lastIndex, h.start), isHighlight: false });
    }
    chunks.push({ text: text.substring(Math.max(lastIndex, h.start), h.end), isHighlight: true });
    lastIndex = h.end;
  });
  if (lastIndex < text.length) {
    chunks.push({ text: text.substring(lastIndex), isHighlight: false });
  }

  return (
    <TextInput
      multiline={true}
      // CRITICAL: editable must be true on Android to fire onSelectionChange reliably
      editable={true}
      // But we prevent the keyboard from popping up
      showSoftInputOnFocus={false}
      selectable={true}
      contextMenuHidden={true}
      caretHidden={true}
      onSelectionChange={onSelectionChange}
      // Prevent actual text changes since editable=true
      onChangeText={() => { }}
      style={[style, { padding: 0, margin: 0, color: style?.color || '#1A3848' }]}
    >
      {chunks.map((chunk, i) => (
        <Text key={i} style={chunk.isHighlight ? { backgroundColor: 'yellow', color: '#000' } : {}}>
          {chunk.text}
        </Text>
      ))}
    </TextInput>
  );
};

const Fornixqbank2 = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { mode, testId, topicId, topicName, mood, chapterId, ChapterName, subjectId, Course, selectedChapterIds } = route.params || {};
  const Difficult = mood?.title ?? null



  const getQuestionTypeFromMood = (moodTitle) => {
    switch (moodTitle) {
      case 'Funny / Easy':
        return 'easy';
      case 'Moderate':
        return 'medium';
      case 'Competitive':
        return `difficult`;
      case 'Difficult':
        return 'difficult';
      default:
        return 'easy';
    }
  };


  // 🔹 State variables
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPrevPressed, setIsPrevPressed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [pulseAnim, setPulseAnim] = useState(new Animated.Value(1));
  const hasAnsweredCurrent = useRef(false);
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = isLastQuestion && hasAnsweredCurrent.current;
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [userId, setUserId] = useState(null);
  const [attempted, setAttemptId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submitProgress = useRef(new Animated.Value(0)).current;
  // Track native selection ranges by question ID
  const [highlightData, setHighlightData] = useState({});
  const [currentSelection, setCurrentSelection] = useState(null);

  const handleSelectionChange = useCallback((event) => {
    const { start, end } = event.nativeEvent.selection;
    if (start !== end) {
      setCurrentSelection({ start: Math.min(start, end), end: Math.max(start, end) });
    } else {
      setCurrentSelection(null);
    }
  }, []);

  const applyHighlight = () => {
    if (currentSelection && currentQuestion?.id) {
      setHighlightData(prev => {
        const id = currentQuestion.id;
        const existing = prev[id] || [];
        return {
          ...prev,
          [id]: [...existing, currentSelection]
        };
      });
    }
  };

  const removeHighlight = () => {
    if (currentQuestion?.id) {
      if (currentSelection) {
        setHighlightData(prev => {
          const id = currentQuestion.id;
          const existing = prev[id] || [];
          // If current selection overlaps a highlight, remove it
          const filtered = existing.filter(h =>
            !(Math.max(h.start, currentSelection.start) < Math.min(h.end, currentSelection.end))
          );
          return { ...prev, [id]: filtered };
        });
      } else {
        // Clear all if no selection
        setHighlightData(prev => ({ ...prev, [currentQuestion.id]: [] }));
      }
    }
  };
  const saveAnswer = useQuizStore((state) => state.saveAnswer);
  const getAnswer = useQuizStore((state) => state.getAnswer);
  // const route = useRoute()
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [submitPercent, setSubmitPercent] = useState(0);
  const [openTracker, setOpenTracker] = useState(false)



  // Track if user has answered current question
  const currentQuestion = questions[currentIndex];

  // 🔹 Animated loader
  useEffect(() => {
    let animation;
    if (loading) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    }

    return () => animation?.stop();
  }, [loading]);



  // 🔹 Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBackPress,
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    hasAnsweredCurrent.current = false;
    setSelectedOption(null);
    setShowExplanation(false);
  }, [currentIndex]);


  const getAttemptedCount = () => {

    return userAnswers.length;
  };


  const getSkippedCount = () => {
    return questions.length - userAnswers.length;
  };


  const handleSaveLastQuestion = () => {
    const currentQuestion = questions[currentIndex];

    // save last answer
    saveAnswer(currentQuestion.id, selectedOption);

    setIsSaved(true);
    setShowSummaryModal(true);
  };


  const callSubjectQuizApi = async () => {
    if (!userId || !subjectId || !mood) {
      console.log('❌ Missing data for subject quiz');
      return;
    }

    try {
      setLoading(true);
      const questionType = getQuestionTypeFromMood(mood.title);
      const chapterCount = selectedChapterIds?.length || 0;
      const isAMC = route.params?.isAMC;

      let endpoint = '/subject-quiz/start';
      let body = {
        user_id: userId,
        subject_id: subjectId,
        question_type: questionType,
        limit: 20,
        chapter_ids: selectedChapterIds || [],
      };

      // 🔹 AMC Course specific logic
      if (isAMC) {
        if (chapterCount === 1) {
          endpoint = '/amc/chapter-quiz';
          body = {
            user_id: userId,
            chapter_id: selectedChapterIds[0],
            limit: 20,
            question_type: questionType,
          };
        } else if (chapterCount > 1) {
          endpoint = '/amc/multi-chapter-quiz';
          body = {
            user_id: userId,
            chapter_ids: selectedChapterIds,
            limit: 20,
            question_type: questionType,
          };
        }
      }

      console.log(`📤 ${endpoint.toUpperCase()} BODY:`, body);

      const response = await API.post(endpoint, body);

      if (response?.data?.success) {
        setQuestions(response.data.data || []);
        setAttemptId(response.data.attempt_id);
        setCurrentIndex(0);

        console.log(`✅ QUIZ LOADED FROM ${endpoint}`);
        console.log('ATTEMPT:', response.data.attempt_id);
      } else {
        Alert.alert('Error', 'Subject quiz failed');
      }
    } catch (error) {
      console.log(
        '❌ SUBJECT QUIZ ERROR:',
        error?.response?.data || error.message
      );
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };


  // 🔹 API Calls
  const callDirectQuizApi = async () => {
    try {
      setLoading(true);
      const body = {
        user_id: userId,
        chapter_id: chapterId,
        limit: 20,
      };
      const response = await API.post(
        '/quiz/start',
        body,
      );
      if (response.data.success) {
        setQuestions(response?.data?.data);
        setAttemptId(response?.data?.attempt_id);
        setCurrentIndex(0)
        console.log('Quiz data :', response?.data?.data);
        console.log("ATTEMPT ID :", response?.data?.attempt_id)
      }
    } catch (error) {
      console.log("QUIZ ERROR ", error.response?.data || error.message)
      Alert.alert('Error', 'Direct Quiz Is Not responding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('user_id');
      setUserId(storedUserId);
    };

    getUserId();
  }, []);


  const callTopicQuizApi = async () => {

    if (!userId || !topicId) {
      console.log("Missing userId or topicId, skipping API");
      return;
    }
    try {
      setLoading(true);
      const body = {
        user_id: userId,
        topic_ids: Array.isArray(topicId) ? topicId : [topicId],
        limit: 25,
      };

      console.log("TOPIC BODY:", body);
      const response = await API.post(
        '/quiz/start',
        body,
      );
      if (response?.data?.success) {
        setQuestions(response.data.data);
        setAttemptId(response?.data?.attempt_id)
        setCurrentIndex(0);
        console.log('TOPIC QUIZ DATA', response.data.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Topic quiz Api failed');
      console.log(error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {


    // ✅ SUBJECT (AMC) FLOW
    if (mood && subjectId) {
      callSubjectQuizApi();
      return;
    }

    // ✅ TOPIC FLOW
    if (mode === 'topic' && topicId) {
      callTopicQuizApi();
      return;
    }

    // ✅ DIRECT FLOW
    if (mode === 'DIRECT') {
      callDirectQuizApi();
    }

  }, [mood, subjectId, mode, topicId, userId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`
  };


  useEffect(() => {
    if (!questions.length) return;

    if (questions.length > 0 && !quizStartTime) {
      setQuizStartTime(Date.now());
    }

    // ⏱ 1 question = 1 minute
    const totalSeconds = questions.length * 60;
    setTimeLeft(totalSeconds);

    // Clear old timer if any
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (submitting) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        return;
      }
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          onTimeFinished(); // 🔥 AUTO SUBMIT
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [questions]);


  const onTimeFinished = () => {
    Alert.alert(
      'Time Finished ⏰',
      'Your time is finished. Your quiz will be submitted automatically.',
      [
        {
          text: 'OK',
          onPress: () => {
            SubmitQuiz(); // 🔥 Auto submit
          },
        },
      ],
      { cancelable: false }
    );
  };


  const handleHardwareBackPress = () => {
    stopTTS();
    navigation.replace('Topicwise');
    return true;
  };

  const stopTTS = async () => {
    try {
      await Tts.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.log('TTS Stop Error:', error);
    }
  };

  const handleOptionSelect = optionId => {
    if (hasAnsweredCurrent.current) return; // Prevent multiple answers

    setSelectedOption(optionId);
    setShowExplanation(true);
    hasAnsweredCurrent.current = true;

    // Track user answer
    const isCorrect = currentQuestion.correct_answer && optionId === currentQuestion.correct_answer;
    const answerRecord = {
      questionId: currentQuestion.id,
      question: currentQuestion.question_text,
      selected: optionId,
      correct: currentQuestion.correct_answer,
      isCorrect: isCorrect,
    };

    setUserAnswers(prev => [...prev, answerRecord]);


    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };


  const getSavedAnswer = (questionId) => {
    return userAnswers.find(a => a.questionId === questionId);
  }

  const handlePrevious = () => {
    stopTTS();
    if (currentIndex === 0) return
    const prevIndex = currentIndex - 1;
    const prevQuestion = questions[prevIndex];

    const savedAnswer = getSavedAnswer(prevQuestion.id)

    setCurrentIndex(prevIndex);

    if (savedAnswer) {
      setSelectedOption(savedAnswer.selected);
      setShowExplanation(true);
      hasAnsweredCurrent.current = true;
    } else {
      setSelectedOption(null);
      setShowExplanation(false);
      hasAnsweredCurrent.current = false;
    }
  };

  const getTimeTakenInSeconds = () => {
    if (!quizStartTime) return 0;
    const endTime = Date.now();
    return Math.floor((endTime - quizStartTime) / 1000);
  };

  const buildSubmitPayload = () => {
    const { answers } = useQuizStore.getState();
    console.log("ANSWER", answers)
    return {
      user_id: userId,
      attempt_id: attempted,
      time_taken_seconds: getTimeTakenInSeconds(),
      answers: answers,
    };
  };

  const startSubmitProgress = () => {
    submitProgress.setValue(0);
    setSubmitPercent(0);

    submitProgress.addListener(({ value }) => {
      const percent = Math.round(value * 100);
      setSubmitPercent(percent); // ❌ triggers render ~60 times/sec
    });

    Animated.timing(submitProgress, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start(() => {
      submitProgress.removeAllListeners();
    });
  };



  const submitAMCQuiz = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSubmitting(true);
      startSubmitProgress();
      const answers = userAnswers.map(ans => ({
        question_id: ans.questionId,
        selected_option: ans.selected,
      }));
      const payload = {
        user_id: userId,
        attempt_id: attempted,
        subject_id: subjectId,
        question_type: getQuestionTypeFromMood(mood.title),
        time_taken_seconds: getTimeTakenInSeconds(),
        answers: answers,
      };
      console.log('Amc Submit Payload:', JSON.stringify(payload, null, 2));
      const response = await API.post("/subject-quiz/submit",
        payload
      );
      console.log("AMC SUBMIT RESPONSE", response);
      if (response?.data?.success) {
        setTimeout(() => {
          setSubmitting(false);
          handleSubmitSuccess(response?.data);
        }, 1800);
      } else {
        setSubmitting(false);
        Alert.alert("Error", "AMC Submission failed");
      }
    } catch (error) {
      console.log("AMC SUBMIT ERROR :", error?.response?.data || error.message);
      Alert.alert("Error", "AMC Quiz Submit Failed");
      setSubmitting(false);
    }
  }

  const SubmitQuiz = async () => {
    const { isAMC = false } = route.params || {};
    if (isAMC) {
      await submitAMCQuiz();
      return;
    }

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSubmitting(true);
      startSubmitProgress();
      const payload = buildSubmitPayload();

      const response = await API.post('/quiz/submit', payload);

      if (response?.data?.success) {
        setTimeout(() => {
          setSubmitting(false);
          handleSubmitSuccess(response?.data);
        }, 1800);
        console.log('SUBMIT DATA', response?.data);
      } else {
        setSubmitting(false);
        Alert.alert("Error", "Submission failed");
      }
    } catch (error) {
      console.log("SUBMIT ERROR :", error?.response?.data || error.message);
      Alert.alert("Error", "Quiz Submit Failed");
      setSubmitting(false);
    }
  };

  const handleSubmitSuccess = (data) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    navigation.navigate('Results', {
      resultData: data,
      userAnswers: userAnswers,
      questions: questions,
      timeTaken: getTimeTakenInSeconds(),
      outOf: '',
      attemptedId: data?.attempt_id,
      userId: userId,
    })
  }

  const handleBackButton = () => {
    stopTTS();
    navigation.goBack();
  };


  const handleNext = () => {
    // if (!hasAnsweredCurrent.current) {
    //   Alert.alert('Answer Required', 'Please select an answer');
    //   return;
    // }

    const currentQuestion = questions[currentIndex];

    // 🔹 SAVE CURRENT ANSWER
    saveAnswer(currentQuestion.id, selectedOption);

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextQuestion = questions[nextIndex];
      const savedAnswer = getAnswer(nextQuestion.id);

      setCurrentIndex(nextIndex);

      if (savedAnswer) {
        setSelectedOption(savedAnswer.selected_key);
        setShowExplanation(true);
        hasAnsweredCurrent.current = true;
      } else {
        setSelectedOption(null);
        setShowExplanation(false);
        hasAnsweredCurrent.current = false;
      }

      stopTTS();
    } else {
      SubmitQuiz();
    }
  };

  // 🔹 Custom Loader Component
  const CustomLoader = () => {
    const [scaleAnim] = useState(new Animated.Value(1));
    const [rippleAnim] = useState(new Animated.Value(0)); // Ripple scale
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      // Pulse animation for the brain icon
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );

      // Ripple animation
      const ripple = Animated.loop(
        Animated.parallel([
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      );

      pulse.start();
      ripple.start();

      // Progress simulation
      const interval = setInterval(() => {
        setProgress(oldProgress => {
          if (oldProgress >= 90) return oldProgress;
          let increment = 0;
          if (oldProgress < 30) increment = Math.floor(Math.random() * 5) + 2;
          else if (oldProgress < 70) increment = Math.floor(Math.random() * 3) + 1;
          else increment = 1;

          const newProgress = oldProgress + increment;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      return () => {
        clearInterval(interval);
        pulse.stop();
        ripple.stop();
      };
    }, []);

    const rippleScale = rippleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 2],
    });

    const rippleOpacity = rippleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 0],
    });

    return (
      <View style={styles.loaderContainer}>
        <LinearGradient
          colors={['#F87F16', '#FF9800']}
          style={styles.loaderHeader}>
          <View style={styles.loaderHeaderContent}>
            <TouchableOpacity
              style={styles.loaderBackButton}
              onPress={() => navigation.goBack()}>
              <Icon1 name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.loaderTitle}>Loading Quiz</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={styles.loaderContent}>
          <View style={styles.loaderIconContainer}>
            {/* Ripple Effect */}
            <Animated.View
              style={[
                styles.loaderIconCircle,
                {
                  position: 'absolute',
                  backgroundColor: '#FF9800', // Lighter orange for ripple
                  opacity: rippleOpacity,
                  transform: [{ scale: rippleScale }],
                  zIndex: -1,
                },
              ]}
            />

            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
              <LinearGradient
                colors={['#F87F16', '#FF9800']}
                style={styles.loaderIconCircle}>
                <Icon name="brain" size={moderateScale(40)} color="white" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Text style={styles.loaderMainText}>Preparing Your Medical Quiz</Text>
          <Text style={styles.loaderSubText}>
            Fetching questions from server... {progress}%
          </Text>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.loaderprogessbar,
                { width: `${progress}%`, marginTop: 0, height: '100%', borderRadius: moderateScale(3) }
              ]}
            />
          </View>
          <Text style={{ color: '#F87F16', fontFamily: 'Poppins-Bold', marginTop: verticalScale(10) }}>{progress}% Completed</Text>
        </View>
      </View>
    );
  };


  // Main render logic
  if (loading) {
    return <CustomLoader />;
  }

  if (!questions.length || !questions[currentIndex]) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation-triangle" size={50} color="#F87F16" />
        <Text style={styles.errorText}>No Questions Found</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />

      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            width: '85%',
            borderRadius: 12,
            padding: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#1A3848',
              marginBottom: 15
            }}>
              Quiz Summary
            </Text>

            <Text style={{ fontSize: 15, marginBottom: 8 }}>
              ✅ Attempted: {getAttemptedCount()}
            </Text>

            <Text style={{ fontSize: 15, marginBottom: 20 }}>
              ⏭ Skipped: {getSkippedCount()}
            </Text>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  backgroundColor: '#1A3848',
                  borderRadius: 8
                }}
                onPress={() => {
                  setShowSummaryModal(false)
                  setOpenTracker(true);
                }}
              >
                <Text style={{ color: '#fff' }}>Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  backgroundColor: '#4CAF50',
                  borderRadius: 8
                }}
                onPress={() => {
                  setShowSummaryModal(false);
                  SubmitQuiz();
                }}
              >
                <Text style={{ color: '#fff' }}>Final Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* 🔹 Submit Progress Overlay */}
      {submitting && (
        <View style={styles.submitOverlay}>
          <Text style={styles.submitTitle}>Submitting Result</Text>

          <View style={styles.submitBarContainer}>
            <Animated.View
              style={[
                styles.submitBarFill,
                {
                  width: submitProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.submitSubText}>
            {submitPercent}% completed
          </Text>
        </View>
      )}

      {openTracker && (
        <View style={styles.trackerContainer}>
          {questions?.map((question, index) => (
            <TouchableOpacity style={{
              ...styles.questionContain,
              backgroundColor: index === currentIndex ? '#F87F16' : (getAnswer(question.id)?.selected_key ? '#4CAF50' : '#E0E0E0')
            }} onPress={() => {
              setCurrentIndex(index);
              setOpenTracker(false)
            }} key={index}>
              <Text style={styles.questionNumber}>{index + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 🔹 Header */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={handleBackButton}
                style={styles.backButton}>
                <Icon1
                  name="arrow-back"
                  size={moderateScale(getResponsiveSize(28))}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <Text style={styles.title}>{ChapterName}</Text>
            </View>
            <Text style={styles.sectionTitle1}>Fornix Q Bank</Text>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <Text style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: timeLeft <= 60 ? '#FF5252' : '#FFFFFF',
                textAlign: 'center',
                marginTop: -20,
              }}>
                ⏱ Time Left: {formatTime(timeLeft)}
              </Text>
              <Text style={styles.progressText}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
            </View>
          </View>
        </View>

        {/* tracker */}
        <TouchableOpacity onPress={() => setOpenTracker(!openTracker)} style={styles.trackerButton}>
          <Text>+</Text>
        </TouchableOpacity>
        {/* 🔹 Question Container */}
        <View style={styles.questionContainer}>
          {/* Highlighting Tools */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 }}>
            <TouchableOpacity onPress={applyHighlight} style={{ marginRight: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FFF9C4', borderRadius: 6, borderWidth: 1, borderColor: '#FBC02D' }}>
              <Text style={{ color: '#F57F17', fontWeight: 'bold', fontSize: 13 }}>Highlight</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={removeHighlight} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FFEBEE', borderRadius: 6, borderWidth: 1, borderColor: '#D32F2F' }}>
              <Text style={{ color: '#C62828', fontWeight: 'bold', fontSize: 13 }}>Remove</Text>
            </TouchableOpacity>
          </View>

          {/* 🔹 Question Text */}
          <HighlightableText
            text={currentQuestion?.question_text || ''}
            highlights={highlightData[currentQuestion?.id] || []}
            onSelectionChange={handleSelectionChange}
            style={styles.questionText}
          />
          {currentQuestion.question_image_url && (
            <Image
              source={{ uri: currentQuestion.question_image_url }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}

          {/* 🔹 Options */}
          <View style={styles.optionsContainer}>

            {currentQuestion?.options?.map(option => (
              <TouchableOpacity
                key={option.option_key}
                style={[
                  styles.optionButton,
                  selectedOption === option.option_key && styles.optionSelected,
                  selectedOption &&
                  option.option_key === currentQuestion.correct_answer &&
                  styles.correctOption,
                ]}
                onPress={() => handleOptionSelect(option.option_key)}
                disabled={hasAnsweredCurrent.current}>
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.optionCircle,
                      selectedOption === option.option_key &&
                      styles.optionCircleSelected,
                      selectedOption &&
                      option.option_key === currentQuestion.correct_answer &&
                      styles.correctOptionCircle,
                    ]}>
                    <Text
                      style={[
                        styles.optionId,
                        selectedOption === option.option_key &&
                        styles.optionIdSelected,
                        selectedOption &&
                        option.option_key ===
                        currentQuestion?.correct_answer &&
                        styles.correctOptionId,
                      ]}>
                      {option.option_key.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      selectedOption === option.option_key &&
                      styles.optionTextSelected,
                      selectedOption &&
                      option.option_key === currentQuestion?.correct_answer &&
                      styles.correctOptionText,
                    ]}>
                    {option.content}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 🔹 Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[
                styles.navButton,
                isPrevPressed && styles.navButtonPressed,
              ]}
              onPress={handlePrevious}
              onPressIn={() => setIsPrevPressed(true)}
              onPressOut={() => setIsPrevPressed(false)}>
              <Icon
                name="caret-left"
                size={30}
                color={isPrevPressed ? '#fff' : '#fff'}
                style={{ marginRight: 6 }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={submitting || (isLastQuestion && !hasAnsweredCurrent.current)}
              style={[
                styles.navButton,
                {
                  backgroundColor: submitting
                    ? "#B0BEC5"
                    : isLastQuestion
                      ? isSaved ? "#4CAF50" : "#FF9800"
                      : "#1A3848",
                },
              ]}
              onPress={() => {
                if (!isLastQuestion) {
                  handleNext();
                } else if (!isSaved) {
                  handleSaveLastQuestion();   // 🔥 SAVE
                } else {
                  SubmitQuiz();               // 🔥 FINAL SUBMIT
                }
              }}
            >
              {isLastQuestion ? (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  {isSaved ? 'Submit' : 'Save'}
                </Text>
              ) : (
                <Icon name="caret-right" size={26} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

//  Styles
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
    marginBottom: verticalScale(getResponsiveSize(10)),
    includeFontPadding: false,
  },
  sectionTitle1: {
    fontSize: moderateScale(getResponsiveSize(20)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginBottom: verticalScale(getResponsiveSize(10)),
    includeFontPadding: false,
  },
  progressContainer: {
    marginTop: verticalScale(getResponsiveSize(5)),
  },
  progressText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Medium',
    color: 'white',
    textAlign: 'center',
    marginBottom: verticalScale(getResponsiveSize(5)),
    includeFontPadding: false,
  },
  progressBar: {
    height: verticalScale(getResponsiveSize(6)),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: moderateScale(getResponsiveSize(3)),
    overflow: 'hidden',
  },
  questionNumber: {
    color: '#1A3848',
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-SemiBold',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(getResponsiveSize(3)),
  },
  trackerContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -150 }, { translateY: -150 }], // adjust based on width
    width: 300,

    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",

    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,

    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  questionContain: {
    width: 44,
    height: 44,
    margin: 8,

    borderRadius: 22,

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#ddd",
  },
  trackerButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: "orange",
    padding: 2,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  questionContainer: {
    marginHorizontal: scale(getResponsiveSize(20)),
    borderRadius: moderateScale(getResponsiveSize(16)),
    padding: scale(getResponsiveSize(20)),
    marginBottom: verticalScale(getResponsiveSize(30)),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    lineHeight: moderateScale(getResponsiveSize(24)),
    marginBottom: verticalScale(getResponsiveSize(25)),
    includeFontPadding: false,
  },
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  optionsContainer: {
    marginBottom: verticalScale(getResponsiveSize(30)),
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(10)),
    padding: scale(getResponsiveSize(15)),
    marginBottom: verticalScale(getResponsiveSize(12)),
    borderWidth: 1,
    borderColor: '#1A3848',
    minHeight: verticalScale(getResponsiveSize(60)),
  },
  optionSelected: {
    backgroundColor: '#F87F16',
    borderColor: '#F87F16',
  },
  correctOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionCircle: {
    width: scale(getResponsiveSize(30)),
    height: scale(getResponsiveSize(30)),
    borderRadius: scale(getResponsiveSize(15)),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(getResponsiveSize(12)),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionCircleSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  correctOptionCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  optionId: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  optionIdSelected: {
    color: 'white',
  },
  correctOptionId: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    flex: 1,
    includeFontPadding: false,
  },
  optionTextSelected: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  correctOptionText: {
    color: '#FFFFFF',
  },
  // Explanation Section Styles
  explanationContainer: {
    borderRadius: moderateScale(getResponsiveSize(12)),
    padding: scale(getResponsiveSize(20)),
    marginBottom: verticalScale(getResponsiveSize(25)),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(15)),
  },
  sectionTitle: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    marginRight: scale(getResponsiveSize(10)),
    includeFontPadding: false,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  exampleText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Regular',
    color: '#1A3848',
    lineHeight: moderateScale(getResponsiveSize(22)),
    marginBottom: verticalScale(getResponsiveSize(20)),
    includeFontPadding: false,
  },
  correctAnswerContainer: {
    backgroundColor: '#F0F9F0',
    borderRadius: moderateScale(getResponsiveSize(8)),
    padding: scale(getResponsiveSize(15)),
    marginBottom: verticalScale(getResponsiveSize(20)),
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  correctAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(5)),
  },
  correctAnswerText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-SemiBold',
    color: '#2E7D32',
    marginLeft: scale(getResponsiveSize(8)),
    includeFontPadding: false,
  },
  correctAnswerValue: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    marginLeft: scale(getResponsiveSize(26)),
    includeFontPadding: false,
  },
  audioButton: {
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(10)),
    paddingVertical: verticalScale(getResponsiveSize(15)),
    paddingHorizontal: scale(getResponsiveSize(20)),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(getResponsiveSize(50)),
  },
  audioButtonPressed: {
    backgroundColor: '#0F2A38',
  },
  audioButtonSpeaking: {
    backgroundColor: '#F87F16',
  },
  audioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioIcon: {
    marginRight: scale(getResponsiveSize(12)),
  },
  audioText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(8)),
    paddingVertical: verticalScale(getResponsiveSize(12)),
    paddingHorizontal: scale(getResponsiveSize(25)),
    minWidth: scale(getResponsiveSize(90)),
    alignItems: 'center',
    minHeight: verticalScale(getResponsiveSize(45)),
  },
  navButtonPressed: {
    backgroundColor: '#F87F16',
  },
  navButtonText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  navButtonTextPressed: {
    color: '#FFFFFF',
  },
  // Loader Styles
  loaderContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loaderHeader: {
    paddingVertical: verticalScale(20),
    borderBottomLeftRadius: moderateScale(30),
    borderBottomRightRadius: moderateScale(30),
  },
  loaderHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    marginTop: verticalScale(40),
  },
  loaderBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderTitle: {
    fontSize: moderateScale(22),
    fontFamily: 'Poppins-Bold',
    color: 'white',
    includeFontPadding: false,
  },
  loaderContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(40),
  },
  loaderIconContainer: {
    marginBottom: verticalScale(30),
  },
  loaderIconCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F87F16',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  loaderMainText: {
    fontSize: moderateScale(20),
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    textAlign: 'center',
    marginBottom: verticalScale(10),
    includeFontPadding: false,
  },
  loaderSubText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    textAlign: 'center',
    marginBottom: verticalScale(30),
    includeFontPadding: false,
  },
  progressBarContainer: {
    width: '80%',
    height: verticalScale(6),
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
    marginBottom: verticalScale(30),
  },
  loaderprogessbar: {
    height: '30%',
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(10),
    marginTop: verticalScale(15),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(20),
  },
  errorText: {
    fontSize: moderateScale(18),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(30),
    textAlign: 'center',
    includeFontPadding: false,
  },
  errorButton: {
    backgroundColor: '#F87F16',
    paddingHorizontal: scale(30),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(25),
  },
  errorButtonText: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    includeFontPadding: false,
  },
  // Submit Overlay Styles
  submitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  submitTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    marginBottom: 20,
  },
  submitBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 15,
  },
  submitBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  submitSubText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
});

export default Fornixqbank2;