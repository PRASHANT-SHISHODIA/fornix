import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Image } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon1 from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Icon3 from 'react-native-vector-icons/MaterialIcons';
import Home from '../Screen/Home';
import Basicplan from '../Screen/Basicplan';
import Premiumplan from '../Screen/Premiumplan';
import AIscreen from '../Screen/AIscreen';
import Profile from '../Screen/Profile';
import useUserStore from '../store/useUserStore';

const TabNavigatorContent = () => {
  const TabNav = createBottomTabNavigator();
  const insets = useSafeAreaInsets();

  // Dynamic height calculation
  const TAB_BAR_BASE_HEIGHT = 60;
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;

  return (
    <TabNav.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#F87F16',
        tabBarInactiveTintColor: 'white',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          paddingTop: "5%",
          fontFamily: "Poppins-Medium"
        },
        tabBarStyle: {
          height: tabBarHeight,
          backgroundColor: '#1A3848',
          paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 8,
          paddingTop: 1,
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0,0,0,0.1)',
        },
        headerShown: false,
      }}>
      <TabNav.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon
              name="home-sharp"
              size={22}
              color={focused ? '#F87F16' : 'white'}
            />
          ),
        }}
      />
      <TabNav.Screen
        name="My Plan"
        component={Basicplan}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon
              name="star-outline"
              size={22.5}
              color={focused ? '#F87F16' : 'white'}
            />
          ),
        }}
      />
      {/* <TabNav.Screen
        name="Premium"
        component={Premiumplan}
        options={{
          tabBarIcon: ({focused}) => (
            <Icon2
              name="crown-outline"
              size={25}
              color={focused ? '#F87F16' : 'white'}
            />
          ),
        }}
      /> */}
      {/* <TabNav.Screen
        name="AI"
        component={AIscreen}
        initialParams={{ selectedCountry: null }}
        options={{
          tabBarIcon: ({focused}) => (
            <Icon2
              name="robot-outline"
              size={25}
              color={focused ? '#F87F16' : 'white'}
            />
          ),
        }}
      /> */}
      <TabNav.Screen
        name="Profile"
        component={Profile}
        initialParams={{ selectedCountry: null }}
        options={{
          tabBarIcon: ({ focused }) => {
            const profilePicture = useUserStore(state => state.profilePicture);

            if (profilePicture) {
              return (
                <Image
                  source={{ uri: profilePicture }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: focused ? 1.5 : 0,
                    borderColor: '#F87F16',
                  }}
                />
              );
            }

            return (
              <Icon2
                name="account"
                size={30}
                color={focused ? '#F87F16' : 'white'}
              />
            );
          },
        }}
      />
    </TabNav.Navigator>
  );
};

const TabNavigation = () => {
  return (
    <SafeAreaProvider>
      <TabNavigatorContent />
    </SafeAreaProvider>
  );
};

export default TabNavigation;