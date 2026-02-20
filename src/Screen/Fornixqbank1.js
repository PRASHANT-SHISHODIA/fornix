// QBankQuestionScreen.js
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Screen dimensions
const { width, height } = Dimensions.get('window');

// 🔹 Responsive scaling
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// 🔹 Responsive size function based on screen width
const getResponsiveSize = (size) => {
  if (width < 375) { // Small phones
    return size * 0.85;
  } else if (width > 414) { // Large phones
    return size * 1.15;
  }
  return size; // Normal phones
};

// 🔹 Get responsive transform values for header
const getHeaderTransform = () => {
  if (width < 375) return 1.6; // Small phones
  if (width > 414) return 1.8; // Large phones
  return 1.7; // Normal phones
};

// 🔹 Get responsive search container transform
const getSearchTransform = () => {
  if (width < 375) return 0.62; // Small phones
  if (width > 414) return 0.55; // Large phones
  return 0.58; // Normal phones
};

const Fornixqbank1 = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // 🔹 Question state
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isPrevPressed, setIsPrevPressed] = useState(false);
  const [isNextPressed, setIsNextPressed] = useState(false);

  // 🔹 Sample question data
  const questionData = {
    question:
      ' Q8. Which chamber of the heart receives oxygenated blood from the lungs?',
    options: [
      { id: 'A', text: 'Right atrium' },
      { id: 'B', text: 'Left atrium' },
      { id: 'C', text: 'Right ventricle' },
      { id: 'D', text: 'Left ventricle' },
    ],
    correctAnswer: 'B',
  };

  const handleOptionSelect = optionId => {
    setSelectedOption(optionId);
  };

  const handlePrevious = () => {
    // Navigate to previous question
    setSelectedOption(null);
  };

  const handleNext = () => {
    navigation.navigate('Fornixqbank2');
    setSelectedOption(null);
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
              <Text style={styles.title}>Anatomy</Text>
            </View>
            <Text style={styles.sectionTitle1}>Fornix Q Bank</Text>
          </View>
        </View>

        {/* 🔹 Question Container */}
        <View style={styles.questionContainer}>
          {/* 🔹 Question Text */}
          <Text style={styles.questionText}>{questionData.question}</Text>

          {/* 🔹 Options */}
          <View style={styles.optionsContainer}>
            {questionData.options.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedOption === option.id && styles.optionSelected,
                ]}
                onPress={() => handleOptionSelect(option.id)}>
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.optionCircle,
                      selectedOption === option.id &&
                      styles.optionCircleSelected,
                    ]}>
                    <Text
                      style={[
                        styles.optionId,
                        selectedOption === option.id && styles.optionIdSelected,
                      ]}>
                      {option.id}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      selectedOption === option.id && styles.optionTextSelected,
                    ]}>
                    {option.text}
                  </Text>
                </View>
                {selectedOption === option.id && (
                  <Icon name="check" size={moderateScale(getResponsiveSize(16))} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* 🔹 Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[
                styles.navButton,
                isPrevPressed && styles.navButtonPressed,
              ]}
              onPress={handlePrevious}
              onPressIn={() => setIsPrevPressed(true)}
              onPressOut={() => setIsPrevPressed(false)}>
              <Text
                style={[
                  styles.navButtonText,
                  isPrevPressed && styles.navButtonTextPressed,
                ]}>
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                isNextPressed && styles.navButtonPressed,
              ]}
              onPress={handleNext}
              onPressIn={() => setIsNextPressed(true)}
              onPressOut={() => setIsNextPressed(false)}>
              <Text
                style={[
                  styles.navButtonText,
                  isNextPressed && styles.navButtonTextPressed,
                ]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
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
    fontSize: moderateScale(getResponsiveSize(25)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginBottom: verticalScale(getResponsiveSize(25)),
    includeFontPadding: false,
  },
  sectionTitle1: {
    fontSize: moderateScale(getResponsiveSize(15)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginTop: verticalScale(getResponsiveSize(-20)),
    includeFontPadding: false,
  },
  questionContainer: {
    marginHorizontal: scale(getResponsiveSize(20)),
    borderRadius: moderateScale(getResponsiveSize(16)),
    padding: scale(getResponsiveSize(20)),
    marginBottom: verticalScale(getResponsiveSize(30)),

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,

  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(15)),
  },
  questionNumber: {
    fontSize: moderateScale(getResponsiveSize(18)),
    fontFamily: 'Poppins-Bold',
    color: '#1A3848',
    includeFontPadding: false,
  },
  questionText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    lineHeight: moderateScale(getResponsiveSize(24)),
    marginBottom: verticalScale(getResponsiveSize(25)),
    includeFontPadding: false,
  },
  optionsContainer: {
    marginBottom: verticalScale(getResponsiveSize(30)),
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(10)),
    padding: scale(getResponsiveSize(15)),
    marginBottom: verticalScale(getResponsiveSize(12)),
    borderWidth: 1,
    borderColor: '#1A3848',
    minHeight: verticalScale(getResponsiveSize(60)),
  },
  optionSelected: {
    backgroundColor: '#F87F16',
    borderColor: '#F87F16',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionCircle: {
    width: scale(getResponsiveSize(30)),
    height: scale(getResponsiveSize(30)),
    borderRadius: scale(getResponsiveSize(15)),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(getResponsiveSize(12)),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionCircleSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionId: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  optionIdSelected: {
    color: 'white',
  },
  optionText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    flex: 1,
    includeFontPadding: false,
  },
  optionTextSelected: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(8)),
    paddingVertical: verticalScale(getResponsiveSize(12)),
    paddingHorizontal: scale(getResponsiveSize(25)),
    minWidth: scale(getResponsiveSize(120)),
    alignItems: 'center',
  },
  navButtonPressed: {
    backgroundColor: '#F87F16',
  },
  navButtonText: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  navButtonTextPressed: {
    color: '#FFFFFF',
  },
});

export default Fornixqbank1;