// Chapterwise.js
import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Screen dimensions
const { width, height } = Dimensions.get('window');

// 🔹 Responsive scaling
import {
  scale,
  verticalScale,
  moderateScale,
  getResponsiveSize,
  getGridColumns,
  getHeaderTransform,
  getSearchTransform,
} from '../Utils/ResponsiveUtils';

const Chapterwise = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [Chapter, setChapter] = useState([])
  const [loading, setLoading] = useState(true)
  // const route = useRoute();
  const { subjectId, subjectName } = route.params || {};
  const bookAnim = useRef(new Animated.Value(0)).current;
  const mood = route?.params?.mood ?? null;
  const Course = route?.params?.Course ?? null;
  console.log("MODE RECEIVED IN CHAPTERWISE :", mood?.title);
  console.log("SUBJECT ID", subjectId);
  console.log("SUBJECT NAME", subjectName);


  // 🔹 Subject list from PDF with images
  const subjects = [
    { id: '1', title: 'Upper Limb', image: require('../assets/Images/Upperlimb.png') },
    { id: '2', title: 'General Anatomy', image: require('../assets/Images/Generalanatony.png') },
    { id: '3', title: 'Thorax', image: require('../assets/Images/Thorax.png') },
    { id: '4', title: 'Head & Neck', image: require('../assets/Images/Head&neck.png') },
    { id: '5', title: 'Neuroanatomy', image: require('../assets/Images/Neuroanatony.png') },
    { id: '6', title: 'Lower Limb', image: require('../assets/Images/Lowerlimb.png') },
  ];

  const getChapterBySubject = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!subjectId) {
        console.log("SubjectId Missing");
        return;
      }

      const responae = await axios.post('https://fornix-medical.vercel.app/api/v1/chapters',
        {
          subject_id: subjectId || "f36e020a-5ffb-4df9-976a-b289797d8627",
          mood: mood,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setChapter(responae.data?.data)
      console.log("API RESPONSE CHAPTER", responae.data.data)
    } catch (error) {
      console.log("CHAPTER API ERROR", error.responae.data || error.message);
    } finally {
      setLoading(false);
    }
  };
  console.log(Chapter)

  useEffect(() => {
    getChapterBySubject();
  }, []);

  const limitwords = (text, maxWords = 15) => {
    if (!text) return '';
    const words = text.split('');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join('') + '...';
  };

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
              <Text style={styles.title}>{subjectName}</Text>
            </View>
            {/* <Text style={styles.sectionTitle}>Chapter Wise</Text> */}
          </View>
        </View>

        {/* 🔹 Subject Grid */}
        <View style={styles.featuresGrid}>
          {loading ? (
            <SkeletonGrid />
          ) : (
            Chapter.map(sub => (
              <TouchableOpacity
                key={sub.id}
                style={styles.featureCard}
                onPress={() => {
                  if (mood) {
                    navigation.navigate('Selected', {
                      chapterId: sub.id,
                      ChapterName: sub.name,
                      mood: mood,

                    });
                  } else {
                    // navigation.navigate('Selected', {
                    //   chapterId: sub.id,
                    //   ChapterName: sub.name,
                    //   // mood:mood,
                    // });
                    navigation.navigate('Mood', {
                      subjectId: sub.id,
                      subjectName: sub.name,
                      Course: Course,
                      from: 'mood',
                    });
                  }
                }

                }>
                <View style={styles.featureContent}>
                  <View style={styles.featureIconContainer}>
                    {sub.icon_url ? (
                      <Image
                        source={{ uri: sub.icon_url }}
                        style={styles.subjectImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Icon name="book-open" size={22} color="#1A3848" />
                    )}
                  </View>

                  <View style={styles.textContainer}>
                    <Text style={styles.featureTitle}>
                      {limitwords(sub.name, 15)}
                    </Text>
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
    height: verticalScale(getResponsiveSize(100))
  },
  sectionTitle: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Medium',
    color: 'white',
    marginTop: verticalScale(getResponsiveSize(-20)),
    textAlign: 'center',
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
  },
  subjectImage: {
    width: scale(getResponsiveSize(60)),
    height: scale(getResponsiveSize(60)),
    borderRadius: scale(getResponsiveSize(30)),
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
    textAlign: 'left',
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

});

export default Chapterwise;