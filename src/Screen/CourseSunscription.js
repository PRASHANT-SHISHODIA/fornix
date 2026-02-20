import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import API from '../API/axiosConfig';

const RAZORPAY_KEY = 'rzp_live_SFWxjzUjAY5PC6'; // Replace with your actual key

const PlansScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width, height } = useWindowDimensions();

  console.log("--- CourseSunscription Component Rendered ---");
  console.log("Route Params:", JSON.stringify(route.params));

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [userData, setUserData] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Passed from BasicPlan or fallback to state
  const [selectedCourse, setSelectedCourse] = useState(route.params?.params?.course || null);

  // Responsive calculations
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await loadUserData();

    // If course not passed in params, try to get from storage
    if (!selectedCourse) {
      const storedCourse = await AsyncStorage.getItem('selectedCourse');
      if (storedCourse) {
        const parsed = JSON.parse(storedCourse);
        setSelectedCourse(parsed);
        fetchPlans(parsed); // Fetch plans with stored course
      } else {
        setLoading(false); // No course found
      }
    } else {
      fetchPlans(selectedCourse); // Fetch plans with passed course
    }
  };

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('user_data');
      if (data) {
        setUserData(JSON.parse(data));
      } else {
        // Fallback: Fetch from API
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("user_id");
        if (token && userId) {
          const response = await API.post(
            "/user/get",
            { id: userId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data?.success) {
            setUserData(response.data.user);
            await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
          }
        }
      }
    } catch (e) {
      console.log('Error loading user data:', e);
    }
  };

  const fetchPlans = async (courseToUse) => {
    const course = courseToUse || selectedCourse;
    const targetId = course?.courseId || course?.id;
    console.log("Selected Course Target ID:", course);
    if (!targetId) {
      console.log("No course ID found for fetching plans");
      setLoading(false);
      return;
    }

    try {
      // Fetch all courses to find the plans for the selected course
      const res = await API.get('/mobile/courses');
      if (res.data?.success) {
        console.log("=== COURSES API DATA ===", JSON.stringify(res.data.data, null, 2));
        // Handle both courseId (standard) and id (legacy/raw)
        let targetId = course.courseId || course.id;
        console.log("Initial Target ID:", targetId);

        // 🔹 HARDCODED FIX as per request: If course is AMC or targetId matches, confirm we get AMC plans
        // AMC ID from logs: cc613b33-3986-4d67-b33a-009b57a72dc8
        // Also check if course name contains "AMC"
        let currentCourse = res.data.data.find(c => c.id === targetId);

        if (!currentCourse || !currentCourse.plans || currentCourse.plans.length === 0) {
          console.log("Direct ID match failed or has no plans. Checking for 'AMC'...");
          // Fallback: If the user selected 'AMC' but ID mismatch/legacy issue, find AMC explicitly
          const amcCourse = res.data.data.find(c => c.name.includes("AMC") && c.plans.length > 0);
          if (amcCourse) {
            console.log("Found AMC course with plans via name/fallback:", amcCourse.id);
            currentCourse = amcCourse;
            targetId = amcCourse.id; // Update target ID for payment
            // Update selectedCourse state to match the one with plans
            setSelectedCourse(prev => ({ ...prev, courseId: amcCourse.id, courseName: amcCourse.name, id: amcCourse.id }));
          }
        }

        console.log("Final Course to Use:", currentCourse ? currentCourse.name : "None");

        if (currentCourse && currentCourse.plans) {
          console.log("Plans found:", currentCourse.plans.length);
          console.log("Plans Data:", JSON.stringify(currentCourse.plans, null, 2));
          const sortedPlans = currentCourse.plans.sort((a, b) => {
            // Prioritize 3 months (90 days) first
            if (a.duration_in_days === 90 && b.duration_in_days !== 90) return -1;
            if (b.duration_in_days === 90 && a.duration_in_days !== 90) return 1;
            // Otherwise sort by duration ascending
            return a.duration_in_days - b.duration_in_days;
          });
          setPlans(sortedPlans);
        } else {
          console.log("No plans found for course:", targetId);
        }
      }
    } catch (error) {
      console.log('API Error:', error);
      Alert.alert("Error", "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  const startRazorpayPayment = async (plan) => {
    if (!userData) {
      Alert.alert("Error", "User details not found. Please login again.");
      return;
    }

    setProcessingPayment(true);

    const options = {
      key: RAZORPAY_KEY,
      amount: Number(plan.discount_price) * 100, // Amount in paise
      currency: 'INR',
      name: 'Fornix Medical',
      description: `${selectedCourse.courseName} - ${plan.name}`,
      prefill: {
        email: userData.email,
        contact: userData.phone,
        name: userData.full_name,
      },
      theme: { color: '#F87F16' },
    };

    try {
      const paymentData = await RazorpayCheckout.open(options);
      console.log('Payment Success:', paymentData);
      await handlePaymentSuccess(paymentData, plan);
    } catch (error) {
      console.log('Payment Failed:', error);
      Alert.alert('Payment Cancelled', 'Payment was not completed');
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentData, plan) => {
    try {
      const payload = {
        user_id: userData.id,
        course_id: selectedCourse.courseId,
        plan_id: plan.id,
        amount: plan.discount_price,
        tax_amount: 0,
        transaction_mode: 'upi',
        transaction_id: paymentData.razorpay_payment_id,
        transaction_status: 'success',
        payment_date: new Date().toISOString(),
        start_date: new Date().toISOString(),
      };

      const res = await API.post('/mobile/enroll', payload);

      if (res.data?.success) {
        // Update selected course in storage to reflect paid status
        const updatedCourseData = {
          ...selectedCourse,
          planId: plan.id,
          planName: plan.name,
          planPrice: plan.discount_price,
          paymentStatus: 'paid',
          enrolledAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem('selectedCourse', JSON.stringify(updatedCourseData));

        Alert.alert('Success', 'Enrollment successful 🎉', [
          {
            text: 'OK',
            onPress: () => navigation.replace('TabNavigation'),
          },
        ]);
      } else {
        Alert.alert('Error', res.data?.message || 'Enrollment failed.');
      }

    } catch (error) {
      console.log('Enrollment API Error:', error);
      Alert.alert('Error', 'Payment successful but enrollment failed. Contact support.');
    } finally {
      setProcessingPayment(false);
    }
  }

  const renderPlan = ({ item }) => (
    <PlanCard
      plan={item}
      isTablet={isTablet}
      isLandscape={isLandscape}
      screenWidth={width}
      onBuyPress={() => startRazorpayPayment(item)}
    />
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A3848" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[
        styles.heading,
        isTablet && styles.headingTablet,
        isSmallPhone && styles.headingSmall
      ]}>
        Choose Your Plan
      </Text>

      <FlatList
        data={plans}
        keyExtractor={item => item.id}
        renderItem={renderPlan}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          isLandscape && styles.listContentLandscape,
          isTablet && styles.listContentTablet
        ]}
        numColumns={isLandscape || isTablet ? 2 : 1}
        key={isLandscape || isTablet ? 'two-column' : 'one-column'}
      />

      {/* Progress Modal */}
      <Modal
        visible={processingPayment}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F87F16" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      </Modal>

    </View>
  );
};

/* ================= PLAN CARD ================= */

const PlanCard = ({ plan, isTablet, isLandscape, screenWidth, onBuyPress }) => {
  // Dynamic card width calculation
  const cardWidth = useMemo(() => {
    if (isLandscape) {
      return screenWidth * 0.45;
    }
    if (isTablet) {
      return screenWidth * 0.8;
    }
    return screenWidth * 0.9;
  }, [isLandscape, isTablet, screenWidth]);

  const isSmallPhone = screenWidth < 375;

  return (
    <View style={[
      styles.card,
      { width: cardWidth },
      (isLandscape || isTablet) && styles.cardMultiColumn,
      plan.popular && styles.popularCard
    ]}>

      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}

      <Text style={[
        styles.planName,
        isTablet && styles.planNameTablet,
        isSmallPhone && styles.planNameSmall
      ]}>
        {plan.name}
      </Text>

      <Text style={[
        styles.duration,
        isSmallPhone && styles.durationSmall
      ]}>
        {plan.duration_in_days} Days Access
      </Text>

      {/* PRICE */}
      <View style={styles.priceRow}>
        <Text style={[
          styles.discountPrice,
          isTablet && styles.discountPriceTablet,
          isSmallPhone && styles.discountPriceSmall
        ]}>
          ₹{plan.discount_price}
        </Text>
        <Text style={[
          styles.originalPrice,
          isSmallPhone && styles.originalPriceSmall
        ]}>
          ₹{plan.original_price}
        </Text>
      </View>

      {/* FEATURES */}
      <View style={styles.features}>
        {plan.features_list && plan.features_list.length > 0 ? (
          plan.features_list.map((featureText, index) => (
            <Feature key={index} icon="check-circle" text={featureText} isSmallPhone={isSmallPhone} />
          ))
        ) : (
          <>
            {plan.access_features?.notes && <Feature icon="sticky-note" text="Notes" isSmallPhone={isSmallPhone} />}
            {plan.access_features?.tests && <Feature icon="clipboard-check" text="Tests" isSmallPhone={isSmallPhone} />}
            {plan.access_features?.videos && <Feature icon="video" text="Videos" isSmallPhone={isSmallPhone} />}
            {plan.access_features?.ai_explanation && (
              <Feature icon="robot" text="AI Explanation" isSmallPhone={isSmallPhone} />
            )}
          </>
        )}
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        style={[
          styles.buyBtn,
          isTablet && styles.buyBtnTablet
        ]}
        onPress={onBuyPress}
      >
        <Text style={[
          styles.buyText,
          isTablet && styles.buyTextTablet
        ]}>
          Buy Now
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const Feature = ({ icon, text, isSmallPhone }) => (
  <View style={styles.featureItem}>
    <Icon name={icon} size={isSmallPhone ? 12 : 14} color="#4CAF50" />
    <Text style={[
      styles.featureText,
      isSmallPhone && styles.featureTextSmall
    ]}>
      {text}
    </Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3848',
    textAlign: 'center',
    marginBottom: 10,
  },
  headingTablet: {
    fontSize: 28,
    marginBottom: 20,
  },
  headingSmall: {
    fontSize: 20,
  },
  listContent: {
    paddingBottom: 30,
    paddingHorizontal: 10,
  },
  listContentLandscape: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentTablet: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    alignSelf: 'center',
    marginVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 280,
  },
  cardMultiColumn: {
    marginHorizontal: 10,
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3848',
  },
  planNameTablet: {
    fontSize: 22,
  },
  planNameSmall: {
    fontSize: 16,
  },
  duration: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  durationSmall: {
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  discountPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E53935',
    marginRight: 10,
  },
  discountPriceTablet: {
    fontSize: 28,
  },
  discountPriceSmall: {
    fontSize: 20,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  originalPriceSmall: {
    fontSize: 12,
  },
  features: {
    marginTop: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#333',
  },
  featureTextSmall: {
    fontSize: 12,
    marginLeft: 6,
  },
  buyBtn: {
    backgroundColor: '#1A3848',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  buyBtnTablet: {
    paddingVertical: 16,
  },
  buyText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  buyTextTablet: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1A3848',
    fontWeight: '600',
  },
});

export default PlansScreen;
