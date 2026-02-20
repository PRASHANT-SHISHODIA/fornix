import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';

// Screen width and height
const { width, height } = Dimensions.get('window');

// 🔹 Scale functions matching your Home screen
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// 🔹 Responsive size function
const getResponsiveSize = (size) => {
  if (width < 375) return size * 0.85;
  if (width > 414) return size * 1.15;
  return size;
};

const MockTestResults = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();

  const isMockTest = score === 'mocktest'



  const rawResult = route.params?.result || {};
  const attemptId = rawResult.attempt_id;

  // const timeTaken = Number(route.params?.timeTaken) || 0;
  const timeTaken = Number(rawResult.time_taken_seconds) || 0;
  const totalQuestions = Number(rawResult.total_questions ?? route.params?.questions?.length) || 0;
  const correctAnswers = Number(rawResult.correct_answers) || 0;
  const wrongAnswers = Number(rawResult.wrong_answers) || 0;
  const unanswered = Number(rawResult.unanswered) || 0;
  const score = Number(rawResult.score) || correctAnswers;
  const percentage = Number(rawResult.percentage) || 0;

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  useEffect(() => {
    console.log('FULL PARAMS:', route.params);
    console.log('ATTEMPT ID:', attemptId);
  }, []);


  const quizData = {
    score,
    percentage,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    unanswered,
    totalTime: `${minutes}m ${seconds}s`,
    avgTimePerQuestion:
      totalQuestions > 0 ? (timeTaken / totalQuestions).toFixed(1) : 0,
    category: 'Mock Test',
  };




  const renderScoreCircle = () => {
    const circleSize = width * 0.5;

    return (
      <View style={styles.scoreCircleContainer}>
        <LinearGradient
          colors={['#F87F16', '#FFA726']}
          style={[
            styles.scoreCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
            }
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.innerCircle, {
            width: circleSize * 0.85,
            height: circleSize * 0.85,
            borderRadius: (circleSize * 0.85) / 2,
          }]}>
            <Text style={[
              styles.scorePercentage,
              { fontSize: moderateScale(getResponsiveSize(48)) }
            ]}>
              {quizData.percentage}
            </Text>
            <Text style={[
              styles.scoreLabel,
              { fontSize: moderateScale(getResponsiveSize(18)) }
            ]}>
              Score
            </Text>
            <View style={[
              styles.categoryBadge,
              {
                paddingHorizontal: scale(getResponsiveSize(15)),
                paddingVertical: verticalScale(getResponsiveSize(6)),
              }
            ]}>
              <Text style={[
                styles.categoryText,
                { fontSize: moderateScale(getResponsiveSize(14)) }
              ]}>
                {quizData.category}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderStatsRow = () => (
    <View style={[
      styles.statsContainer,
      {
        paddingHorizontal: scale(getResponsiveSize(20)),
        paddingVertical: verticalScale(getResponsiveSize(25)),
        borderRadius: moderateScale(getResponsiveSize(16)),
        marginTop: verticalScale(getResponsiveSize(30)),
      }
    ]}>
      {/* Rank Correct */}
      <View style={styles.statItem}>
        <Text style={[
          styles.statNumber,
          { fontSize: moderateScale(getResponsiveSize(32)) }
        ]}>
          {quizData.rank}
        </Text>
        <Text style={[
          styles.statLabel,
          { fontSize: moderateScale(getResponsiveSize(14)) }
        ]}>
          Rank Correct
        </Text>
      </View>

      {/* Vertical Divider */}
      <View style={[
        styles.divider,
        { height: verticalScale(getResponsiveSize(50)) }
      ]} />

      {/* Questions Correct */}
      <View style={styles.statItem}>
        <Text style={[
          styles.statNumber,
          { fontSize: moderateScale(getResponsiveSize(32)) }
        ]}>
          {quizData.correctAnswers}
        </Text>
        <Text style={[
          styles.statLabel,
          { fontSize: moderateScale(getResponsiveSize(14)) }
        ]}>
          Questions{'\n'}Correct
        </Text>
      </View>
    </View>
  );

  const renderTimeInfo = () => (
    <View style={[
      styles.timeContainer,
      {
        padding: scale(getResponsiveSize(20)),
        borderRadius: moderateScale(getResponsiveSize(12)),
        marginTop: verticalScale(getResponsiveSize(25)),
      }
    ]}>
      <View style={styles.timeRow}>
        <Text style={[
          styles.timeLabel,
          { fontSize: moderateScale(getResponsiveSize(16)) }
        ]}>
          Total Time:
        </Text>
        <Text style={[
          styles.timeValue,
          { fontSize: moderateScale(getResponsiveSize(16)) }
        ]}>
          {quizData.totalTime}
        </Text>
      </View>

      <View style={[
        styles.timeRow,
        { marginTop: verticalScale(getResponsiveSize(12)) }
      ]}>
        <Text style={[
          styles.timeLabel,
          { fontSize: moderateScale(getResponsiveSize(16)) }
        ]}>
          Avg. minute per:
        </Text>
        <Text style={[
          styles.timeValue,
          { fontSize: moderateScale(getResponsiveSize(16)) }
        ]}>
          {quizData.avgTimePerQuestion}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle='dark-content' />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.replace('TabNavigator', { screen: 'Home' })}
        >
          <Icon
            name="arrow-left"
            size={moderateScale(getResponsiveSize(20))}
            color="white"
          />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { fontSize: moderateScale(getResponsiveSize(20)) }
        ]}>
          Mock Test Results
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Congratulations Text */}
        <View style={[
          styles.congratsContainer,
          { marginTop: verticalScale(getResponsiveSize(20)) }
        ]}>
          <Text style={[
            styles.congratsText,
            { fontSize: moderateScale(getResponsiveSize(24)) }
          ]}>
            ThankYou
          </Text>
          <Text style={[
            styles.subCongratsText,
            { fontSize: moderateScale(getResponsiveSize(16)) }
          ]}>
            You scored {quizData.score} out of {quizData.totalQuestions}
          </Text>
        </View>

        {/* Score Circle */}
        {renderScoreCircle()}

        {/* Stats Row */}
        {renderStatsRow()}

        {/* Time Info */}
        {renderTimeInfo()}

        {/* Check Attempted Quiz Button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              paddingVertical: verticalScale(getResponsiveSize(16)),
              borderRadius: moderateScale(getResponsiveSize(25)),
              marginTop: verticalScale(getResponsiveSize(30)),
            }
          ]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('CheckAttemptedTest', {
              attemptId: attemptId,   // ✅ correct value
              // userId: userId,
              source: 'mocktest'
            })
          }

        >
          <Text style={[
            styles.buttonText,
            { fontSize: moderateScale(getResponsiveSize(16)) }
          ]}>
            Check Attempted Mock
          </Text>
          <Icon
            name="arrow-right"
            size={moderateScale(getResponsiveSize(16))}
            color="white"
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: verticalScale(getResponsiveSize(40)),
    paddingHorizontal: scale(getResponsiveSize(20)),
  },
  header: {
    backgroundColor: '#F87F16',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(getResponsiveSize(20)),
    paddingVertical: verticalScale(getResponsiveSize(15)),
  },
  backButton: {
    width: moderateScale(getResponsiveSize(40)),
    height: moderateScale(getResponsiveSize(40)),
    borderRadius: moderateScale(getResponsiveSize(20)),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    includeFontPadding: false,
  },
  headerRight: {
    width: moderateScale(getResponsiveSize(40)),
  },
  congratsContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(10)),
  },
  congratsText: {
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    textAlign: 'center',
    includeFontPadding: false,
  },
  subCongratsText: {
    fontFamily: 'Poppins-Medium',
    color: '#666',
    textAlign: 'center',
    marginTop: verticalScale(getResponsiveSize(5)),
    includeFontPadding: false,
  },
  scoreCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(getResponsiveSize(10)),
  },
  scoreCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  innerCircle: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  scorePercentage: {
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    includeFontPadding: false,
  },
  scoreLabel: {
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginTop: verticalScale(getResponsiveSize(4)),
    includeFontPadding: false,
  },
  categoryBadge: {
    backgroundColor: '#1A3848',
    borderRadius: 20,
    marginTop: verticalScale(getResponsiveSize(10)),
  },
  categoryText: {
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    includeFontPadding: false,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Poppins-Bold',
    color: '#F87F16',
    textAlign: 'center',
    includeFontPadding: false,
  },
  statLabel: {
    fontFamily: 'Poppins-Medium',
    color: '#666',
    textAlign: 'center',
    marginTop: verticalScale(getResponsiveSize(4)),
    includeFontPadding: false,
  },
  divider: {
    width: 1,
    backgroundColor: '#DEE2E6',
  },
  timeContainer: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontFamily: 'Poppins-Medium',
    color: '#495057',
    includeFontPadding: false,
  },
  timeValue: {
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    includeFontPadding: false,
  },
  button: {
    backgroundColor: '#F87F16',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(getResponsiveSize(40)),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    includeFontPadding: false,
  },
  buttonIcon: {
    marginLeft: scale(getResponsiveSize(10)),
  },
  skipButtonText: {
    fontFamily: 'Poppins-Medium',
    color: '#666',
    includeFontPadding: false,
  },
});

export default MockTestResults