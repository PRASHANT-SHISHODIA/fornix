import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/* ================= API ================= */
const API_URL =
  'https://fornix-medical.vercel.app/api/v1/smart-tracking/compute';

const { width, height } = Dimensions.get('window');

// 🔹 Responsive scaling functions
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const getResponsiveFontSize = (size) => {
  if (width < 375) return size * 0.85; // Small phones
  if (width > 414) return size * 1.15; // Large phones/tablets
  return size;
};

/* ================= MAIN SCREEN ================= */
const SmartTrackingScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const { width } = useWindowDimensions();

  /* ================= FETCH DATA ================= */
  const fetchSmartTracking = async () => {
    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem('user_id');
      const courseRaw = await AsyncStorage.getItem('selectedCourse');
      let courseId = null;

      if (courseRaw) {
        const course = JSON.parse(courseRaw);
        courseId = course.id || course.courseId;
      } else if (route.params?.courseId || route.params?.course) {
        courseId = route.params.courseId || route.params.course;
      }

      if (!userId || !courseId) {
        throw new Error('User or Course not found');
      }

      const body = {
        user_id: userId,
        course_id: courseId,
      };

      console.log('Fetching Smart Tracking with:', body);

      const res = await axios.post(API_URL, body, {
        headers: { 'Content-Type': 'application/json' },
      });

      setApiData(res.data);
      console.log("Smart Tracking Data:", res.data)
    } catch (err) {
      console.log("Error fetching smart tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartTracking();
  }, []);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#F87F16" />
        <Text style={styles.loadingText}>Analyzing your progress...</Text>
      </View>
    );
  }

  // If no data or success is false (and not loading), show empty state or error
  if (!apiData?.success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Icon name="analytics-outline" size={80} color="#ccc" />
          <Text style={styles.errorText}>No tracking data available yet.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSmartTracking}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  /* ================= RESPONSE MAPPING ================= */
  const {
    course,
    metrics = {},
    data: smartData = {},
  } = apiData;

  const {
    weaknesses = [],
    study_plan = [],
    pacing = {},
    next_actions = [],
  } = smartData;

  const {
    total_weeks = 0,
    weekly_hours = 0,
    by_subject = [],
  } = pacing;

  const lastActivity = metrics.last_activity
    ? new Date(metrics.last_activity).toLocaleDateString()
    : 'No activity';

  /* ================= UI ================= */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F87F16" barStyle="light-content" />

      {/* Header Gradient */}
      <LinearGradient
        colors={['#F87F16', '#FF6B00']}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Smart Tracking</Text>
          <Text style={styles.courseName}>{course}</Text>
        </View>

        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ================= METRICS GRID ================= */}
        <View style={styles.sectionHeaderRow}>
          <Icon name="stats-chart" size={20} color="#1A3848" />
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            label="Tests Taken"
            value={metrics.test_attempts_count || 0}
            icon="clipboard-list-outline"
            color="#4CAF50"
            library="MaterialCommunityIcons"
          />
          <MetricCard
            label="Quizzes Taken"
            value={metrics.quiz_attempts_count || 0}
            icon="checkbox-marked-circle-outline"
            color="#2196F3"
            library="MaterialCommunityIcons"
          />
          <MetricCard
            label="Avg Test Score"
            value={`${Math.round(metrics.avg_test_score || 0)}%`}
            icon="percent"
            color="#FF9800"
            library="MaterialCommunityIcons"
          />
          <MetricCard
            label="Last Activity"
            value={lastActivity}
            icon="clock-time-four-outline"
            color="#9C27B0"
            library="MaterialCommunityIcons"
            isDate
          />
        </View>
        {/* ================= WEAKNESSES ================= */}
        {weaknesses.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Icon name="warning-outline" size={20} color="#E53935" />
              <Text style={styles.sectionTitle}>Focus Areas</Text>
            </View>
            {weaknesses.map((w, i) => (
              <View key={i} style={styles.weaknessCard}>
                <View style={styles.weaknessHeader}>
                  <Text style={styles.weaknessTitle}>{w.area_name}</Text>
                  <View style={[styles.badge, { backgroundColor: w.severity === 'High' ? '#FFEBEE' : '#FFF3E0' }]}>
                    <Text style={[styles.badgeText, { color: w.severity === 'High' ? '#D32F2F' : '#EF6C00' }]}>
                      {w.severity} Priority
                    </Text>
                  </View>
                </View>
                <Text style={styles.weaknessReason}>{w.reason}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${w.confidence || 0}%` }]} />
                </View>
                <Text style={styles.confidenceText}>Confidence: {w.confidence}%</Text>
              </View>
            ))}
          </>
        )}

        {/* ================= STUDY PLAN ================= */}
        {study_plan.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Icon name="calendar-outline" size={20} color="#1A3848" />
              <Text style={styles.sectionTitle}>Recommended Study Plan</Text>
            </View>

            {study_plan.map((p, i) => (
              <View key={i} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={styles.weekBadge}>
                    <Text style={styles.weekText}>{p.weeks} Week</Text>
                  </View>
                  <Text style={styles.planTitle}>{p.area_name}</Text>
                </View>

                <View style={styles.planDetailRow}>
                  <Icon name="time-outline" size={14} color="#666" />
                  <Text style={styles.planDetailText}>{p.hours_per_week} hrs/week</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.subHeader}>Topics</Text>
                <View style={styles.topicsContainer}>
                  {(p.topics || []).map((t, idx) => (
                    <View key={idx} style={styles.topicChip}>
                      <Text style={styles.topicText}>{t}</Text>
                    </View>
                  ))}
                </View>

                {p.milestone && (
                  <View style={styles.milestoneBox}>
                    <MaterialCommunityIcons name="flag-checkered" size={16} color="#4bbea0" />
                    <Text style={styles.milestoneText}>{p.milestone}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* ================= NEXT ACTIONS ================= */}
        {next_actions.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Icon name="checkmark-done-circle-outline" size={20} color="#1A3848" />
              <Text style={styles.sectionTitle}>Next Actions</Text>
            </View>

            <View style={styles.actionsCard}>
              {next_actions.map((a, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={styles.actionIndexCircle}>
                    <Text style={styles.actionIndex}>{i + 1}</Text>
                  </View>
                  <Text style={styles.actionText}>{a}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

/* ================= COMPONENT: METRIC CARD ================= */
const MetricCard = ({ label, value, icon, color, library, isDate }) => {
  const IconComponent = library === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Icon;

  return (
    <View style={styles.metricCard}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <IconComponent name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  )
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F87F16',
  },
  loadingText: {
    marginTop: 10,
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F87F16',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#F87F16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerContent: {
    alignItems: 'center',
  },
  placeholder: {
    width: 34, // Approximate width of back button to balance the layout
  },
  headerTitle: {
    color: '#FFF',
    fontSize: moderateScale(20),
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  courseName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-Medium',
    marginTop: 4,
  },
  contentContainer: {
    padding: 20,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    marginLeft: 8,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%', // Approx half with gap
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#E6EBF5',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: moderateScale(18),
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#899BB1',
    textAlign: 'center',
  },

  // Weaknesses
  weaknessCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  weaknessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  weaknessTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
  },
  weaknessReason: {
    fontSize: moderateScale(13),
    color: '#556987',
    fontFamily: 'Poppins-Regular',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F0F2F5',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E53935',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    color: '#899BB1',
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
  },

  // Study Plan
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekBadge: {
    backgroundColor: '#1A3848',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  weekText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  planTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    flex: 1,
  },
  planDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planDetailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'Poppins-Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginVertical: 10,
  },
  subHeader: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    marginBottom: 8,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EBF5',
  },
  topicText: {
    fontSize: 12,
    color: '#556987',
    fontFamily: 'Poppins-Medium',
  },
  milestoneBox: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  milestoneText: {
    fontSize: 13,
    color: '#00796B',
    marginLeft: 8,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },

  // Next Actions
  actionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  actionIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  actionIndex: {
    fontSize: 12,
    color: '#1976D2',
    fontFamily: 'Poppins-Bold',
  },
  actionText: {
    fontSize: 14,
    color: '#1A3848',
    fontFamily: 'Poppins-Regular',
    flex: 1,
    lineHeight: 20,
  },
  footerSpace: {
    marginBottom: 50,
  },
});

export default SmartTrackingScreen;
