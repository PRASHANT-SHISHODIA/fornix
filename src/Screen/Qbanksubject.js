// QBankSubjectPage.js
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
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import Course from './Course';
import API from '../API/axiosConfig';

import {
  scale,
  verticalScale,
  moderateScale,
  getResponsiveSize,
  getGridColumns,
  getHeaderTransform,
  getSearchTransform,
  SCREEN_WIDTH as width,
  SCREEN_HEIGHT as height,
} from '../Utils/ResponsiveUtils';

const Qbanksubject = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [subject, setSubject] = useState([]);
  const [loading, setLoading] = useState(true);

  const route = useRoute();
  const mood = route?.params?.mood ?? null;
  console.log('MOOD RECEVID IN QBANKSSUBJECT :', mood?.title)
  const [selectedCourse, setSelectedCourse] = useState(null);
  // const blinkAnim = useRef(new Animated.Value(0)).current;
  console.log("COURSE IN THE", selectedCourse)


  // 🔹 Subject list removed (handled by API)


  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courseData = await AsyncStorage.getItem('selectedCourse');
        let courseObj = null;

        if (courseData) {
          courseObj = JSON.parse(courseData);
          console.log('✅ Found course in AsyncStorage:', courseObj);
        } else if (route.params?.courseId || route.params?.Course) {
          courseObj = {
            courseId: route.params.courseId || route.params.Course,
            courseName: route.params.courseName || 'Selected Course',
          };
          console.log('✅ Found course in Route Params:', courseObj);
        }

        if (courseObj) {
          setSelectedCourse(courseObj);
          const finalId = courseObj.courseId || courseObj.id;
          console.log('🎯 Final courseId to use:', finalId);
          getSubjectsByCourse(finalId);
        } else {
          console.log('⚠️ No course found in Storage or Params');
          setLoading(false);
        }
      } catch (e) {
        console.log('❌ Error loading course:', e);
        setLoading(false);
      }
    };

    loadCourse();
  }, []);

  const isAMC = selectedCourse?.courseName?.toUpperCase().includes('AMC');
  console.log('IS AMC COURSE:', isAMC);





  const getSubjectsByCourse = async (courseId) => {
    let finalId = courseId;

    if (!finalId) {
      console.log('⚠️ courseId missing in getSubjectsByCourse, trying to fetch from Profile...');
      try {
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("user_id");

        if (token && userId) {
          const res = await API.post("/user/get", { id: userId });
          if (res.data?.success && res.data?.subscriptions?.length > 0) {
            // Pick first active subscription's course
            const activeSub = res.data.subscriptions.find(s => s.is_active);
            if (activeSub) {
              finalId = activeSub.course_id || activeSub.course?.id;
              console.log('✅ Found courseId from User Profile:', finalId);
              // Update state for visual consistency
              setSelectedCourse({
                courseId: finalId,
                courseName: activeSub.course?.name || 'Selected Course'
              });
            }
          }
        }
      } catch (profileError) {
        console.log('❌ Failed to fetch fallback course from profile:', profileError);
      }
    }

    if (!finalId) {
      console.log('❌ Skipping SUBJECT API: Still no courseId found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await API.post(
        '/subjects',
        {
          course_id: finalId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSubject(response.data.data || []);
    } catch (error) {
      console.log(
        'SUBJECT API ERROR',
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  console.log("Subject responae ", subject)

  // useEffect(() => {
  //   getSubjectsByCourse();
  // }, []);
  useEffect(() => {
    if (selectedCourse?.courseId) {
      getSubjectsByCourse(selectedCourse.courseId);
    }
  }, [selectedCourse]);


  const SkeletonItem = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    return (
      <View style={styles.skeletonCard}>
        <View style={styles.featureContent}>
          <View style={styles.featureIconContainer}>
            <Animated.View style={[styles.skeletonCircle, { opacity }]} />
          </View>
          <View style={styles.textContainer}>
            <Animated.View style={[styles.skeletonBar, { opacity, width: '70%' }]} />
          </View>
        </View>
      </View>
    );
  };

  const SkeletonGrid = () => (
    <>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <SkeletonItem key={item} />
      ))}
    </>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      <StatusBar backgroundColor="#F87F16" barStyle="light-content" />

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
              <Text style={styles.title}>Q Bank</Text>
            </View>
          </View>
        </View>

        {/* 🔹 Subject Grid */}
        <View style={styles.featuresGrid}>
          {loading ? (
            <SkeletonGrid />
          ) : (
            subject?.map(sub => (
              <TouchableOpacity
                key={sub.id}
                style={styles.featureCard}
                onPress={() => {
                  if (isAMC) {
                    // 🔹 AMC → Chapterwise flow (New Flow)
                    navigation.navigate('Chapterwise', {
                      subjectId: sub.id,
                      subjectName: sub.name,
                      Course: selectedCourse,
                      isAMC: true,
                    });
                  } else {
                    // 🔹 All other courses → QBank flow
                    navigation.navigate('Chapterwise', {
                      subjectId: sub.id,
                      subjectName: sub.name,
                      Course: selectedCourse,
                    });
                  }
                }}
              >
                <View style={styles.featureContent}>
                  <View style={styles.featureIconContainer}>
                    {sub.icon_url ? (
                      <Image
                        source={{ uri: sub.icon_url }}
                        style={styles.subjectIcon}
                        resizeMode="contain"
                      />
                    ) : (
                      <Icon name="book" size={30} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.featureTitle}>{sub.name}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: scale(getResponsiveSize(20)),
    marginBottom: verticalScale(getResponsiveSize(30)),
  },
  featureCard: {
    width: (width - scale(getResponsiveSize(50))) / getGridColumns(),
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(16)),
    paddingHorizontal: scale(getResponsiveSize(15)),
    marginBottom: verticalScale(getResponsiveSize(20)),
    paddingVertical: verticalScale(getResponsiveSize(10)),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    minHeight: verticalScale(getResponsiveSize(80)),
  },
  skeletonCard: {
    width: (width - scale(getResponsiveSize(50))) / getGridColumns(),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(getResponsiveSize(16)),
    paddingHorizontal: scale(getResponsiveSize(15)),
    marginBottom: verticalScale(getResponsiveSize(20)),
    paddingVertical: verticalScale(getResponsiveSize(10)),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: verticalScale(getResponsiveSize(80)),
  },
  featureContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  featureIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // marginLeft: scale(getResponsiveSize(10)), // Removed gap
  },
  textContainer: {
    flex: 1,
    marginLeft: scale(getResponsiveSize(10)),
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: moderateScale(getResponsiveSize(13)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    // marginTop: '12%', // Removed margin top to align center
    includeFontPadding: false,
    // textAlign: 'center', // Changed to left for better layout with circle icon
  },
  upgradeButton: {
    alignSelf: 'center',
    borderRadius: scale(getResponsiveSize(50)),
    paddingVertical: verticalScale(getResponsiveSize(12)),
    paddingHorizontal: scale(getResponsiveSize(40)),
    marginBottom: verticalScale(getResponsiveSize(30)),
  },
  upgradeText: {
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    fontSize: moderateScale(getResponsiveSize(14)),
    textAlign: 'center',
    includeFontPadding: false,
  },
  skeletonCircle: {
    width: scale(getResponsiveSize(60)),
    height: scale(getResponsiveSize(60)),
    borderRadius: scale(getResponsiveSize(30)),
    backgroundColor: '#E0E0E0',
  },
  skeletonBar: {
    height: verticalScale(getResponsiveSize(20)),
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  subjectIcon: {
    width: scale(getResponsiveSize(80)),
    height: scale(getResponsiveSize(80)),
    borderRadius: scale(getResponsiveSize(80)), // Made circular
  },


});

export default Qbanksubject;