import React, { useState, useEffect, useMemo, use } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Image,
  Modal,
  FlatList,
  Alert,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../API/axiosConfig';
import { Controller, set, useForm } from 'react-hook-form';
import RazorpayCheckout from 'react-native-razorpay';




const { width } = Dimensions.get('window');

const API_URL = 'https://fornix-medical.vercel.app/api/v1/mobile/courses';
const RAZORPAY_KEY = 'rzp_test_4U2LJWfsmsYINp';

// Original country data (for phone codes only)
const countries = [
  {
    code: 'US',
    name: 'United States',
    dial_code: '+1',
    flag: 'https://flagcdn.com/w320/us.png',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dial_code: '+44',
    flag: 'https://flagcdn.com/w320/gb.png',
  },
  {
    code: 'IN',
    name: 'India',
    dial_code: '+91',
    flag: 'https://flagcdn.com/w320/in.png',
  },
  {
    code: 'CA',
    name: 'Canada',
    dial_code: '+1',
    flag: 'https://flagcdn.com/w320/ca.png',
  },
  {
    code: 'AU',
    name: 'Australia',
    dial_code: '+61',
    flag: 'https://flagcdn.com/w320/au.png',
  },
  {
    code: 'DE',
    name: 'Germany',
    dial_code: '+49',
    flag: 'https://flagcdn.com/w320/de.png',
  },
  {
    code: 'FR',
    name: 'France',
    dial_code: '+33',
    flag: 'https://flagcdn.com/w320/fr.png',
  },
  {
    code: 'JP',
    name: 'Japan',
    dial_code: '+81',
    flag: 'https://flagcdn.com/w320/jp.png',
  },
  {
    code: 'CN',
    name: 'China',
    dial_code: '+86',
    flag: 'https://flagcdn.com/w320/cn.png',
  },
  {
    code: 'BR',
    name: 'Brazil',
    dial_code: '+55',
    flag: 'https://flagcdn.com/w320/br.png',
  },
  {
    code: 'MX',
    name: 'Mexico',
    dial_code: '+52',
    flag: 'https://flagcdn.com/w320/mx.png',
  },
  {
    code: 'RU',
    name: 'Russia',
    dial_code: '+7',
    flag: 'https://flagcdn.com/w320/ru.png',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    dial_code: '+27',
    flag: 'https://flagcdn.com/w320/za.png',
  },
  {
    code: 'NG',
    name: 'Nigeria',
    dial_code: '+234',
    flag: 'https://flagcdn.com/w320/ng.png',
  },
  {
    code: 'KR',
    name: 'South Korea',
    dial_code: '+82',
    flag: 'https://flagcdn.com/w320/kr.png',
  },
  {
    code: 'SG',
    name: 'Singapore',
    dial_code: '+65',
    flag: 'https://flagcdn.com/w320/sg.png',
  },
  {
    code: 'AE',
    name: 'UAE',
    dial_code: '+971',
    flag: 'https://flagcdn.com/w320/ae.png',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dial_code: '+966',
    flag: 'https://flagcdn.com/w320/sa.png',
  },
  {
    code: 'IT',
    name: 'Italy',
    dial_code: '+39',
    flag: 'https://flagcdn.com/w320/it.png',
  },
  {
    code: 'ES',
    name: 'Spain',
    dial_code: '+34',
    flag: 'https://flagcdn.com/w320/es.png',
  },
];

const Signupdetail = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  // States for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // New fields
  const [dob, setDob] = useState('');
  const [institute, setInstitute] = useState('');
  const [qualification, setQualification] = useState('');
  const [gender, setGender] = useState('');

  // Validation state
  const [errorFields, setErrorFields] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
    name: false,
    dob: false,
    institute: false,
    qualification: false,
    gender: false,
    qualifiedCountry: false,
    course: false,
  });

  const [errorMessages, setErrorMessages] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    name: '',
    dob: '',
    institute: '',
    qualification: '',
    gender: '',
    qualifiedCountry: '',
    course: '',
  });

  // Dropdown States
  const [selectedCountry, setSelectedCountry] = useState(
    countries && countries.length > 2 ? countries[2] : countries[0] || {}
  );
  const [isCountryCodeDropdownVisible, setCountryCodeDropdownVisible] = useState(false);

  // New states for qualified countries and colleges
  const [qualifiedCountries, setQualifiedCountries] = useState([]);
  const [selectedQualifiedCountry, setSelectedQualifiedCountry] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [isQualifiedCountryModalVisible, setQualifiedCountryModalVisible] = useState(false);
  const [isCollegeModalVisible, setCollegeModalVisible] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [user, setUser] = useState(null);

  // Courses
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCourseModalVisible, setCourseModalVisible] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Validation regex patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  const nameRegex = /^[A-Za-z\s]{2,50}$/;
  const phoneRegex = /^[0-9]{7,15}$/;
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  const qualificationRegex = /^[A-Za-z0-9\s.,-]{2,100}$/;
  const { handleSubmit, register, control, getValues, clearErrors, setError, setValue, formState: { errors } } = useForm({
    defaultValues: {

      "name": null,
      "email": null,
      "password": null,
      "country": null,
      "country_id": null,
      "college_name": null,
      "gender": null,
      "mobile": null,
      "payment_id": null,
      "course_id": null,
      "plan_id": null,
      "amount": null,
      "transaction_mode": null,
      "transaction_status": null,
      "payment_date": null


    }
  })

  const [nextPage, setNextPage] = useState(false)

  const getUSer = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        const res = await API.post("/user/get", { id: userId });
        if (res.data.success) {
          setUser(res.data)
        }
      }
    }
    catch (e) { console.log("Get user error", e) }
  }
  console.log("user from storage", user)

  useEffect(() => {
    const direct = route?.params?.params?.direct;
    if (direct) {
      getUSer()
      setNextPage(true)
    } else {
      setNextPage(false)
    }
  }, [])

  // Gender Options
  const genderOptions = ['Male', 'Female', 'Other'];

  // Fetch qualified countries on component mount
  useEffect(() => {
    fetchQualifiedCountries();
    fetchCourses();
  }, [])
  const [plans, setPlans] = useState([]);
  const { width, height } = useWindowDimensions();

  // Responsive calculations
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  // Removed hardcoded fetchPlans for AMC
  // Plans will now be set when a course is selected

  const handleStartFree = async () => {
    try {
      // 🔴 validation
      if (!selectedCourse) {
        Alert.alert("Required", "Please select a course first");
        return;
      }

      setLoading(true);

      const payload = {
        name: getValues("name"),
        email: getValues("email"),
        password: getValues("password"),
        country: getValues("country"),
        country_id: getValues("country_id"),
        college_name: getValues("college_name"),
        gender: getValues("gender"),
        mobile: getValues("mobile"),
        course_id: selectedCourse.id,
      };

      console.log("FREE REGISTER PAYLOAD 👉", payload);

      const response = await API.post(
        "/auth/register-free",
        payload
      );

      console.log("FREE REGISTER RESPONSE 👉", response.data);

      if (response.data.success) {
        // ✅ user data save
        await AsyncStorage.setItem(
          "user_data",
          JSON.stringify(response.data.user)
        );

        await AsyncStorage.setItem(
          "enrolled_course",
          JSON.stringify(response.data.enrolled_course)
        );

        Alert.alert("Success 🎉", response.data.message, [
          {
            text: "OK",
            onPress: () => navigation.replace("Logindetail"),
          },
        ]);
      }
    } catch (error) {
      console.log("FREE REGISTER ERROR ❌", error.response?.data || error);
      const errorData = error.response?.data;
      const errorMsg = errorData?.error || errorData?.message || "Something went wrong";
      Alert.alert(
        "Error",
        errorMsg
      );
    } finally {
      setLoading(false);
    }
  };


  const renderPlan = ({ item }) => (
    <PlanCard
      plan={item}
      data={{ name: getValues("name") ?? user?.user?.full_name, mobile: getValues("mobile") ?? user?.user?.phone, email: getValues("email") ?? user?.user?.email, country: getValues("country") ?? "India", country_id: getValues('country_id') ?? "3856a7e7-0b14-4e88-a729-bb2bc1913d8d", gender: getValues("gender") ?? user?.user?.gender, password: getValues('password'), college_name: getValues("college_name"), courses: selectedCourse }}
      isTablet={isTablet}
      isLandscape={isLandscape}
      screenWidth={width}
    />
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A3848" />
      </View>
    );
  }

  const fetchQualifiedCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await API.get('/mobile/countries');

      if (response.data.success) {
        setQualifiedCountries(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching qualified countries:', error);
      Alert.alert('Error', 'Failed to fetch countries list');
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await API.get(
        '/mobile/courses'
      );

      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (error) {
      console.log('Course API error:', error);
      Alert.alert('Error', 'Unable to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Toggle Password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Toggle Country Code Dropdown
  const toggleCountryCodeDropdown = () => {
    setCountryCodeDropdownVisible(!isCountryCodeDropdownVisible);
  };

  // Select Country for phone code
  const selectCountryForPhone = country => {
    if (country) {
      setSelectedCountry(country);
      setCountryCodeDropdownVisible(false);
    }
  };

  const handleCourseSelect = async (course) => {
    setValue("course_id", course.id)
    setSelectedCourse(course)

    // Set plans from the selected course
    if (course.plans) {
      const sortedPlans = course.plans.sort(
        (a, b) => a.priority_order - b.priority_order
      );
      setPlans(sortedPlans);
    } else {
      setPlans([]);
    }

    setCourseModalVisible(false);
    setErrorFields(prev => ({ ...prev, course: false }));
    setErrorMessages(prev => ({ ...prev, course: '' }));

    // ✅ AsyncStorage me save
    await AsyncStorage.setItem(
      'selectedCourse', // Fixed key from 'selected_course'
      JSON.stringify({
        courseId: course.id, // Fixed property: courseId instead of id
        courseName: course.name, // Fixed property: courseName instead of name
      })
    );
  };

  // Select Gender
  const selectGender = (selectedGender) => {
    setGender(selectedGender);
    setErrorFields(prev => ({ ...prev, gender: false }));
    setErrorMessages(prev => ({ ...prev, gender: '' }));
  };

  // Handle qualified country selection
  const handleQualifiedCountrySelect = (country) => {
    setValue("country", country.name)
    setValue("country_id", country.id)
    setSelectedQualifiedCountry(country)
    setSelectedCollege(null);
    setInstitute('');
    setQualifiedCountryModalVisible(false);
    setErrorFields(prev => ({ ...prev, qualifiedCountry: false }));
    setErrorMessages(prev => ({ ...prev, qualifiedCountry: '' }));

    // Auto-open college modal if country has colleges
    if (country.colleges && country.colleges.length > 0) {
      setCollegeModalVisible(true);
    }
  };

  // Handle college selection
  const handleCollegeSelect = (college) => {
    setSelectedCollege(college);
    setValue("college_name", college.name)
    setCollegeModalVisible(false);
    setErrorFields(prev => ({ ...prev, institute: false }));
    setErrorMessages(prev => ({ ...prev, institute: '' }));
  };

  const saveUserData = async (user) => {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      console.log('User data saved successfully');
    } catch (error) {
      console.log("Error saving user data:", error);
    }
  };

  // Validation functions


  const validateEmail = (text) => {
    setEmail(text);
    if (!text.trim()) {
      setErrorFields(prev => ({ ...prev, email: true }));
      setErrorMessages(prev => ({ ...prev, email: 'Email is required' }));
    } else if (!emailRegex.test(text)) {
      setErrorFields(prev => ({ ...prev, email: true }));
      setErrorMessages(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrorFields(prev => ({ ...prev, email: false }));
      setErrorMessages(prev => ({ ...prev, email: '' }));
    }
  };

  const validatePassword = (text) => {
    setPassword(text);
    if (!text.trim()) {
      setErrorFields(prev => ({ ...prev, password: true }));
      setErrorMessages(prev => ({ ...prev, password: 'Password is required' }));
    } else if (!passwordRegex.test(text)) {
      setErrorFields(prev => ({ ...prev, password: true }));
      setErrorMessages(prev => ({ ...prev, password: 'Password must have at least 6 characters, 1 uppercase letter and 1 digit' }));
    } else {
      setErrorFields(prev => ({ ...prev, password: false }));
      setErrorMessages(prev => ({ ...prev, password: '' }));
    }
  };

  const validateConfirmPassword = (text) => {
    setConfirmPassword(text);
    if (!text.trim()) {
      setErrorFields(prev => ({ ...prev, confirmPassword: true }));
      setErrorMessages(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
    } else if (text !== getValues("password")) {
      setErrorFields(prev => ({ ...prev, confirmPassword: true }));
      setErrorMessages(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setErrorFields(prev => ({ ...prev, confirmPassword: false }));
      setErrorMessages(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const validatePhone = (text) => {
    setPhoneNumber(text);
    if (!text.trim()) {
      setErrorFields(prev => ({ ...prev, phone: true }));
      setErrorMessages(prev => ({ ...prev, phone: 'Phone number is required' }));
    } else if (!phoneRegex.test(text)) {
      setErrorFields(prev => ({ ...prev, phone: true }));
      setErrorMessages(prev => ({ ...prev, phone: 'Phone number must be 7-15 digits' }));
    } else {
      setErrorFields(prev => ({ ...prev, phone: false }));
      setErrorMessages(prev => ({ ...prev, phone: '' }));
    }
  };



  const validateQualification = (text) => {
    setQualification(text);
    if (!text.trim()) {
      setErrorFields(prev => ({ ...prev, qualification: true }));
      setErrorMessages(prev => ({ ...prev, qualification: 'Qualification is required' }));
    } else if (!qualificationRegex.test(text)) {
      setErrorFields(prev => ({ ...prev, qualification: true }));
      setErrorMessages(prev => ({ ...prev, qualification: 'Qualification must be 2-100 characters' }));
    } else {
      setErrorFields(prev => ({ ...prev, qualification: false }));
      setErrorMessages(prev => ({ ...prev, qualification: '' }));
    }
  };

  // Handle Submit
  const handleNext = async (data) => {
    console.log("errorororor", errors)
    if (Object.keys(errors).length > 0) {
      return;
    }

    const currentGender = getValues("gender");
    if (!currentGender) {
      setErrorFields(prev => ({ ...prev, gender: true }));
      setErrorMessages(prev => ({ ...prev, gender: "Gender is required" }));
      return;
    }

    setNextPage(true);
  };

  // Render country item for phone code dropdown
  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => selectCountryForPhone(item)}>
      <Image
        source={{ uri: item.flag }}
        style={styles.countryFlag}
        resizeMode="cover"
      />
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.dialCode}>{item.dial_code}</Text>
    </TouchableOpacity>
  );

  // Render qualified country item
  const renderQualifiedCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.qualifiedCountryItem}
      onPress={() => handleQualifiedCountrySelect(item)}>
      <View style={styles.qualifiedCountryContent}>
        <Text style={styles.qualifiedCountryName}>{item.name}</Text>
        <Text style={styles.qualifiedCountryCourses}>
          {item.courses_csv?.split(';').slice(0, 3).join(', ')}
          {item.courses_csv?.split(';').length > 3 ? '...' : ''}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  // Render college item
  const renderCollegeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.collegeItem}
      onPress={() => handleCollegeSelect(item)}>
      <View style={styles.collegeContent}>
        <Text style={styles.collegeName}>{item.name}</Text>
        {item.city && (
          <Text style={styles.collegeCity}>{item.city}</Text>
        )}
        <Text style={styles.collegeType}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render course item
  const renderCourseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.collegeItem}
      onPress={() => handleCourseSelect(item)}>
      <Text style={styles.collegeName}>{item.name}</Text>
    </TouchableOpacity>
  );

  console.log(errors)

  if (nextPage) {
    return (

      <View style={styles.container}>
        <Text
          style={[
            styles.heading,
            isTablet && styles.headingTablet,
            isSmallPhone && styles.headingSmall,
          ]}
        >
          Choose Your Plan
        </Text>

        {/* ✅ Start Free Button */}
        {!route?.params?.params?.direct && <View style={styles.freeButtonWrapper}>
          {/* <TouchableOpacity style={styles.freeButton}>
            <Text style={styles.freeButtonText}>
              Start Free
            </Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.freeButton}
            onPress={handleStartFree}
            disabled={loading}
          >
            <Text style={styles.freeButtonText}>
              {loading ? "Please wait..." : "Start Free"}
            </Text>
          </TouchableOpacity>

        </View>}

        <FlatList
          data={plans}
          keyExtractor={item => item.id}
          renderItem={renderPlan}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            isLandscape && styles.listContentLandscape,
            isTablet && styles.listContentTablet,
          ]}
          numColumns={isLandscape || isTablet ? 2 : 1}
          key={isLandscape || isTablet ? 'two-column' : 'one-column'}
        />
      </View>

    )
  }
  else {

    return (
      <ScrollView
        style={[styles.scrollContainer, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.singupcontainer}>
          {/* Title */}
          <Text style={styles.title}>Create{'\n'}Account</Text>

          {/* Name Input */}
          <View>
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Full name is required",
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      error && styles.inputError, // 👈 automatic error border
                    ]}
                  >
                    <Icon
                      name="person-outline"
                      size={20}
                      color="#000"
                      style={styles.leftIcon}
                    />

                    <TextInput
                      style={styles.textInput}
                      placeholder="Full Name *"
                      placeholderTextColor="#999"
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>

                  {error && (
                    <Text style={styles.errorText}>
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Email Input */}
          <View>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      error && styles.inputError, // 👈 automatic red border
                    ]}
                  >
                    <Icon
                      name="mail"
                      size={20}
                      color="#000"
                      style={styles.leftIcon}
                    />

                    <TextInput
                      style={styles.textInput}
                      placeholder="Email Address *"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>

                  {error && (
                    <Text style={styles.errorText}>
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Password Input */}
          <View>
            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
                validate: (value) => {
                  if (!/(?=.*[A-Z])/.test(value)) {
                    return "Password must contain at least 1 uppercase letter";
                  }
                  if (!/(?=.*\d)/.test(value)) {
                    return "Password must contain at least 1 number";
                  }
                  return true;
                },
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      error && styles.inputError, // 👈 automatic error border
                    ]}
                  >
                    <Icon
                      name="lock-closed-outline"
                      size={20}
                      color="#000"
                      style={styles.leftIcon}
                    />

                    <TextInput
                      style={styles.textInput}
                      placeholder="Create Password *"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                    />

                    <TouchableOpacity
                      onPress={togglePasswordVisibility}
                      style={styles.rightIcon}
                    >
                      <Icon
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#000"
                      />
                    </TouchableOpacity>
                  </View>

                  {error && (
                    <Text style={styles.errorText}>
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Confirm Password Input */}
          <View>
            <View
              style={[
                styles.inputContainer,
                errorFields.confirmPassword && styles.inputError,
              ]}>
              <Icon name="lock-closed-outline" size={20} color="#000" style={styles.leftIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm Password *"
                placeholderTextColor="#999"
                requiredFields={true}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={validateConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={toggleConfirmPasswordVisibility}
                style={styles.rightIcon}>
                <Icon
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#000"
                />
              </TouchableOpacity>
            </View>
            {errorMessages.confirmPassword ? <Text style={styles.errorText}>{errorMessages.confirmPassword}</Text> : null}
          </View>

          {/* Qualification Country Selection */}
          <View>
            <TouchableOpacity
              style={[
                styles.qualificationCountryButton,
                errorFields.qualifiedCountry && styles.inputError,
              ]}
              onPress={() => setQualifiedCountryModalVisible(true)}>
              <View style={styles.buttonContent}>
                <Icon name="earth-outline" size={20} color="#000" style={styles.leftIcon} />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonLabel}>Select Country for Qualification *</Text>
                  {selectedQualifiedCountry ? (
                    <Text style={styles.selectedValue}>{selectedQualifiedCountry.name}</Text>
                  ) : (
                    <Text style={styles.placeholderText}>Tap to select country</Text>
                  )}
                </View>
                <Icon name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
            {errorMessages.qualifiedCountry ? <Text style={styles.errorText}>{errorMessages.qualifiedCountry}</Text> : null}
          </View>

          {/* College/Institute Selection */}
          <View>
            <TouchableOpacity
              style={[
                styles.collegeButton,
                errorFields.institute && styles.inputError,
                !selectedQualifiedCountry && styles.disabledButton,
              ]}
              onPress={() => {
                if (selectedQualifiedCountry) {
                  setCollegeModalVisible(true);
                }
              }}
              disabled={!selectedQualifiedCountry}>
              <View style={styles.buttonContent}>
                <Icon name="school-outline" size={20} color="#000" style={styles.leftIcon} />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonLabel}>Select College/Institute *</Text>
                  {selectedCollege ? (
                    <Text style={styles.selectedValue}>{selectedCollege.name}</Text>
                  ) : (
                    <Text style={styles.placeholderText}>
                      {selectedQualifiedCountry ? 'Tap to select college' : 'Select country first'}
                    </Text>
                  )}
                </View>
                {selectedQualifiedCountry && (
                  <Icon name="chevron-forward" size={20} color="#666" />
                )}
              </View>
            </TouchableOpacity>
            {errorMessages.institute ? <Text style={styles.errorText}>{errorMessages.institute}</Text> : null}
          </View>

          {/* Course Selection */}
          <View>
            <TouchableOpacity
              style={[
                styles.qualificationCountryButton,
                errorFields.course && styles.inputError,
              ]}
              onPress={() => setCourseModalVisible(true)}
            >
              <View style={styles.buttonContent}>
                <Icon name="book-outline" size={20} color="#000" style={styles.leftIcon} />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonLabel}>Select Course *</Text>
                  {selectedCourse ? (
                    <Text style={styles.selectedValue}>{selectedCourse.name}</Text>
                  ) : (
                    <Text style={styles.placeholderText}>Tap to select course</Text>
                  )}
                </View>
                <Icon name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
            {errorMessages.course ? <Text style={styles.errorText}>{errorMessages.course}</Text> : null}
          </View>
          {/* Gender Selection */}
          <View style={styles.genderContainer}>
            <Text style={styles.genderLabel}>Gender *</Text>
            <View style={styles.genderOptions}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderOption,
                    gender === option && styles.genderOptionSelected,
                    errorFields.gender && styles.genderError,
                  ]}
                  onPress={() => {
                    setGender(option)
                    setValue("gender", option)
                  }}
                >
                  <Text style={[
                    styles.genderOptionText,
                    gender === option && styles.genderOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errorMessages.gender ? <Text style={styles.errorText}>{errorMessages.gender}</Text> : null}
          </View>

          {/* Phone Number Input */}
          <View>
            <Controller
              control={control}
              name="mobile"
              rules={{
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Phone number must be exactly 10 digits",
                },
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      error && styles.inputError, // 👈 automatic red border
                    ]}
                  >
                    {/* Country Selector */}
                    <TouchableOpacity
                      style={styles.countrySelector}
                      onPress={toggleCountryCodeDropdown}
                    >
                      {selectedCountry && selectedCountry.flag ? (
                        <>
                          <Image
                            source={{ uri: selectedCountry.flag }}
                            style={styles.flagIcon}
                            resizeMode="cover"
                          />
                          <Text style={styles.dialCodeText}>
                            {selectedCountry.dial_code}
                          </Text>
                          <Icon name="chevron-down" size={16} color="#000" />
                        </>
                      ) : (
                        <Text style={styles.dialCodeText}>Select</Text>
                      )}
                    </TouchableOpacity>

                    {/* Phone Input */}
                    <TextInput
                      style={[styles.textInput, styles.phoneInput]}
                      placeholder="Phone Number *"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      value={value}
                      onChangeText={(text) => {
                        const onlyDigits = text.replace(/[^0-9]/g, '');
                        onChange(onlyDigits);
                      }}
                    />
                  </View>

                  {error && (
                    <Text style={styles.errorText}>
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Country Code Dropdown Modal */}
          <Modal
            visible={isCountryCodeDropdownVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setCountryCodeDropdownVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setCountryCodeDropdownVisible(false)}>
              <View style={styles.dropdownContainer}>
                <FlatList
                  data={countries}
                  renderItem={renderCountryItem}
                  keyExtractor={item => item.code}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={20}
                  maxToRenderPerBatch={20}
                  windowSize={10}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Qualified Countries Modal */}
          <Modal
            visible={isQualifiedCountryModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setQualifiedCountryModalVisible(false)}>
            <View style={styles.fullModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Graduate Country</Text>
                <TouchableOpacity
                  onPress={() => setQualifiedCountryModalVisible(false)}
                  style={styles.closeButton}>
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              {loadingCountries ? (
                <View style={styles.loadingContainer}>
                  <Text>Loading countries...</Text>
                </View>
              ) : (
                <FlatList
                  data={qualifiedCountries}
                  renderItem={renderQualifiedCountryItem}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalContent}
                />
              )}
            </View>
          </Modal>

          {/* Colleges Modal */}
          <Modal
            visible={isCollegeModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setCollegeModalVisible(false)}>
            <View style={styles.fullModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Colleges in {selectedQualifiedCountry?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setCollegeModalVisible(false)}
                  style={styles.closeButton}>
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={selectedQualifiedCountry?.colleges || []}
                renderItem={renderCollegeItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text>No colleges available for this country</Text>
                  </View>
                }
              />
            </View>
          </Modal>

          {/* Course Modal */}
          <Modal
            visible={isCourseModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setCourseModalVisible(false)}
          >
            <View style={styles.fullModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Course</Text>
                <TouchableOpacity onPress={() => setCourseModalVisible(false)}>
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {loadingCourses ? (
                <View style={styles.loadingContainer}>
                  <Text>Loading courses...</Text>
                </View>
              ) : (
                <FlatList
                  data={courses}
                  keyExtractor={(item) => item.id}
                  renderItem={renderCourseItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalContent}
                />
              )}
            </View>
          </Modal>

          {/* Next Button */}
          <TouchableOpacity
            style={[styles.nextButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit(handleNext)}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? "Please wait..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

};

export const emailvalidation = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return "please enter your email"
  }
  if (!emailRegex.test(email)) {
    return "please enter your valid email"
  }
  return '';
};

export const passwordValidation = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!password) {
    return "please enter your password"
  }
  if (!passwordRegex.test(password)) {
    return " At least 1 uppercase , 1 digit, mai 6 char"
  }
  return ''
}


const PlanCard = ({ plan, isTablet, isLandscape, screenWidth, data }) => {
  // Dynamic card width calculation
  const navigation = useNavigation();
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

  const [processingPayment, setProcessingPayment] = useState(false);

  const startRazorpayPayment = async (selectedPlan) => {


    if (!selectedPlan) {
      Alert.alert('Select Plan', 'Please select a plan first');
      return;
    }
    console.log("select plan2", selectedPlan)
    console.log("select plan2", selectedPlan.name)
    console.log("select plan2", selectedPlan.price)
    console.log("prefill", data)

    setProcessingPayment(true);

    const options = {
      key: RAZORPAY_KEY,
      amount: Number(selectedPlan.discount_price) * 100, // VERY IMPORTANT
      currency: 'INR',
      name: 'Fornix Medical',
      description: `${selectedPlan.name}`,
      prefill: {
        email: data.email || 'test@gmail.com',
        contact: data.mobile || '9999999999',
        name: data.name || 'User',
      },
      theme: { color: '#F87F16' },
    };


    console.log('option', options)


    try {
      const paymentData = await RazorpayCheckout.open(options);
      console.log('Payment Success:', paymentData);

      await handlePaymentSuccess(paymentData, selectedPlan, data);
    } catch (error) {
      console.log('Payment Failed:', error);
      Alert.alert('Payment Cancelled', 'Payment was not completed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const saveCourseSelection = async (data, plan, payment) => {
    try {
      const dataa = {
        courseId: data.courses.id,
        courseName: data.courses.name,
        planId: plan?.id || null,
        planName: plan?.name || null,
        planPrice: plan?.price || null,
        paymentStatus: plan ? 'paid' : 'not_required',
        enrolledAt: new Date().toISOString(),
      };
      const payload =
      {
        "name": data.name,
        "email": data.email,
        "password": data.password,
        "country": data.country,
        "country_id": data.country_id,
        "college_name": data.college_name,
        "gender": data.gender,
        "mobile": data.mobile,
        "payment_id": payment.razorpay_payment_id,
        "course_id": data.courses.id,
        "plan_id": plan?.id,
        "amount": plan.discount_price,
        "transaction_mode": "upi",
        "transaction_status": "success",
        "payment_date": "2026-01-30T12:00:00.000Z"
      }
      console.log("paylo", payload, payment)
      const respone = await axios.post("https://fornix-medical.vercel.app/api/v1/auth/register-with-plan",
        payload
      )
      console.log('res', respone)
      await AsyncStorage.setItem('selectedCourse', JSON.stringify(dataa));
    } catch (error) {
      console.log('save error', error);
    }
  };


  const handlePaymentSuccess = async (paymentData,
    selectedPlan, data) => {
    // console.log('jhj', selectedCourseForPlan)
    try {
      await saveCourseSelection(data, selectedPlan, paymentData);

      Alert.alert('Success', 'Enrollment successful 🎉', [
        {
          text: 'OK',
          onPress: () => navigation.replace(data?.password ? 'Logindetail' : "TabNavigation"),
        },
      ]);
    } catch (error) {
      console.log('Post Payment Error:', error);
      Alert.alert(
        'Error',
        'Payment was successful but something went wrong. Contact support.'
      );
    }
  };

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
        {plan.access_features?.notes && <Feature icon="sticky-note" text="Notes" isSmallPhone={isSmallPhone} />}
        {plan.access_features?.tests && <Feature icon="clipboard-check" text="Tests" isSmallPhone={isSmallPhone} />}
        {plan.access_features?.videos && <Feature icon="video" text="Videos" isSmallPhone={isSmallPhone} />}
        {plan.access_features?.ai_explanation && (
          <Feature icon="robot" text="AI Explanation" isSmallPhone={isSmallPhone} />
        )}
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        onPress={() => startRazorpayPayment(plan)}
        style={[
          styles.buyBtn,
          isTablet && styles.buyBtnTablet
        ]}>
        <Text style={[
          styles.buyText,
          isTablet && styles.buyTextTablet
        ]}>
          Buy Now
        </Text>
      </TouchableOpacity>


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

    </View >
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

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F87F16',
  },
  singupcontainer: {
    flex: 1,
    backgroundColor: '#F87F16',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
    marginBottom: 15,
    paddingTop: 35,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 0,
    paddingHorizontal: 12,
    width: width - 48,
    marginBottom: 8,
    height: 50,
  },
  qualificationCountryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: width - 48,
    marginBottom: 8,
  },
  collegeButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: width - 48,
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  buttonLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  selectedValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#000',
  },
  placeholderText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#999',
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: 'red',
  },
  textInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#000000CC',
    marginLeft: 10,
  },
  phoneInput: {
    marginLeft: 0,
  },
  leftIcon: {
    marginRight: 5,
  },
  rightIcon: {
    padding: 5,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
    marginRight: 10,
  },
  flagIcon: {
    width: 26,
    height: 20,
    marginRight: 8,
    borderRadius: 2,
  },
  dialCodeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#000000CC',
    marginRight: 8,
  },
  genderContainer: {
    marginBottom: 8,
  },
  genderLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
    marginLeft: 5,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genderOptionSelected: {
    backgroundColor: '#1A3848',
    borderColor: '#1A3848',
  },
  genderError: {
    borderColor: 'red',
    borderWidth: 1.5,
  },
  genderOptionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#000000CC',
  },
  genderOptionTextSelected: {
    color: 'white',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
    marginBottom: 8,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullModalContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: width - 80,
    maxHeight: 400,
    padding: 10,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  qualifiedCountryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  qualifiedCountryContent: {
    flex: 1,
  },
  qualifiedCountryName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  qualifiedCountryCourses: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  collegeItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  collegeContent: {
    flex: 1,
  },
  collegeName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  collegeCity: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  collegeType: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  countryFlag: {
    width: 32,
    height: 24,
    marginRight: 12,
    borderRadius: 2,
  },
  countryName: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#000000CC',
  },
  dialCode: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#1A3848',
    borderRadius: 12,
    paddingVertical: 12,
    width: width - 48,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  cancelButton: {
    alignItems: 'center',
    marginBottom: 2,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
  },
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
  freeButtonWrapper: {
    alignItems: 'center',
    marginVertical: 20,
  },

  freeButton: {
    width: '70%',           // ✅ responsive
    height: 48,
    backgroundColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  freeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
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

export default Signupdetail;