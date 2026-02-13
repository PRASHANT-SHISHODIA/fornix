import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Icon2 from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../API/axiosConfig';
import BannerCarousel from './BannerCarousel';

// Screen width and height
const { width, height } = Dimensions.get('window');

// 🔹 Scale function to adjust UI for all screen sizes
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
  if (width < 375) return 1.5; // Small phones
  if (width > 414) return 1.7; // Large phones
  return 1.6; // Normal phones
};

// 🔹 Get responsive search container transform
const getSearchTransform = () => {
  if (width < 375) return 0.65; // Small phones
  if (width > 414) return 0.60; // Large phones
  return 0.62; // Normal phones
};


const Home = () => {
  const carouselData = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1167&q=80'
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80'
    }
  ];

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('All');
  const [isBlinking, setIsBlinking] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [error, setError] = useState(null);
  const testimonialRef = useRef(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [userName, setUserName] = useState('')
  const [profileImage, setProfileimage] = useState(null)

  const CARD_WIDTH = width * 0.8;
  const CARD_MARGIN = scale(getResponsiveSize(15));
  const FULL_SIZE = CARD_WIDTH + CARD_MARGIN;

  useEffect(() => {
    if (!studentTestimonials?.length) return;

    const interval = setInterval(() => {
      setTestimonialIndex((prev) => {
        const nextIndex =
          prev === studentTestimonials?.length - 1 ? 0 : prev + 1;

        if (testimonialRef.current) {
          testimonialRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [studentTestimonials]);
  // console.log("testmenolian",testimonialIndex)


  // Student testimonials data
  const studentTestimonials = testimonials || [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      title: 'Rahul Sharma',
      subtitle: 'NEET Aspirant',
      remarks: 'This app helped me crack NEET with its amazing pneumonics and live quizzes.'
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      title: 'Priya Patel',
      subtitle: 'JEE Main Topper',
      remarks: 'The live quiz feature made competitive exam preparation fun and interactive.'
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      title: 'Amit Kumar',
      subtitle: 'AIIMS Aspirant',
      remarks: 'As a medical aspirant, the pneumonics for biology and chemistry were life-saving!'
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      title: 'Sneha Verma',
      subtitle: 'Engineering Student',
      remarks: 'The structured programs helped me stay on track with my JEE preparation.'
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      title: 'Karan Singh',
      subtitle: 'NEET 2023 Qualified',
      remarks: 'From basic concepts to advanced topics, this app covers everything.'
    },
    {
      id: '6',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      title: 'Anjali Mehta',
      subtitle: 'Medical Student',
      remarks: 'The test series was exactly what I needed for final revision before exams.'
    }
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  }



  const filterTabs = ['All', 'Pneumonics', 'Live Quiz'];
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const response = await API.get(
        "/home",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      console.log("API Response", response.data);
      setPrograms(response.data?.data || []);
      setBanners(response.data?.banners || []);
      setTestimonials(response.data?.testimonials || []);

    } catch (error) {
      setError(error.response?.data || error.message)
      console.log("API ERROR :", error.response?.data || error.message);
    } finally {
      setLoading(false)
    }
  };
  // console.log( " resposne data",banners,testimonials)

  useEffect(() => {
    fetchPrograms()

  }, []);

  useEffect(() => {
    const fromattedData = studentTestimonials.map(item => ({
      ...item,
      fullName: item.title + " ⭐"
    })) || [];
    setPrograms(fromattedData);
  }, [])

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("user_id");

        if (!token || !userId) return;

        const response = await API.post(
          "/user/get",
          { id: userId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Home API ", response)

        // 👇 yahin se name lo
        setUserName(response.data.user);
        setProfileimage(response.data.user.profile_picture)

        console.log(userName)
        console.log(profileImage)

      } catch (error) {
        console.log("HOME USER API ERROR", error.response?.data || error.message);
      }
    };

    fetchUserName();
  }, []);



  // Carousel data with doctor images


  const handleFilterPress = (filter) => {
    setActiveFilter(filter);
    // Navigate to Mood screen when Live Quiz is pressed
    if (filter === 'Live Quiz') {
      // navigation.navigate('Mood');
    }
  };

  // Blinking effect for Live Quiz tab - starts automatically
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 500); // Blink every 500ms

    return () => {
      clearInterval(blinkInterval);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Auto-scroll carousel
  useEffect(() => {
    const autoScroll = setInterval(() => {
      if (currentIndex === carouselData.length - 1) {
        setCurrentIndex(0);
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      } else {
        setCurrentIndex(currentIndex + 1);
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      }
    }, 3000);

    return () => clearInterval(autoScroll);
  }, [currentIndex]);

  // const getTabBackgroundColor = (filter) => {
  //   if (filter === 'Live Quiz') {
  //     return isBlinking ? '#F87F16' : '#1A3848';
  //   }
  //   return activeFilter === filter ? '#F87F16' : '#1A3848';
  // };
  const getTabBackgroundColor = (filter) => {
    return activeFilter === filter ? '#F87F16' : '#1A3848';
  };


  const onScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const renderCarouselItem = ({ item }) => {
    return (
      <View style={styles.carouselItem}>
        <Image
          source={{ uri: item.image }}
          style={styles.carouselImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {carouselData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot
            ]}
          />
        ))}
      </View>
    );
  };

  const renderStudentItem = ({ item }) => {
    return (
      <View style={styles.studentItem}>
        <View style={styles.studentHeader}>
          <Image
            source={{ uri: item.profile_image }}
            style={styles.studentImage}
          />
          <View style={styles.studentInfo}>
            <Text style={styles.studentTitle}>{item.name}</Text>
            <Text style={styles.studentTitle}>{`${item.rating} ⭐`}</Text>
            <Text style={styles.studentSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        <Text style={styles.studentRemarks}>{item.message}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header Section with Circular Bottom */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Profile Image and Bell Icon Row */}
            <View style={styles.topRow}>
              <Image
                source={profileImage && typeof profileImage === "string"
                  ? { uri: profileImage }
                  : require("../assets/Images/profilefornix.png")
                }
                style={styles.profileImage}
              />
              <Text style={styles.greeting}>{`${greeting()} ${userName.full_name}`}</Text>
              <TouchableOpacity
                // onPress={()=>navigation.navigate('Course')}
                style={styles.bellIconContainer}>
                <Icon2
                  name="bell"
                  size={moderateScale(getResponsiveSize(16))}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Icon1
                  name="search"
                  size={moderateScale(getResponsiveSize(20))}
                  color="white"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="white"
                />
              </View>
            </View>

          </View>
        </View>

        <Text style={styles.Titletext}>Your Program (30)</Text>
        <View style={styles.filterContainer}>
          {filterTabs.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                { backgroundColor: getTabBackgroundColor(filter) }
              ]}
              onPress={() => handleFilterPress(filter)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter && styles.activeText,
                  ]}
                >
                  {filter}
                </Text>

                {/* 🔴 LIVE blinking dot */}
                {filter === 'Live Quiz' && (
                  <View
                    style={[
                      styles.liveDot,
                      { opacity: isBlinking ? 1 : 0.2 },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <BannerCarousel
          banners={banners}
          loading={loading}
          error={error}
          // onPress={handleBannerPress}
          autoPlay={true}
          timer={4000}
        />

        {/* Testimonials Section */}
        <View style={styles.testimonialsContainer}>
          <Text style={styles.testimonialsTitle}>Success Story</Text>
        </View>

        {/* Student Testimonials Section */}
        <View style={styles.studentsContainer}>
          {loading ? (
            <Text style={{ textAlign: "center", marginTop: 20 }}>Loading </Text>
          ) : (
            <FlatList
              ref={testimonialRef}
              data={studentTestimonials}
              renderItem={renderStudentItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={FULL_SIZE}
              decelerationRate="fast"
              getItemLayout={(data, index) => ({
                length: FULL_SIZE,
                offset: FULL_SIZE * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  testimonialRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
            />
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(getResponsiveSize(80)),
  },
  header: {
    backgroundColor: '#F87F16',
    marginBottom: verticalScale(getResponsiveSize(20)),
    paddingBottom: verticalScale(getResponsiveSize(20)),
    height: verticalScale(getResponsiveSize(220)),
    borderBottomLeftRadius: scale(getResponsiveSize(400)),
    borderBottomRightRadius: scale(getResponsiveSize(400)),
    transform: [{ scaleX: getHeaderTransform() }],
  },
  headerContent: {
    paddingHorizontal: scale(getResponsiveSize(20)),
    transform: [{ scaleX: getSearchTransform() }],
    marginTop: verticalScale(getResponsiveSize(10)),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(getResponsiveSize(20)),
    marginBottom: verticalScale(getResponsiveSize(15)),
  },
  profileImage: {
    width: moderateScale(getResponsiveSize(45)),
    height: moderateScale(getResponsiveSize(45)),
    borderRadius: moderateScale(getResponsiveSize(30)),
    borderWidth: 2,
    borderColor: 'white',
  },
  greeting: {
    fontSize: moderateScale(getResponsiveSize(15)),
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    flex: 1,
    marginLeft: scale(getResponsiveSize(15)),
    includeFontPadding: false,
  },
  bellIconContainer: {
    width: moderateScale(getResponsiveSize(35)),
    height: moderateScale(getResponsiveSize(35)),
    borderRadius: moderateScale(getResponsiveSize(20)),
    backgroundColor: '#1A3848',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: verticalScale(getResponsiveSize(10)),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(25)),
    paddingHorizontal: scale(getResponsiveSize(15)),
    paddingVertical: verticalScale(getResponsiveSize(1)),
  },
  searchIcon: {
    marginRight: scale(getResponsiveSize(10)),
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: moderateScale(getResponsiveSize(14)),
    color: 'white',
    includeFontPadding: false,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(getResponsiveSize(20)),
    paddingVertical: verticalScale(getResponsiveSize(10)),
  },
  filterTab: {
    paddingHorizontal: scale(getResponsiveSize(20)),
    paddingVertical: verticalScale(getResponsiveSize(8)),
    borderRadius: moderateScale(getResponsiveSize(20)),
    marginRight: scale(getResponsiveSize(10)),
    backgroundColor: '#1A3848',
    minWidth: scale(getResponsiveSize(80)),
  },
  activeTab: {
    backgroundColor: '#F87F16',
  },
  filterText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Medium',
    color: 'white',
    textAlign: 'center',
    includeFontPadding: false,
  },
  activeText: {
    color: 'white',
  },
  // Carousel Styles
  carouselContainer: {
    marginVertical: verticalScale(getResponsiveSize(20)),
  },
  carousel: {
    width: width,
    height: verticalScale(getResponsiveSize(200)),
  },
  carouselItem: {
    width: width,
    height: verticalScale(getResponsiveSize(200)),
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '90%',
    height: '100%',
    borderRadius: moderateScale(getResponsiveSize(15)),
  },
  // Pagination Dots Styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(getResponsiveSize(10)),
  },
  dot: {
    width: moderateScale(getResponsiveSize(8)),
    height: moderateScale(getResponsiveSize(8)),
    borderRadius: moderateScale(getResponsiveSize(4)),
    marginHorizontal: scale(getResponsiveSize(4)),
  },
  activeDot: {
    backgroundColor: '#F87F16',
    width: moderateScale(getResponsiveSize(20)),
  },
  inactiveDot: {
    backgroundColor: '#1A3848',
    opacity: 0.5,
  },
  testimonialsContainer: {
    marginTop: verticalScale(getResponsiveSize(30)),
  },
  testimonialsTitle: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    textAlign: 'center',
    includeFontPadding: false,
  },
  testimonialCard: {
    padding: scale(getResponsiveSize(15)),
    borderRadius: moderateScale(getResponsiveSize(10)),
    marginBottom: verticalScale(getResponsiveSize(10)),
  },
  testimonialTitle: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    marginBottom: verticalScale(getResponsiveSize(5)),
  },
  testimonialSubtitle: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  testimonialContent: {
    marginTop: verticalScale(getResponsiveSize(15)),
  },
  testimonialText: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    lineHeight: moderateScale(getResponsiveSize(20)),
  },
  Titletext: {
    fontSize: moderateScale(getResponsiveSize(17)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    textAlign: 'left',
    marginLeft: scale(getResponsiveSize(20)),
    marginBottom: verticalScale(getResponsiveSize(1)),
    includeFontPadding: false,
  },
  // Student Testimonials Styles
  studentsContainer: {
    padding: scale(getResponsiveSize(15)),
    marginTop: verticalScale(getResponsiveSize(0)),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    width: "40%",
    marginRight: 15,
  },

  studentItem: {
    borderWidth: 1.5,
    borderColor: '#1A3848',
    borderRadius: moderateScale(getResponsiveSize(12)),
    padding: scale(getResponsiveSize(12)),
    backgroundColor: 'white',
    width: width * 0.8,   // 👈 card width for slider
    marginRight: scale(getResponsiveSize(15)),
    minHeight: verticalScale(getResponsiveSize(140)),
  },

  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(8)),
  },
  studentImage: {
    width: moderateScale(getResponsiveSize(50)),
    height: moderateScale(getResponsiveSize(50)),
    borderRadius: moderateScale(getResponsiveSize(40)),
    marginRight: scale(getResponsiveSize(10)),
  },
  studentInfo: {
    flex: 1,
  },
  studentTitle: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-SemiBold',
    color: '#1A3848',
    marginBottom: verticalScale(getResponsiveSize(2)),
    includeFontPadding: false,
  },
  studentSubtitle: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Regular',
    color: '#F87F16',
    includeFontPadding: false,
  },
  studentRemarks: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    lineHeight: moderateScale(getResponsiveSize(16)),
    textAlign: 'left',
    includeFontPadding: false,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginLeft: 6,
  },

});

export default Home;