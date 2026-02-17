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
import Sound from 'react-native-sound';
Sound.setCategory('Playback');

/* ===================== SCREEN SIZE ===================== */
const { width, height } = Dimensions.get('window');

/* ===================== MAIN COMPONENT ===================== */
const CheckAttemptedTest = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);
  const [playingQuestionId, setPlayingQuestionId] = useState(null);

  const { attemptId } = route.params || {};

  /* ===================== GET USER ID ===================== */
  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);

      const attemptIdFromRoute = route?.params?.attemptId;

      // Get user ID from AsyncStorage
      const uid = await AsyncStorage.getItem('user_id');

      if (!attemptIdFromRoute || !uid) {
        Alert.alert('Error', 'Missing attempt id or user id');
        return;
      }

      const API_URL = `https://fornix-medical.vercel.app/api/v1/mobile/mock-tests/${attemptIdFromRoute}/result`;

      console.log('API URL:', API_URL);
      console.log('User ID:', uid);

      const response = await axios.post(
        API_URL,
        { user_id: uid },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (response.data?.success) {
        console.log('API Response:', JSON.stringify(response.data.result, null, 2));
        setApiData(response.data.result);
      } else {
        Alert.alert('Error', 'Failed to load test result');
      }

    } catch (e) {
      console.log('API ERROR:', e.message || e);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* ===================== API CALL ===================== */
  useEffect(() => {
    fetchAttemptDetails();
  }, []);

  /* ===================== PROCESS API DATA ===================== */
  const { attempt, processedQuestions } = useMemo(() => {
    if (!apiData) {
      return { attempt: null, processedQuestions: [] };
    }

    const attempt = {
      score: apiData.analysis?.percentage || 0,
      time_taken_seconds: apiData.analysis?.time_taken_seconds || 0,
    };

    // Debug: Check audio URLs in API data
    console.log('API details length:', apiData.details?.length || 0);
    apiData.details?.forEach((item, index) => {
      console.log(`Question ${index + 1}:`);
      console.log('  Female Audio URL:', item.female_explanation_audio_url);
      console.log('  Male Audio URL:', item.male_explanation_audio_url);
      console.log('  Has audio:', !!(item.female_explanation_audio_url || item.male_explanation_audio_url));
    });

    // Use a Set to track used IDs and ensure uniqueness
    const usedIds = new Set();
    const processedQuestions = (apiData.details || []).map((item, index) => {
      const userAnswerIndex = item.options?.findIndex(
        o => o.key === item.user_answer
      ) ?? -1;

      const correctAnswerIndex = item.options?.findIndex(
        o => o.key === item.correct_answer
      ) ?? -1;

      // Generate a unique ID - combine question_id with index if needed
      let uniqueId = `${item.question_id || 'no-id'}`;

      // If we've seen this ID before, append index to make it unique
      if (usedIds.has(uniqueId)) {
        uniqueId = `${uniqueId}_${index}`;
      }
      usedIds.add(uniqueId);

      return {
        id: uniqueId, // Use unique ID
        originalId: item.question_id || index,
        index: index + 1, // Use sequence number
        question: item.question_text || 'No question text',
        options: item.options?.map(o => o.content) || ['No options'],
        explanation: item.explanation || 'No explanation available',

        // ✅ FIX: Audio URLs ko API se lena
        femaleAudio: item.female_explanation_audio_url,
        maleAudio: item.male_explanation_audio_url,
        correctAnswer: correctAnswerIndex,
        userAnswer: userAnswerIndex,
        isCorrect: item.is_correct || false,
        difficulty: item.question_type || 'unknown',
        question_image_url: item.image_url,
        option_keys: item.options?.map(o => o.key) || [],
        selected_key: item.user_answer,
        correct_key: item.correct_answer,
      };
    });

    // Debug processed questions
    console.log('Processed questions with audio:');
    processedQuestions.forEach((q, i) => {
      console.log(`Question ${i + 1}: femaleAudio=${q.femaleAudio}, maleAudio=${q.maleAudio}`);
    });

    return { attempt, processedQuestions };
  }, [apiData]);

  /* ===================== GET AUDIO URL ===================== */
  const getAudioUrl = (question) => {
    // Pehle female audio check karein, phir male audio
    if (question.femaleAudio) {
      return question.femaleAudio;
    }
    if (question.maleAudio) {
      return question.maleAudio;
    }
    return null;
  };

  /* ===================== HANDLE AUDIO ===================== */
  const handleAudioExplanation = (question) => {
    const audioUrl = getAudioUrl(question);

    console.log('Audio button clicked for question:', question.id);
    console.log('Audio URL:', audioUrl);
    console.log('Female Audio:', question.femaleAudio);
    console.log('Male Audio:', question.maleAudio);

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
      setPlayingQuestionId(null);
      return;
    }

    console.log('Playing audio:', audioUrl);

    const sound = new Sound(audioUrl, null, (error) => {
      if (error) {
        console.log('Audio load error:', error);
        Alert.alert('Error', 'Unable to play audio');
        return;
      }

      console.log('Audio loaded successfully');
      setCurrentSound(sound);
      setPlayingQuestionId(question.id);

      sound.play((success) => {
        if (success) {
          console.log('Audio finished playing');
        } else {
          console.log('Audio playback failed');
        }
        sound.release();
        setCurrentSound(null);
        setPlayingQuestionId(null);
      });
    });
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.stop();
        currentSound.release();
      }
    };
  }, [currentSound]);

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
      <TouchableOpacity onPress={() => navigation.navigate('TabNavigator', { screen: 'Home' })}>
        <Icon
          name="home"
          size={18}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );

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
          {/* <StatItem
            label="Score"
            value={`${attempt.score || 0}%`}
            color="#2196F3"
          /> */}
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

  /* ===================== QUESTION CARD ===================== */
  const renderItem = ({ item }) => {
    const isOpen = expanded[item.id];
    const hasAudio = !!(item.femaleAudio || item.maleAudio);

    return (
      <View
        style={[
          styles.card,
        ]}
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
                // {
                //   backgroundColor: item.isCorrect
                //     ? '#4CAF50'
                //     : '#F44336',
                // },
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
            color="#555"
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
                  key={`${item.id}_option_${i}`}
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
                !hasAudio && styles.audioButtonDisabled,
              ]}
              onPress={() => handleAudioExplanation(item)}
              disabled={!hasAudio}
            >
              <Icon
                name={
                  !hasAudio
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
                {!hasAudio
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
        keyExtractor={item => item.id}
        extraData={expanded}
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

export default CheckAttemptedTest;

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  // ... (same as before)
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
  meta: { flexDirection: 'row', marginTop: 4, alignItems: 'center' },
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
});