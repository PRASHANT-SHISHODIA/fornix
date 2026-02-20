import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

/* 🔹 Responsive helpers */
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const getResponsiveSize = size => {
  if (width < 375) return size * 0.85;
  if (width > 414) return size * 1.15;
  return size;
};

const getHeaderTransform = () => {
  if (width < 375) return 1.5;
  if (width > 414) return 1.7;
  return 1.6;
};

/* Course Data with more details */
const CourseData = [
  {
    id: 1,
    title: 'NEET UG',
    subtitle: 'Medical Entrance',
    icon: 'stethoscope',
    color: '#4CAF50',
    monthly: '$49/month',
    yearly: '$299/year',
    savings: 'Save 49%',
    features: [
      'Complete NEET Syllabus',
      '1000+ Video Lectures',
      '50,000+ Practice Questions',
      'Daily Live Sessions',
      'Mock Test Series'
    ]
  },
  {
    id: 2,
    title: 'NEET PG',
    subtitle: 'Post Graduate Medical',
    icon: 'user-md',
    color: '#2196F3',
    monthly: '$49/month',
    yearly: '$199/year',
    savings: 'Save 66%',
    features: [
      'Comprehensive PG Syllabus',
      'Case-Based Learning',
      'Previous Year Papers',
      'Interactive Quizzes',
      'Expert Guidance'
    ]
  },
  {
    id: 3,
    title: 'AMC',
    subtitle: 'Australian Medical Council',
    icon: 'globe-asia',
    color: '#FF9800',
    monthly: '$79/month',
    yearly: '$299/year',
    savings: 'Save 68%',
    features: [
      'AMC Part 1 & 2',
      'Clinical Exam Prep',
      'OSCE Practice',
      'Interview Preparation',
      'Australian Guidelines'
    ]
  },
  {
    id: 4,
    title: 'FMGE/NExT',
    subtitle: 'Foreign Medical Graduates',
    icon: 'graduation-cap',
    color: '#9C27B0',
    monthly: '$149/month',
    yearly: '$299/year',
    savings: 'Save 83%',
    features: [
      'NBE Pattern Questions',
      'Medical Screening Test',
      'Clinical Skill Assessment',
      'Indian Medical Syllabus',
      'License Exam Prep'
    ]
  },
];

const Course = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState({});

  const handleSelect = (courseId, planType) => {
    setSelectedPlan(prev => ({
      ...prev,
      [courseId]: planType,
    }));
  };

  const renderPlanCard = (item, planType) => {
    const isSelected = selectedPlan[item.id] === planType;
    const isMonthly = planType === 'monthly';

    return (
      <TouchableOpacity
        onPress={() => handleSelect(item.id, planType)}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          isMonthly ? styles.monthlyCard : styles.yearlyCard
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.planHeader}>
          <View>
            <Text style={[
              styles.planTitle,
              isSelected && styles.planTitleSelected
            ]}>
              {isMonthly ? 'Monthly Plan' : 'Yearly Plan'}
            </Text>
            <Text style={[
              styles.planPrice,
              isSelected && styles.planPriceSelected
            ]}>
              {isMonthly ? item.monthly : item.yearly}
            </Text>
          </View>

          <View style={[
            styles.selectionIndicator,
            isSelected ? styles.selectedIndicator : styles.unselectedIndicator
          ]}>
            {isSelected && (
              <Icon name="check" size={14} color="white" />
            )}
          </View>
        </View>

        {!isMonthly && (
          <View style={styles.savingsBadge}>
            <Icon name="crown" size={12} color="#FFD700" />
            <Text style={styles.savingsText}>{item.savings}</Text>
          </View>
        )}

        <View style={styles.planFeatures}>
          {isMonthly ? (
            <>
              <Text style={styles.featureText}>• Full Course Access</Text>
              <Text style={styles.featureText}>• Live Classes</Text>
              <Text style={styles.featureText}>• Practice Tests</Text>
            </>
          ) : (
            <>
              <Text style={styles.featureText}>• Everything in Monthly</Text>
              <Text style={styles.featureText}>• Priority Support</Text>
              <Text style={styles.featureText}>• Additional Resources</Text>
              <Text style={styles.featureText}>• Certificate of Completion</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header Section */}
      <LinearGradient
        colors={['#F87F16', '#FF9800']}
        style={[
          styles.header,
          {
            height: verticalScale(getResponsiveSize(180)),
            borderBottomLeftRadius: scale(300),
            borderBottomRightRadius: scale(300),
            transform: [{ scaleX: getHeaderTransform() }],
          }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="white" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Choose Your Course</Text>
            <Text style={styles.headerSubtitle}>Select a plan that fits your goals</Text>
          </View>

          <View style={styles.helpButton}>
            <Icon name="question-circle" size={20} color="white" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon name="gem" size={20} color="#F87F16" />
          <Text style={styles.infoText}>
            <Text style={styles.infoHighlight}>Most Popular:</Text> Yearly plans include extra benefits
          </Text>
        </View>

        {/* Courses List */}
        {CourseData.map((item) => {
          const bgAnim = useRef(new Animated.Value(0)).current;

          const animatedBg = bgAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['#000', '#F87F16'],
          });

          const onPressIn = () => {
            Animated.timing(bgAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }).start();
          };

          const onPressOut = () => {
            Animated.timing(bgAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start();
          };

          return (
            <View key={item.id} style={styles.courseCard}>
              {/* Course Header */}
              <View style={styles.courseHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Icon name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.courseTitleContainer}>
                  <Text style={styles.courseTitle}>{item.title}</Text>
                  <Text style={styles.courseSubtitle}>{item.subtitle}</Text>
                </View>
              </View>

              {/* Feature Tags */}
              <View style={styles.featureTags}>
                {item.features.slice(0, 3).map((feature, index) => (
                  <View key={index} style={styles.tag}>
                    <Icon name="check-circle" size={12} color="#4CAF50" />
                    <Text style={styles.tagText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Plan Selection */}
              <View style={styles.plansContainer}>
                <View style={styles.plansRow}>
                  {renderPlanCard(item, 'monthly')}
                  {renderPlanCard(item, 'yearly')}
                </View>
              </View>

              {/* CTA Button */}
              <Animated.View style={[styles.buttonContainer, { backgroundColor: animatedBg }]}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  onPress={() => {
                    const planType = selectedPlan[item.id];
                    if (!planType) {
                      Alert.alert(
                        'Select Plan',
                        'Please choose a monthly or yearly plan first.',
                        [{ text: 'OK' }]
                      );
                      return;
                    }
                    const price = planType === 'monthly' ? item.monthly : item.yearly;
                    navigation.navigate('Review', {
                      courseName: item.title,
                      subtitle: item.subtitle,
                      price: price,
                      planType: planType,
                      icon: item.icon,
                      color: item.color,
                      features: item.features
                    });
                  }}
                  style={styles.touchArea}
                >
                  <View style={styles.buttonContent}>
                    <Icon name="arrow-right" size={16} color="white" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>
                      Continue with {selectedPlan[item.id] === 'monthly' ? 'Monthly' : 'Yearly'} Plan
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          );
        })}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqItem}>
            <Icon name="question-circle" size={16} color="#F87F16" />
            <Text style={styles.faqQuestion}>Can I switch plans later?</Text>
          </View>
          <Text style={styles.faqAnswer}>Yes, you can upgrade or downgrade at any time.</Text>

          <View style={styles.faqItem}>
            <Icon name="question-circle" size={16} color="#F87F16" />
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
          </View>
          <Text style={styles.faqAnswer}>7-day free trial available for all yearly plans.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Course;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: scale(getResponsiveSize(16)),
    paddingBottom: verticalScale(40),
  },
  header: {
    paddingHorizontal: scale(getResponsiveSize(20)),
    paddingBottom: verticalScale(20),
    marginBottom: verticalScale(30),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(40),
    transform: [{ scaleX: 0.8 }],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 25,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: moderateScale(getResponsiveSize(18)),
    fontFamily: 'Poppins-Bold',
    color: 'white',
    textAlign: 'center',
    includeFontPadding: false,
  },
  headerSubtitle: {
    fontSize: moderateScale(getResponsiveSize(10)),
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
    includeFontPadding: false,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 25,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 127, 22, 0.1)',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: 'rgba(248, 127, 22, 0.2)',
  },
  infoText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginLeft: 10,
    flex: 1,
    includeFontPadding: false,
  },
  infoHighlight: {
    fontFamily: 'Poppins-SemiBold',
    color: '#F87F16',
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  iconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(15),
  },
  courseTitleContainer: {
    flex: 1,
  },
  courseTitle: {
    fontSize: moderateScale(getResponsiveSize(20)),
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    includeFontPadding: false,
  },
  courseSubtitle: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginTop: 2,
    includeFontPadding: false,
  },
  featureTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: verticalScale(15),
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
  },
  tagText: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Medium',
    color: '#4CAF50',
    marginLeft: 4,
    includeFontPadding: false,
  },
  plansContainer: {
    marginVertical: verticalScale(15),
  },
  plansRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  planCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  monthlyCard: {
    borderColor: '#E9ECEF',
  },
  yearlyCard: {
    borderColor: '#FFD700',
  },
  planCardSelected: {
    borderColor: '#F87F16',
    backgroundColor: 'rgba(248, 127, 22, 0.05)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(10),
  },
  planTitle: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-SemiBold',
    color: '#666',
    includeFontPadding: false,
  },
  planTitleSelected: {
    color: '#F87F16',
  },
  planPrice: {
    fontSize: moderateScale(getResponsiveSize(20)),
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    marginTop: 4,
    includeFontPadding: false,
  },
  planPriceSelected: {
    color: '#F87F16',
  },
  selectionIndicator: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  selectedIndicator: {
    backgroundColor: '#F87F16',
    borderColor: '#F87F16',
  },
  unselectedIndicator: {
    backgroundColor: 'transparent',
    borderColor: '#CED4DA',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(20),
    alignSelf: 'flex-start',
    marginBottom: verticalScale(10),
  },
  savingsText: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-SemiBold',
    color: '#B8860B',
    marginLeft: 4,
    includeFontPadding: false,
  },
  planFeatures: {
    marginTop: verticalScale(8),
  },
  featureText: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 4,
    includeFontPadding: false,
  },
  buttonContainer: {
    borderRadius: moderateScale(25),
    overflow: 'hidden',
    marginTop: verticalScale(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  touchArea: {
    paddingVertical: verticalScale(14),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: moderateScale(10),
  },
  buttonText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    includeFontPadding: false,
  },
  faqSection: {
    backgroundColor: 'white',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginTop: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  faqTitle: {
    fontSize: moderateScale(getResponsiveSize(18)),
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    marginBottom: verticalScale(15),
    includeFontPadding: false,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(5),
  },
  faqQuestion: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginLeft: 8,
    includeFontPadding: false,
  },
  faqAnswer: {
    fontSize: moderateScale(getResponsiveSize(13)),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: verticalScale(15),
    paddingLeft: moderateScale(24),
    includeFontPadding: false,
  },
});