import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Sound from 'react-native-sound'; import { useNavigation } from '@react-navigation/native';
Sound.setCategory('Playback');



/* ===================== SCREEN SIZE ===================== */
const { width, height } = Dimensions.get('window');

/* ===================== RESPONSIVE HELPERS ===================== */
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

/* ===================== DEMO QUESTIONS ===================== */
const DEMO_QUESTIONS = [
  {
    id: 1,
    question: 'What is the capital of India?',
    options: ['Mumbai', 'Delhi', 'Chennai', 'Kolkata'],
    correctAnswer: 1,
    explanation: 'Delhi is the capital of India.',
    difficulty: 'easy',
    category: 'Geography',
  },
  {
    id: 2,
    question: 'Which data structure follows FIFO?',
    options: ['Stack', 'Queue', 'Tree', 'Graph'],
    correctAnswer: 1,
    explanation: 'Queue follows First In First Out.',
    difficulty: 'medium',
    category: 'Computer Science',
  },
  {
    id: 3,
    question: 'Who wrote the Ramayana?',
    options: ['Tulsidas', 'Kalidas', 'Valmiki', 'Ved Vyasa'],
    correctAnswer: 2,
    explanation: 'Ramayana was written by Maharishi Valmiki.',
    difficulty: 'easy',
    category: 'History',
  },
];

/* ===================== MAIN COMPONENT ===================== */
const CheckAttempted = ({ route, navigation }) => {
  // const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('all');
  const [expanded, setExpanded] = useState({});
  // const [isSpeaking, setIsSpeaking] = useState(false);
  // const [speakingQuestionId, setSpeakingQuestionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);
  const [playingQuestionId, setPlayingQuestionId] = useState(null);


  useEffect(() => {
    console.log("CHECK ATTEMPTED PARAMS:", route.params);
  }, []);


  /* ===================== GET USER ID ===================== */
  useEffect(() => {
    const getUserIdFromStorage = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('user_id');
        setUserId(storedUserId);
        console.log('User ID fetched:', storedUserId);
      } catch (error) {
        console.log('Error fetching user ID:', error);
      }
    };
    getUserIdFromStorage();
  }, []);

  /* ===================== API CALL ===================== */
  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);

      // Get parameters from navigation or route
      const attemptId = route?.params?.attemptedId;
      const user_id = route?.params?.userId || userId;
      console.log('🔍 Fetching attempt details for:', { attemptId, user_id });

      if (!attemptId || !user_id) {
        console.log('Missing required parameters:', { attemptId, user_id });
        Alert.alert('Error', 'Unable to load attempt details. Missing parameters.');
        setLoading(false);
        return;
      }

      const payload = {
        user_id: user_id,
        attempt_id: attemptId
      };

      console.log('📤 API Payload:', payload);

      const response = await axios.post(
        'https://fornix-medical.vercel.app/api/v1/quiz-attempt/details',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      if (response.data?.success) {
        console.log('✅ API Response received');
        setApiData(response.data);
        console.log("📥 Attempt Data:", response.data);
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to fetch attempt details');
      }
    } catch (error) {
      console.log('❌ API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 404) {
        Alert.alert('Not Found', 'Attempt details not found. It may have been deleted.');
      } else if (error.code === 'ECONNABORTED') {
        Alert.alert('Timeout', 'Request timed out. Please check your internet connection.');
      } else {
        Alert.alert('Error', 'Failed to load attempt details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ===================== INITIALIZE DATA ===================== */
  useEffect(() => {
    if (userId) {
      fetchAttemptDetails();
    }
  }, [userId]);

  /* ===================== PROCESS API DATA ===================== */
  const { attempt, review, processedQuestions } = useMemo(() => {
    if (!apiData) {
      return {
        attempt: null,
        review: [],
        processedQuestions: [],
      };
    }

    const attempt = apiData.attempt;
    const review = apiData.review || [];

    // Transform API data to match component structure
    const processedQuestions = review.map((item, index) => {
      const question = item.question;
      const userAnswerKey = item.selected_key;
      const correctAnswerKey = item.correct_key;
      const isCorrect = item.is_correct;

      // Find user answer index
      const userAnswerIndex = question.options.findIndex(
        opt => opt.option_key === userAnswerKey
      );

      // Find correct answer index
      const correctAnswerIndex = question.options.findIndex(
        opt => opt.option_key === correctAnswerKey
      );

      // Convert options array to simple text array
      const options = question.options.map(opt => opt.content);

      return {
        id: question.id,
        index: index + 1,
        question: question.question_text,
        options,
        explanation: question.explanation,

        // ✅ AUDIO URLS
        femaleAudio: question.female_explanation_audio_url,
        maleAudio: question.male_explanation_audio_url,

        correctAnswer: correctAnswerIndex,
        userAnswer: userAnswerIndex,
        isCorrect,
        // difficulty: question.question_type,
        question_image_url: question.question_image_url,
        option_keys: question.options.map(opt => opt.option_key),
        selected_key: userAnswerKey,
        correct_key: correctAnswerKey,
      };
    });

    return {
      attempt,
      review,
      processedQuestions,
    };
  }, [apiData]);

  /* ===================== FILTER QUESTIONS ===================== */
  const filteredQuestions = useMemo(() => {
    if (activeTab === 'correct') {
      return processedQuestions.filter(q => q.isCorrect);
    }
    if (activeTab === 'wrong') {
      return processedQuestions.filter(q => !q.isCorrect);
    }
    return processedQuestions;
  }, [activeTab, processedQuestions]);

  /* ===================== STATS ===================== */
  const total = processedQuestions.length;
  const correct = processedQuestions.filter(q => q.isCorrect).length;
  const wrong = total - correct;

  /* ===================== TOGGLE EXPAND ===================== */
  const toggleExpand = id => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  /* ===================== HEADER ===================== */
  const Header = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={18} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Attempted Questions</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('TabNavigation')}
        disabled={loading}
      >
        <Icon
          name="home"
          size={18}
          color="#fff"
          style={loading && { opacity: 0.5 }}
        />
      </TouchableOpacity>

    </View>
  );

  const getAudioUrl = (question) => {
    return question.femaleAudio || question.maleAudio || null;
  };




  const handleAudioExplanation = (question) => {
    const audioUrl = getAudioUrl(question);

    if (!audioUrl) {
      Alert.alert('No Audio', 'Audio explanation not available');
      return;
    }

    // Stop previous audio
    if (currentSound) {
      currentSound.stop();
      currentSound.release();
      setCurrentSound(null);
      setPlayingQuestionId(null);
    }

    // Same question pressed again → stop
    if (playingQuestionId === question.id) {
      return;
    }

    const sound = new Sound(audioUrl, null, (error) => {
      if (error) {
        console.log('Audio load error:', error);
        Alert.alert('Error', 'Unable to play audio');
        return;
      }

      setCurrentSound(sound);
      setPlayingQuestionId(question.id);

      sound.play(() => {
        sound.release();
        setCurrentSound(null);
        setPlayingQuestionId(null);
      });
    });
  };

  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.stop();
        currentSound.release();
      }
    };
  }, [currentSound]);



  /* ===================== STATS CARD ===================== */
  const Stats = () => (
    <LinearGradient
      colors={['#F87F16', '#FFA726']}
      style={styles.statsCard}
    >
      <StatItem label="Total" value={total} />
      <StatItem label="Correct" value={correct} color="#4CAF50" />
      <StatItem label="Wrong" value={wrong} color="#F44336" />
      {attempt && (
        <>
          <StatItem
            label="Score"
            value={`${attempt.score || 0}%`}
            color="#2196F3"
          />
          {/* <StatItem
            label="Time"
            value={`${Math.floor(attempt.time_taken_seconds / 60)}m`}
            color="#9C27B0"
          /> */}
        </>
      )}
    </LinearGradient>
  );

  const StatItem = ({ label, value, color = '#fff' }) => (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  /* ===================== TABS ===================== */
  const Tabs = () => (
    <View style={styles.tabs}>
      {['all', 'correct', 'wrong'].map(tab => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && styles.activeTab,
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText,
            ]}
          >
            {tab.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );






  // Call it when component mounts


  /* ===================== QUESTION CARD ===================== */
  const renderItem = ({ item }) => {
    const isOpen = expanded[item.id];

    return (
      <View
        style={
          styles.card
        }
      >
        {/* HEADER */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.qLeft}>
            <View
              style={[
                styles.qNumber,
                {
                  backgroundColor: item.isCorrect
                    ? '#4CAF50'
                    : '#F44336',
                },
              ]}
            >
              <Text style={styles.qNumberText}>{item.index}</Text>
            </View>

            <View style={styles.qInfo}>
              <Text numberOfLines={2} style={styles.qText}>
                {item.question}
              </Text>

              <View style={styles.meta}>
                <Text style={styles.metaText}>
                  {item.difficulty ? item.difficulty.toUpperCase() : 'N/A'}
                </Text>
                <Text
                  style={[
                    styles.badge,
                    {
                      color: item.isCorrect
                        ? '#4CAF50'
                        : '#F44336',
                    },
                  ]}
                >
                  {item.isCorrect ? 'Correct' : 'Wrong'}
                </Text>
              </View>
            </View>
          </View>

          <Icon
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={14}
          // color="#555"
          />
        </TouchableOpacity>

        {/* QUESTION IMAGE */}
        {item.question_image_url && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.question_image_url }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* EXPANDED */}
        {isOpen && (
          <View style={styles.expand}>
            {/* OPTIONS */}
            {item.options.map((opt, i) => {
              const isCorrect = i === item.correctAnswer;
              const isUser = i === item.userAnswer;
              const optionKey = item.option_keys?.[i] || String.fromCharCode(65 + i);

              return (
                <View
                  key={i}
                  style={[
                    styles.option,
                    isCorrect && styles.correct,
                    isUser && !isCorrect && styles.wrong,
                  ]}
                >
                  <Text style={styles.optionText}>
                    {optionKey.toUpperCase()}. {opt}
                    {isCorrect && ' ✓'}
                    {isUser && !isCorrect && ' ✗'}
                  </Text>
                </View>
              );
            })}

            {/* CORRECT ANSWER INDICATOR */}
            <View style={styles.answerInfo}>
              <Text style={styles.answerInfoText}>
                Your Answer: <Text style={styles.answerKey}>
                  {item.selected_key?.toUpperCase() || 'N/A'}
                </Text>
              </Text>
              <Text style={styles.answerInfoText}>
                Correct Answer: <Text style={styles.correctKey}>
                  {item.correct_key?.toUpperCase() || 'N/A'}
                </Text>
              </Text>
            </View>

            {/* EXPLANATION */}
            <Text style={styles.explanation}>
              {item.explanation}
            </Text>

            {/* AUDIO BUTTON */}
            <TouchableOpacity
              style={[
                styles.audioButton,
                playingQuestionId === item.id && styles.audioButtonActive,
                !getAudioUrl(item) && styles.audioButtonDisabled,
              ]}
              onPress={() => handleAudioExplanation(item)}
              disabled={!getAudioUrl(item)}
            >
              <Icon
                name={
                  !getAudioUrl(item)
                    ? 'volume-mute'
                    : playingQuestionId === item.id
                      ? 'pause-circle'
                      : 'volume-up'
                }
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />

              <Text style={styles.audioButtonText}>
                {!getAudioUrl(item)
                  ? 'No Audio'
                  : playingQuestionId === item.id
                    ? 'Stop Audio'
                    : 'Audio Explanation'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  /* ===================== LOADING STATE ===================== */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#F87F16" />
        <Text style={styles.loadingText}>Loading attempt details...</Text>
      </View>
    );
  }

  /* ===================== NO DATA STATE ===================== */
  if (!apiData && !loading) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header />
        <View style={styles.errorContent}>
          <Icon name="exclamation-triangle" size={60} color="#F87F16" />
          <Text style={styles.errorText}>No attempt data found</Text>
          <Text style={styles.errorSubText}>
            Please make sure you have completed a quiz
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchAttemptDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ===================== RENDER ===================== */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F87F16" />

      <Header />

      <FlatList
        ListHeaderComponent={
          <>
            <Stats />
            <Tabs />
          </>
        }
        data={filteredQuestions}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-question" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No questions found</Text>
          </View>
        }
      />
    </View>
  );
};

export default CheckAttempted;

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#F87F16',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  statsCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
    minWidth: 60,
  },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { color: '#fff', fontSize: 12, marginTop: 4 },

  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#eee',
    borderRadius: 20,
  },
  activeTab: { backgroundColor: '#F87F16' },
  tabText: { color: '#555', fontSize: 12 },
  activeTabText: { color: '#fff', fontWeight: '600' },

  list: { paddingHorizontal: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qLeft: { flexDirection: 'row', flex: 1 },
  qNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qNumberText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  qInfo: { marginLeft: 10, flex: 1 },
  qText: { fontSize: 14, fontWeight: '500' },

  meta: { flexDirection: 'row', marginTop: 4 },
  metaText: { fontSize: 12, color: '#777', marginRight: 10 },
  badge: { fontSize: 12, fontWeight: '600' },

  expand: {
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 10,
  },
  option: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 6,
  },
  correct: { backgroundColor: '#E8F5E9' },
  wrong: { backgroundColor: '#FFEBEE' },
  optionText: { fontSize: 13 },

  answerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  answerInfoText: {
    fontSize: 13,
    color: '#555',
  },
  answerKey: {
    color: '#F44336',
    fontWeight: '600',
  },
  correctKey: {
    color: '#4CAF50',
    fontWeight: '600',
  },

  explanation: {
    marginTop: 8,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  audioButton: {
    marginTop: 12,
    backgroundColor: '#1A3848',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioButtonActive: {
    backgroundColor: '#F87F16',
  },
  audioButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  imageContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  questionImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#F87F16',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  audioButtonDisabled: {
    backgroundColor: '#ccc',
  },
  audioButtonTextDisabled: {
    color: '#666',
  },
});