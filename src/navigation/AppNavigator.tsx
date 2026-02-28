import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useStore } from '../store/index';

import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { MyStyleScreen } from '../screens/MyStyleScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DiscoverTab({ navigation }: { navigation: any }) {
  return (
    <DiscoverScreen navigation={navigation} />
  );
}

function MyStyleTab({ navigation }: { navigation: any }) {
  return (
    <MyStyleScreen navigation={navigation} />
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverTab}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18 }}>{focused ? '💫' : '○'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MyStyle"
        component={MyStyleTab}
        options={{
          tabBarLabel: 'My Style',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18 }}>{focused ? '💾' : '◯'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const profile = useStore(s => s.profile);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!profile?.hasOnboarded ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{
              animationEnabled: false,
            }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{
              animationEnabled: false,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
