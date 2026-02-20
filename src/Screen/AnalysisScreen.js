import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';

/* ================= API ================= */
const ANALYSIS_API = 'https://fornix-medical.vercel.app/api/v1/mobile/analysis';

/* ================= CONSTANTS ================= */
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

/* ================= MAIN ================= */
const AnalysisScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  /* ================= GET IDS FROM STORAGE ================= */
  const getUserAndCourseIds = async () => {
    const userId = await AsyncStorage.getItem('user_id');
    const courseRaw = await AsyncStorage.getItem('selectedCourse');
    const courseData = courseRaw ? JSON.parse(courseRaw) : null;

    return {
      userId: userId || null,
      courseId: courseData?.courseId || null,
    };
  };

  /* ================= FETCH ANALYSIS ================= */
  const fetchAnalysis = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const { userId, courseId } = await getUserAndCourseIds();

      console.log('USER ID 👉', userId);
      console.log('COURSE ID 👉', courseId);

      if (!userId || !courseId) {
        setError('User or Course not found');
        return;
      }

      const body = {
        user_id: userId,
        course_id: courseId,
      };

      console.log('ANALYSIS BODY 👉', body);

      const res = await axios.post(ANALYSIS_API, body);

      console.log('ANALYSIS RESPONSE 👉', res.data);

      if (res.data?.success) {
        setAnalysis(res.data);
      } else {
        setError('Failed to load analysis');
      }
    } catch (e) {
      console.log('ANALYSIS ERROR ❌', e);
      setError('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  /* ================= HELPERS ================= */
  const safePercent = (num, den) =>
    den > 0 ? ((num / den) * 100).toFixed(1) : '0.0';

  const formatDate = d =>
    d ? new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) : 'N/A';

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'in progress': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#F87F16', '#FF9E45']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading Analysis…</Text>
        </LinearGradient>
      </View>
    );
  }

  /* ================= ERROR ================= */
  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: '#F5F5F5' }]}>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={60} color="#F87F16" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAnalysis} style={styles.retryBtn}>
            <Icon name="redo" size={16} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { overview, mock_tests, charts } = analysis;

  /* ================= UI ================= */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle='dark-content' />

      {/* HEADER - Mood Screen Style */}
      <LinearGradient
        colors={['#F87F16', '#FF9E45']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Performance Analysis</Text>
            <View style={styles.subTitleContainer}>
              <Icon name="clock" size={12} color="#FFF" style={styles.subTitleIcon} />
              <Text style={styles.subTitle}>
                Last Activity: {formatDate(overview?.last_activity_at)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAnalysis();
            }}
            colors={['#F87F16']}
            tintColor="#F87F16"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* STATS CARDS GRID */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIconContainer}>
              <Icon name="chart-line" size={24} color="#F87F16" />
            </View>
            <Text style={styles.statValue}>{overview?.average_score || 0}%</Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="bullseye" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>
              {safePercent(overview?.total_correct, overview?.total_questions)}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="redo" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{overview?.total_attempts || 0}</Text>
            <Text style={styles.statLabel}>Total Attempts</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="question-circle" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{overview?.total_questions || 0}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
        </View>

        {/* PERFORMANCE OVERVIEW */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Icon name="chart-bar" size={20} color="#1A3848" />
            <Text style={styles.sectionTitle}>Performance Overview</Text>
          </View>

          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{overview?.total_correct || 0}</Text>
              <Text style={styles.overviewLabel}>Correct</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.overviewItem}>
              <Text style={[styles.overviewValue, styles.incorrectValue]}>
                {overview?.total_incorrect || 0}
              </Text>
              <Text style={styles.overviewLabel}>Incorrect</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.overviewItem}>
              <Text style={[styles.overviewValue, styles.skippedValue]}>
                {overview?.total_skipped || 0}
              </Text>
              <Text style={styles.overviewLabel}>Skipped</Text>
            </View>
          </View>
        </View>

        {/* MOCK TESTS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Icon name="file-alt" size={20} color="#1A3848" />
            <Text style={styles.sectionTitle}>Mock Tests</Text>
          </View>
          {mock_tests?.tests?.length ? (
            mock_tests.tests.map((t, index) => (
              <TouchableOpacity key={t.attempt_id} style={styles.testCard}>
                <View style={styles.testHeader}>
                  <View style={styles.testNumber}>
                    <Text style={styles.testNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.testInfo}>
                    <Text style={styles.testTitle} numberOfLines={1}>
                      {t.mock_test_title}
                    </Text>
                    <Text style={styles.testDate}>
                      {formatDate(t.attempted_at)}
                    </Text>
                  </View>
                  <View style={[styles.testStatus, { backgroundColor: getStatusColor(t.status) }]}>
                    <Text style={styles.testStatusText}>{t.status}</Text>
                  </View>
                </View>

                <View style={styles.testFooter}>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Score</Text>
                    <Text style={styles.scoreValue}>{t.score || 0}%</Text>
                  </View>

                  <View style={styles.dividerVertical} />

                  <View style={styles.timeContainer}>
                    <Icon name="clock" size={14} color="#6B7280" />
                    <Text style={styles.timeText}>
                      {t.duration || '00:00'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="file-alt" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No mock tests attempted yet</Text>
              <Text style={styles.emptyStateSubText}>
                Start a mock test to see your analysis here
              </Text>
            </View>
          )}
        </View>

        {/* RECENT ACTIVITY */}
        {charts?.attempts_over_time?.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="calendar-alt" size={20} color="#1A3848" />
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>

            <View style={styles.activityContainer}>
              {charts.attempts_over_time.slice(0, 5).map((a, i) => (
                <View key={i} style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDate}>{a.date}</Text>
                    <Text style={styles.activityCount}>
                      {a.total_attempts} attempts
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#9CA3AF" />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* BOTTOM SPACER */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default AnalysisScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFF',
    borderRadius: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A3848',
    marginTop: 16,
  },
  errorText: {
    marginVertical: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  retryBtn: {
    backgroundColor: '#F87F16',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#F87F16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subTitleIcon: {
    marginRight: 6,
  },
  subTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: isSmallScreen ? 13 : 14,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: width * 0.43,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardPrimary: {
    borderWidth: 2,
    borderColor: '#F87F16',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: '700',
    color: '#1A3848',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3848',
    marginLeft: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
  },
  incorrectValue: {
    color: '#EF4444',
  },
  skippedValue: {
    color: '#6B7280',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  testCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  testNumberText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3848',
    marginBottom: 4,
  },
  testDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  testStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  testStatusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  testFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  scoreContainer: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3848',
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  timeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  activityContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F87F16',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A3848',
    marginBottom: 2,
  },
  activityCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  bottomSpacer: {
    height: 30,
  },
});