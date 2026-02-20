// Mood.js
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  scale,
  verticalScale,
  moderateScale,
  getResponsiveSize,
  IS_TABLET,
  SCREEN_WIDTH as width,
  SCREEN_HEIGHT as height,
  getHeaderTransform,
  getSearchTransform,
  getGridColumns
} from '../Utils/ResponsiveUtils';

const Mood = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selectedMood, setSelectedMood] = useState(null);
  const route = useRoute();
  const from = route?.params?.from || null;
  const subjectId = route?.params?.subjectId;
  const subjectName = route?.params?.subjectName;
  const Course = route?.params?.Course;
  const mode = route.params?.mode;
  const mockTestId = route.params?.testId;
  console.log('Via Mood Screen - Subject ID:', subjectId);
  console.log('Via Mood Screen - Subject Name:', subjectName);
  console.log('Via Mood Screen - Course:', Course);
  console.log('Via Mood Screen - From:', from);
  console.log('Mode and MockTestId', mockTestId, mode)


  const buildNavigationParams = () => {
    let params = {
      mood: selectedMood,
    };

    if (subjectId && subjectName && Course) {
      return {
        screen: 'Fornixqbank2',
        params: {
          ...params,
          subjectId,
          subjectName,
          Course,
          isAMC: true,
        },
      };
    }

    if (mode && mockTestId) {
      return {
        screen: 'Quizpage',
        params: {
          ...params,
          mode,
          testId: mockTestId,
        },
      };
    }

    return null;
  };




  // 🔹 Mood options
  const moodOptions = [
    { id: '1', title: 'Competitive', icon: 'trophy' },
    { id: '2', title: 'Easy', icon: 'smile' },
    { id: '3', title: 'Moderate', icon: 'brain' },
    { id: '4', title: 'Difficult', icon: 'fire' },
  ];

  // 🔹 Blink animation for start button
  const blinkAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [blinkAnim]);

  console.log("mooddddd", moodOptions)

  const backgroundColor = blinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1A3848', '#F87F16'],
  });

  // 🔹 Handle mood selection with toggle functionality
  const handleMoodSelect = (moodId) => {
    if (selectedMood === moodId) {
      // If the same mood is clicked again, deselect it
      setSelectedMood(null);
    } else {
      // Select the new mood
      setSelectedMood({ id: moodId, title: moodOptions.find(m => m?.id === moodId)?.title || '' });
    }
  };

  // 🔹 Get background color for mood card
  const getMoodCardColor = (moodId) => {
    return selectedMood?.id === moodId ? '#F87F16' : '#1A3848';
  };

  // 🔹 Get icon background color
  const getIconBackgroundColor = (moodId) => {
    return selectedMood?.id === moodId ? '#FFFFFF' : '#F0F4F8';
  };

  // 🔹 Get icon color
  const getIconColor = (moodId) => {
    return selectedMood?.id === moodId ? '#F87F16' : '#1A3848';
  };


  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
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
              <Text style={styles.title}>Mood</Text>
            </View>
          </View>
        </View>

        {/* 🔹 Mood Options Grid */}
        <View style={styles.moodGrid}>
          {moodOptions.map(mood => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodCard,
                { backgroundColor: getMoodCardColor(mood.id) }
              ]}
              onPress={() => handleMoodSelect(mood.id)}>
              <View style={styles.moodContent}>
                <View style={[
                  styles.moodIconContainer,
                  { backgroundColor: getIconBackgroundColor(mood.id) }
                ]}>
                  <Icon
                    name={mood.icon}
                    size={moderateScale(getResponsiveSize(28))}
                    color={getIconColor(mood.id)}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.moodTitle}>{mood.title}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔹 Divider */}
        <View style={styles.divider} />

        {/* 🔹 Start Quiz Button */}
        <Animated.View style={[styles.startButton, { backgroundColor }]}>
          <TouchableOpacity
            style={styles.startButtonTouchable}
            onPress={() => {
              if (!selectedMood) {
                Alert.alert('Select Mood', 'Please select a mood first');
                return;
              }

              const navigationData = buildNavigationParams();

              if (!navigationData) {
                Alert.alert('Navigation Error', 'Invalid navigation data');
                return;
              }

              navigation.navigate(
                navigationData.screen,
                navigationData.params
              );
            }}

          >
            <Text style={styles.startButtonText}>
              {selectedMood ? 'Start Quiz' : 'Select a Mood to Start'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// 🔹 Styles
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
    fontSize: moderateScale(getResponsiveSize(24)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginBottom: verticalScale(getResponsiveSize(25)),
    includeFontPadding: false,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: scale(getResponsiveSize(20)),
    marginBottom: verticalScale(getResponsiveSize(30)),
  },
  moodCard: {
    width: (width - scale(getResponsiveSize(60))) / (IS_TABLET ? 4 : 2), // 4 columns on tablet, 2 on phone
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(16)),
    paddingHorizontal: scale(getResponsiveSize(15)),
    marginBottom: verticalScale(getResponsiveSize(20)),
    paddingVertical: verticalScale(getResponsiveSize(20)),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    minHeight: verticalScale(getResponsiveSize(120)),
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  moodIconContainer: {
    width: scale(getResponsiveSize(70)),
    height: scale(getResponsiveSize(70)),
    borderRadius: scale(getResponsiveSize(35)),
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F87F16',
    marginBottom: verticalScale(getResponsiveSize(10)),
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodTitle: {
    fontSize: moderateScale(getResponsiveSize(18)),
    fontFamily: 'Poppins-Bold',
    color: 'white',
    textAlign: 'center',
    includeFontPadding: false,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: scale(getResponsiveSize(20)),
    marginVertical: verticalScale(getResponsiveSize(20)),
  },
  startButton: {
    alignSelf: 'center',
    borderRadius: moderateScale(getResponsiveSize(10)),
    marginVertical: verticalScale(getResponsiveSize(50)),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: scale(getResponsiveSize(200)),
  },
  startButtonTouchable: {
    paddingVertical: verticalScale(getResponsiveSize(15)),
    paddingHorizontal: scale(getResponsiveSize(40)),
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    fontSize: moderateScale(getResponsiveSize(18)),
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default Mood;