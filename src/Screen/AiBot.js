import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import API from '../API/axiosConfig';

import {
  scale,
  verticalScale,
  moderateScale,
  getResponsiveSize,
  SCREEN_WIDTH as width,
  SCREEN_HEIGHT as height,
  IS_TABLET,
} from '../Utils/ResponsiveUtils';

/* -------------------- CONSTANTS -------------------- */


/* -------------------- HELPERS -------------------- */
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const formatTime = date =>
  new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDate = date =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/* -------------------- MAIN COMPONENT -------------------- */
const AiBot = () => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: generateId(),
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [userId, setUserId] = useState(null);



  const USER_ID = userId
  const COURSE_NAME = 'AMC';
  const STORAGE_KEY = 'ai_chat_session_id';
  /* -------------------- EFFECTS -------------------- */

  useEffect(() => {
    console.log(userId)
    console.log(loadSavedSession());
  }, []);

  const loadSavedSession = async () => {
    const [savedSessionId, savedUserId] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem('user_id'),
    ]);
    if (savedSessionId) setSessionId(savedSessionId);
    if (savedUserId) setUserId(savedUserId);
  };

  const saveSessionId = async id => {
    await AsyncStorage.setItem(STORAGE_KEY, id);
  };

  /* -------------------- API CALLS -------------------- */
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const currentUserId = userId || (await AsyncStorage.getItem('user_id'));
      if (!currentUserId) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        return;
      }
      const { data } = await API.get(
        '/chat/sessions',
        { params: { user_id: currentUserId } }
      );
      if (data.success) setSessions(data.sessions);
    } catch (e) {
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionMessages = async id => {
    setLoading(true);
    try {
      const { data } = await API.get(
        `/chat/sessions/${id}`
      );

      if (data.success) {
        const formatted = data.messages.map(m => ({
          id: m.id || generateId(),
          text: m.message,
          isUser: m.is_user,
          timestamp: m.created_at,
        }));

        setMessages(
          formatted.length
            ? formatted
            : [
              {
                id: generateId(),
                text: "Hello! I'm your AI assistant. How can I help you today?",
                isUser: false,
                timestamp: new Date(),
              },
            ]
        );

        setSessionId(id);
        saveSessionId(id);
        setShowSessionsModal(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: generateId(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const currentUserId = userId || (await AsyncStorage.getItem('user_id'));
      if (!currentUserId) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      const { data } = await API.post(
        '/chat/send',
        {
          user_id: currentUserId,
          course_name: COURSE_NAME,
          query: userMessage.text,
          session_id: sessionId,
        }
      );

      if (data.success) {
        if (data.session_id) {
          setSessionId(data.session_id);
          saveSessionId(data.session_id);
        }

        setMessages(prev => [
          ...prev,
          {
            id: generateId(),
            text: data.ai_message,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error();
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          text: 'Something went wrong. Please try again.',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- ACTIONS -------------------- */
  const clearChat = () => {
    Alert.alert('Clear Chat', 'Clear all messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setMessages([
            {
              id: generateId(),
              text: "Hello! I'm your AI assistant. How can I help you today?",
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          setSessionId(null);
          await AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  };

  /* -------------------- RENDERS -------------------- */
  const renderMessage = useCallback(({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userAlign : styles.botAlign,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text style={styles.sender}>
          {item.isUser ? 'You' : 'AI'} • {formatTime(item.timestamp)}
        </Text>
        <Text style={[styles.messageText, { color: item.isUser ? '#FFFFFF' : '#1E293B' }]}>{item.text}</Text>
      </View>
    </View>
  ), []);

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => loadSessionMessages(item.id)}
    >
      <Text style={styles.sessionTitle}>Chat Session</Text>
      <Text style={styles.sessionDate}>{formatDate(item.started_at)}</Text>
    </TouchableOpacity>
  );

  /* -------------------- UI -------------------- */
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F87F16" barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FORNIX AI</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => { fetchSessions(); setShowSessionsModal(true); }}>
              <Ionicons name="time-outline" size={24} color="#fff" style={{ marginLeft: 12 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearChat}>
              <Ionicons name="trash-outline" size={24} color="#fff" style={{ marginLeft: 12 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CHAT */}
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* INPUT */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <View style={styles.inputRow}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#64748B"
              style={styles.input}
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={loading || !inputText.trim()}
              style={styles.sendButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendText}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* SESSIONS MODAL */}
        <Modal visible={showSessionsModal} transparent animationType="slide">
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Your Sessions</Text>
            {loadingSessions ? (
              <ActivityIndicator color="#8B5CF6" />
            ) : (
              <FlatList
                data={sessions}
                renderItem={renderSessionItem}
                keyExtractor={i => i.id}
              />
            )}
            <TouchableOpacity onPress={() => setShowSessionsModal(false)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#F87F16',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(20)),
    paddingBottom: verticalScale(getResponsiveSize(30)),
    borderBottomLeftRadius: scale(getResponsiveSize(30)),
    borderBottomRightRadius: scale(getResponsiveSize(30)),
    height: verticalScale(getResponsiveSize(120)),
    paddingTop: verticalScale(getResponsiveSize(40)),
  },
  headerTitle: {
    color: '#fff',
    fontSize: moderateScale(getResponsiveSize(22)),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80, // Approximate width to balance back button
    justifyContent: 'flex-end',
  },
  backButton: {
    width: 80,
    justifyContent: 'center',
  },

  messageContainer: { marginBottom: 12 },
  userAlign: { alignItems: 'flex-end' },
  botAlign: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: IS_TABLET ? '60%' : '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: { backgroundColor: '#F87F16' },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sender: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  messageText: { fontSize: 15 },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    color: '#1E293B',
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    fontFamily: 'Poppins-Regular',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#F87F16',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontSize: 20 },
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    color: '#1E293B',
    fontSize: 22,
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  sessionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sessionTitle: { color: '#1E293B', fontSize: 16, fontFamily: 'Poppins-Medium' },
  sessionDate: { color: '#64748B', fontSize: 12, fontFamily: 'Poppins-Regular' },
  close: {
    color: '#F87F16',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default AiBot;
