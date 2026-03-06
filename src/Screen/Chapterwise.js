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
import API from '../API/axiosConfig';

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
  const isAMC = route?.params?.isAMC || Course?.courseName?.toUpperCase().includes('AMC');
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  console.log("MODE RECEIVED IN CHAPTERWISE :", mood?.title);
  console.log("SUBJECT ID", subjectId);
  console.log("SUBJECT NAME", subjectName);


  // 🔹 Subject list removed (handled by API)


  const getChapterBySubject = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!subjectId) {
        console.log("SubjectId Missing");
        return;
      }

      const endpoint = isAMC ? '/amc/chapters' : '/chapters';
      const responae = await API.post(endpoint,
        {
          subject_id: subjectId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChapter(responae.data?.data || [])
      console.log("API RESPONSE CHAPTER", responae.data.data)
    } catch (error) {
      console.log("CHAPTER API ERROR", error.response?.data || error.message);
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
            Chapter.map(sub => {
              const isSelected = selectedChapterIds.includes(sub.id);
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[
                    styles.featureCard,
                    isAMC && isSelected && styles.featureCardSelected
                  ]}
                  onPress={() => {
                    if (isAMC) {
                      // 🔹 AMC → Multi-select toggle
                      if (isSelected) {
                        setSelectedChapterIds(prev => prev.filter(id => id !== sub.id));
                      } else {
                        setSelectedChapterIds(prev => [...prev, sub.id]);
                      }
                    } else {
                      // 🔹 Normal flow
                      if (mood) {
                        navigation.navigate('Selected', {
                          chapterId: sub.id,
                          ChapterName: sub.name,
                          mood: mood,
                        });
                      } else {
                        navigation.navigate('Mood', {
                          subjectId: sub.id,
                          subjectName: sub.name,
                          Course: Course,
                          from: 'mood',
                          chapterId: sub.id,
                          chapterName: sub.name,
                        });
                      }
                    }
                  }}>
                  <View style={styles.featureContent}>
                    <View style={styles.featureIconContainer}>
                      {isAMC && (
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && <Icon1 name="checkmark" size={12} color="white" />}
                        </View>
                      )}
                      {sub.icon_url ? (
                        <Image
                          source={{ uri: sub.icon_url }}
                          style={styles.subjectImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Icon name="book-open" size={22} color={isAMC && isSelected ? "#F87F16" : "#FFFFFF"} />
                      )}
                    </View>

                    <View style={styles.textContainer}>
                      <Text style={[styles.featureTitle, isAMC && isSelected && styles.featureTitleSelected]}>
                        {limitwords(sub.name, 15)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* 🔹 Proceed Button for AMC */}
        {isAMC && Chapter.length > 0 && (
          <TouchableOpacity
            style={[
              styles.proceedButton,
              selectedChapterIds.length === 0 && styles.disabledButton
            ]}
            disabled={selectedChapterIds.length === 0}
            onPress={() => {
              navigation.navigate('Mood', {
                subjectId,
                subjectName,
                Course,
                selectedChapterIds,
                from: 'amcChapters',
              });
            }}>
            <Text style={styles.proceedButtonText}>
              Select Mode ({selectedChapterIds.length} chosen)
            </Text>
            <Icon1 name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        )}

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
  featureCardSelected: {
    borderColor: '#F87F16',
    borderWidth: 2,
    backgroundColor: '#FFE0B2',
  },
  featureTitleSelected: {
    color: '#F87F16',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: scale(5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#F87F16',
    borderColor: '#F87F16',
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F87F16',
    marginHorizontal: scale(20),
    marginVertical: verticalScale(20),
    paddingVertical: verticalScale(15),
    borderRadius: moderateScale(12),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-Bold',
    marginRight: scale(10),
  },
});

export default Chapterwise;