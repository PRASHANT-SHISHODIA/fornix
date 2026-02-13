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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import API from '../API/axiosConfig';

const { width, height } = Dimensions.get('window');

/* -------------------- CONSTANTS -------------------- */
const USER_ID = '00c764c6-2dc0-4e13-a41b-2e3dcd32f471';
const COURSE_NAME = 'AMC';
const STORAGE_KEY = 'ai_chat_session_id';

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

  /* -------------------- EFFECTS -------------------- */
  useEffect(() => {
    loadSavedSession();
  }, []);

  const loadSavedSession = async () => {
    const savedId = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedId) setSessionId(savedId);
  };

  const saveSessionId = async id => {
    await AsyncStorage.setItem(STORAGE_KEY, id);
  };

  /* -------------------- API CALLS -------------------- */
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await API.get(
        '/chat/sessions',
        { params: { user_id: USER_ID } }
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
      const { data } = await API.post(
        '/chat/send',
        {
          user_id: USER_ID,
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
        <Text style={styles.messageText}>{item.text}</Text>
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
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => { fetchSessions(); setShowSessionsModal(true); }}>
              <Text style={styles.headerIcon}>💾</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearChat}>
              <Text style={styles.headerIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CHAT */}
        <FlatList
          ref={flatListRef}
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={80}
        >
          <View style={styles.inputRow}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
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
    </LinearGradient>
  );
};

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf:'center',
    left:"27%"
  },
  headerIcon: {
    fontSize: 22,
    marginLeft: 12,
  },
  messageContainer: { marginBottom: 12 },
  userAlign: { alignItems: 'flex-end' },
  botAlign: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: { backgroundColor: '#8B5CF6' },
  botBubble: { backgroundColor: '#1E293B' },
  sender: {
    fontSize: 11,
    color: '#CBD5F5',
    marginBottom: 4,
  },
  messageText: { color: '#fff', fontSize: 15 },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#020617',
  },
  input: {
    flex: 1,
    color: '#fff',
    padding: 12,
    backgroundColor: '#334155',
    borderRadius: 20,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#8B5CF6',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontSize: 20 },
  modal: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
    marginTop: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 16,
  },
  sessionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sessionTitle: { color: '#fff', fontSize: 16 },
  sessionDate: { color: '#94A3B8', fontSize: 12 },
  close: {
    color: '#8B5CF6',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default AiBot;
