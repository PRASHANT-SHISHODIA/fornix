import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Alert,
  Image,
  PermissionsAndroid,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon1 from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


const { width, height } = Dimensions.get('window');

// 🔹 Responsive scaling functions
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

const Profile = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [avatarSource, setAvatarSource] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const profileImageUri = profileData?.profile_picture;


  const menuItems = [
    {
      id: '1',
      title: 'Edit Profile',
      icon: 'edit',
      onPress: () => navigation.navigate('Editprofile', {
        data: profileData,
      })
    },
    //  {
    //   id: '2',
    //   title: 'Results',
    //   icon: 'score',
    //   onPress: () => navigation.navigate('Results')
    // },

    // {
    //   id: '3',
    //   title: 'Portfolio',
    //   icon: 'briefcase',
    //   onPress: () => navigation.navigate('Portfolio')
    // },
    // {
    //   id: '4',
    //   title: 'Chances To Pass',
    //   icon: 'chart-line',
    //   onPress: () => navigation.navigate('ChancesToPass')
    // },
    {
      id: '5',
      title: 'History',
      icon: 'history',
      onPress: () => navigation.navigate('History')
    },
    {
      id: '6',
      title: 'Reset The Course',
      icon: 'refresh',
      onPress: () => showResetConfirmation()
    },
    // {
    //   id: '7',
    //   title: 'Refer',
    //   icon: 'user-plus',
    //   onPress: () => navigation.navigate('Refer')
    // },

    {
      id: '8',
      title: 'Logout',
      icon: 'sign-out-alt',
      onPress: () => showLogoutConfirmation()
    },
    {
      id: '9',
      title: 'Delete Account',
      icon: 'trash',
      onPress: () => showDeleteConfirmation()
    },
  ];


  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");

      if (!token || !userId) {
        Alert.alert("Session Expired", "Please Login again");
        navigation.replace("Logindetail");
        return;
      }
      const response = await axios.post(
        "https://fornix-medical.vercel.app/api/v1/user/get",
        {
          id: userId,

        },
        {


          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      )
      console.log("PROFILE API RESPONSE:", response.data);
      setProfileData(response?.data?.user)
      setSubscriptions(response?.data?.subscriptions || [])

      // console.log(profileData)

    } catch (error) {
      console.log("PROFILE API ERROR", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);


  const resetCourseProgress = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");
      const course = await AsyncStorage.getItem("selectedCourse");
      console.log('course', course)
      // expected value: "AMC" or something else

      if (!token || !userId) {
        Alert.alert("Session Expired", "Please login again");
        navigation.replace("Logindetail");
        return;
      }

      let apiUrl = "";
      let body = {};

      // ✅ CONDITION
      if (course?.courseName === "AMC") {
        apiUrl = "https://fornix-medical.vercel.app/api/v1/subject-quiz/reset";
        body = {
          user_id: userId,
          scope: "all",
        };
      } else {
        apiUrl = "https://fornix-medical.vercel.app/api/v1/quiz/reset";
        body = {
          user_id: userId,
        };
      }

      console.log("RESET API:", apiUrl);
      console.log("RESET BODY:", body);

      const response = await axios.post(apiUrl, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("RESET RESPONSE:", response.data);

      // ✅ SUCCESS HANDLING
      if (response.data?.success) {
        Alert.alert(
          "Success",
          course === "AMC"
            ? "All AMC answers have been reset successfully."
            : `Course reset successfully. Attempts deleted: ${response.data.deleted_attempts || 0}`
        );
      } else {
        Alert.alert("Failed", "Reset was not successful");
      }

    } catch (error) {
      console.log("RESET ERROR", error.response?.data || error.message);
      Alert.alert("Error", "Failed to reset course");
    }
  };


  const showResetConfirmation = () => {
    Alert.alert(
      "Reset App",
      "Are you sure you want to reset all app data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetCourseProgress }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user_id");
      await AsyncStorage.removeItem("user");
      navigation.reset({
        index: 0,
        routes: [{ name: "Logindetail" }],
      });
    } catch (error) {
      console.log("LOGOUT ERROR", error.message);
      Alert.alert("Error", "Failed to logout");
    }
  };

  const showLogoutConfirmation = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: handleLogout }
      ]
    );
  };

  const uploadProfileImage = async (imageAsset) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");

      if (!token || !userId) {
        Alert.alert("Session Expired", "Please login again");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append('id', userId);
      formData.append('profile_picture', {
        uri: Platform.OS === 'android' ? imageAsset.uri : imageAsset.uri.replace('file://', ''),
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || 'profile.jpg',
      });

      console.log("UPLOADING IMAGE...", formData);

      const response = await axios.put(
        "https://fornix-medical.vercel.app/api/v1/user/update-picture",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log("UPLOAD RESPONSE:", response.data);

      if (response.data?.success) {
        Alert.alert("Success", "Profile picture updated successfully");
        fetchProfile(); // Refresh profile data
      } else {
        Alert.alert("Error", response.data?.message || "Failed to upload profile picture");
      }
    } catch (error) {
      console.log("UPLOAD ERROR", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      console.log("--- DELETE ACCOUNT FLOW STARTED ---");
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");

      console.log("Retrieved Auth Data:", { userId, tokenExists: !!token });

      if (!token || !userId) {
        console.log("Missing token or userId. Aborting.");
        Alert.alert("Session Expired", "Please login again");
        navigation.replace("Logindetail");
        return;
      }

      setLoading(true);
      const requestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          id: userId,
        },
      };

      console.log("Sending DELETE request to: https://fornix-medical.vercel.app/api/v1/user/delete");
      console.log("Request Config:", JSON.stringify(requestConfig, null, 2));

      const response = await axios.delete(
        "https://fornix-medical.vercel.app/api/v1/user/delete",
        requestConfig
      );

      console.log("DELETE ACCOUNT API RESPONSE STATUS:", response.status);
      console.log("DELETE ACCOUNT API RESPONSE DATA:", JSON.stringify(response.data, null, 2));

      if (response.data?.success) {
        console.log("Account deletion successful. Clearing storage and navigating.");
        Alert.alert("Success", "Account deleted successfully.");
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: "Logindetail" }],
        });
      } else {
        console.log("Account deletion failed (API success=false). Message:", response.data?.message);
        Alert.alert("Error", response.data?.message || "Failed to delete account");
      }
    } catch (error) {
      console.log("--- DELETE ACCOUNT ERROR ---");
      if (error.response) {
        console.log("Error Data:", error.response.data);
        console.log("Error Status:", error.response.status);
        console.log("Error Headers:", error.response.headers);
      } else if (error.request) {
        console.log("Error Request (No Response):", error.request);
      } else {
        console.log("Error Message:", error.message);
      }
      console.log("Full Error Object:", error);

      Alert.alert("Error", "Failed to delete account");
    } finally {
      setLoading(false);
      console.log("--- DELETE ACCOUNT FLOW ENDED ---");
    }
  };

  const showDeleteConfirmation = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount }
      ]
    );
  };

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "This app needs access to your camera to take photos.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  const handleImagePicker = () => {
    Alert.alert(
      "Select Profile Photo",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: () => openCamera(),
        },
        {
          text: "Choose from Gallery",
          onPress: () => openImageLibrary(),
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const openCamera = async () => {
    // Request camera permission first
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: false,
      cameraType: 'front',
      saveToPhotos: true, // Save to camera roll
    };

    launchCamera(options, (response) => {
      console.log('Camera Response:', response); // Debug log

      if (response.didCancel) {
        console.log('User cancelled camera picker');
      } else if (response.errorCode) {
        let errorMessage = 'Failed to take photo';
        switch (response.errorCode) {
          case 'camera_unavailable':
            errorMessage = 'Camera not available on this device';
            break;
          case 'permission':
            errorMessage = 'Camera permission denied';
            break;
          case 'others':
            errorMessage = response.errorMessage || 'Unknown camera error';
            break;
        }
        console.log('Camera Error: ', response.errorCode, response.errorMessage);
        Alert.alert('Camera Error', errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const source = { uri: response.assets[0].uri };
        setAvatarSource(source);
        // Upload the selected image
        uploadProfileImage(response.assets[0]);
        console.log('Photo taken successfully:', source.uri);
      } else {
        console.log('Unexpected response:', response);
        Alert.alert('Error', 'Unexpected response from camera');
      }
    });
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: false,
      selectionLimit: 1, // Only allow one image selection
    };

    launchImageLibrary(options, (response) => {
      console.log('Gallery Response:', response); // Debug log

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        let errorMessage = 'Failed to select image';
        switch (response.errorCode) {
          case 'permission':
            errorMessage = 'Photo library permission denied';
            break;
          case 'others':
            errorMessage = response.errorMessage || 'Unknown gallery error';
            break;
        }
        console.log('Gallery Error: ', response.errorCode, response.errorMessage);
        Alert.alert('Gallery Error', errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const source = { uri: response.assets[0].uri };
        setAvatarSource(source);
        // Upload the selected image
        uploadProfileImage(response.assets[0]);
        console.log('Image selected successfully:', source.uri);
      } else {
        console.log('Unexpected response:', response);
        Alert.alert('Error', 'Unexpected response from gallery');
      }
    });
  };




  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#F87F16" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon1 name="arrow-back" size={moderateScale(getResponsiveSize(24))} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Expired Subscription Banner */}
        {subscriptions.some(sub => new Date(sub.end_date) < new Date()) && (
          <View style={styles.expiredBanner}>
            <Icon1 name="warning" size={moderateScale(getResponsiveSize(20))} color="#FFF" />
            <Text style={styles.expiredBannerText}>Your course has ended, please renew.</Text>
          </View>
        )}

        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatarImage} />
            ) : profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Icon name="user" size={moderateScale(getResponsiveSize(40))} color="#FFF" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handleImagePicker}>
              <Icon1 name="camera" size={moderateScale(getResponsiveSize(16))} color="#F87F16" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{profileData?.full_name}</Text>
          <Text style={styles.userEmail}>{profileData?.email}</Text>
          <Text style={styles.userRole}>{profileData?.role}</Text>
          {/* <TouchableOpacity>
            <Icon name="edit" size={25} color="#fff" />
          </TouchableOpacity> */}
        </View>

        {/* Subscription Section */}
        {subscriptions.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>My Subscriptions</Text>
            {subscriptions.map((sub, index) => {
              const isExpired = new Date(sub.end_date) < new Date();

              return (
                <View key={index} style={styles.subscriptionCard}>
                  <View style={styles.subHeader}>
                    <Text style={styles.courseName}>{sub.course?.name}</Text>
                    {sub.is_active && !isExpired ? (
                      <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>
                    ) : (
                      <View style={styles.expiredBadge}><Text style={styles.activeText}>Expired</Text></View>
                    )}
                  </View>
                  <Text style={styles.planName}>{sub.plan?.name}</Text>
                  <Text style={styles.validity}>
                    {isExpired ? "Expired on: " : "Expires: "}
                    {new Date(sub.end_date).toLocaleDateString()}
                  </Text>

                  {isExpired && (
                    <TouchableOpacity
                      style={styles.renewButton}
                      onPress={() => navigation.navigate('CourseSunscription')}
                    >
                      <Text style={styles.renewText}>Renew Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconContainer}>
                  <Icon name={item.icon} size={moderateScale(getResponsiveSize(20))} color="#FFF" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>

              <View style={styles.menuRight}>
                <Icon1 name="chevron-forward" size={moderateScale(getResponsiveSize(20))} color="#FFF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>App Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F87F16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(getResponsiveSize(20)),
    paddingVertical: verticalScale(getResponsiveSize(10)),
  },
  backButton: {
    padding: scale(getResponsiveSize(5)),
  },
  headerTitle: {
    fontSize: moderateScale(getResponsiveSize(22)),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
    includeFontPadding: false,
  },
  placeholder: {
    width: scale(getResponsiveSize(34)),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(getResponsiveSize(30)),
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: verticalScale(getResponsiveSize(20)),
    paddingHorizontal: scale(getResponsiveSize(20)),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: verticalScale(getResponsiveSize(20)),
  },
  avatar: {
    width: scale(getResponsiveSize(100)),
    height: scale(getResponsiveSize(100)),
    borderRadius: scale(getResponsiveSize(50)),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImage: {
    width: scale(getResponsiveSize(100)),
    height: scale(getResponsiveSize(100)),
    borderRadius: scale(getResponsiveSize(50)),
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    width: scale(getResponsiveSize(32)),
    height: scale(getResponsiveSize(32)),
    borderRadius: scale(getResponsiveSize(16)),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F87F16',
  },
  userName: {
    fontSize: moderateScale(getResponsiveSize(20)),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
    marginBottom: verticalScale(getResponsiveSize(0)),
    textAlign: 'center',
    includeFontPadding: false,
  },
  userEmail: {
    fontSize: moderateScale(getResponsiveSize(13)),
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: verticalScale(getResponsiveSize(4)),
    textAlign: 'center',
    includeFontPadding: false,
  },
  userRole: {
    fontSize: moderateScale(getResponsiveSize(13)),
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    includeFontPadding: false,
  },
  menuContainer: {
    paddingHorizontal: scale(getResponsiveSize(20)),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(getResponsiveSize(18)),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: scale(getResponsiveSize(40)),
    height: scale(getResponsiveSize(40)),
    borderRadius: scale(getResponsiveSize(20)),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(getResponsiveSize(15)),
  },
  menuTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: moderateScale(getResponsiveSize(16)),
    color: '#FFF',
    includeFontPadding: false,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(getResponsiveSize(30)),
  },
  versionText: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    includeFontPadding: false,
  },
  sectionContainer: {
    paddingHorizontal: scale(getResponsiveSize(20)),
    marginBottom: verticalScale(getResponsiveSize(20)),
  },
  sectionTitle: {
    fontSize: moderateScale(getResponsiveSize(18)),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
    marginBottom: verticalScale(getResponsiveSize(10)),
  },
  subscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: moderateScale(getResponsiveSize(15)),
    padding: scale(getResponsiveSize(15)),
    marginBottom: verticalScale(getResponsiveSize(10)),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(getResponsiveSize(5)),
  },
  courseName: {
    fontSize: moderateScale(getResponsiveSize(16)),
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: scale(getResponsiveSize(8)),
    paddingVertical: verticalScale(getResponsiveSize(2)),
    borderRadius: moderateScale(getResponsiveSize(10)),
  },
  expiredBadge: {
    backgroundColor: '#E53935',
    paddingHorizontal: scale(getResponsiveSize(8)),
    paddingVertical: verticalScale(getResponsiveSize(2)),
    borderRadius: moderateScale(getResponsiveSize(10)),
  },
  activeText: {
    fontSize: moderateScale(getResponsiveSize(10)),
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
  },
  planName: {
    fontSize: moderateScale(getResponsiveSize(14)),
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  validity: {
    fontSize: moderateScale(getResponsiveSize(12)),
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: verticalScale(getResponsiveSize(5)),
  },
  renewButton: {
    marginTop: verticalScale(getResponsiveSize(10)),
    backgroundColor: '#F87F16',
    paddingVertical: verticalScale(getResponsiveSize(8)),
    borderRadius: moderateScale(getResponsiveSize(8)),
    alignItems: 'center',
  },
  renewText: {
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: moderateScale(getResponsiveSize(14)),
  },
  expiredBanner: {
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(getResponsiveSize(10)),
    paddingHorizontal: scale(getResponsiveSize(20)),
    marginHorizontal: scale(getResponsiveSize(20)),
    marginTop: verticalScale(getResponsiveSize(20)),
    borderRadius: moderateScale(getResponsiveSize(10)),
  },
  expiredBannerText: {
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: moderateScale(getResponsiveSize(14)),
    marginLeft: scale(getResponsiveSize(10)),
  },
});

export default Profile;