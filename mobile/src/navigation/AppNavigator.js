import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import GlucoseLogScreen from '../screens/GlucoseLogScreen';
import InsulinLogScreen from '../screens/InsulinLogScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CalendarScreen from '../screens/CalendarScreen';

const Stack = createStackNavigator();

export default function AppNavigator({ user }) {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ headerShown: false }}
                    initialParams={{ user }}
                />
                <Stack.Screen
                    name="GlucoseLog"
                    component={GlucoseLogScreen}
                    options={{ title: 'Log Glucose' }}
                    initialParams={{ user }}
                />
                <Stack.Screen
                    name="InsulinLog"
                    component={InsulinLogScreen}
                    options={{ title: 'Log Insulin' }}
                    initialParams={{ user }}
                />
                <Stack.Screen
                    name="Calendar"
                    component={CalendarScreen}
                    options={{ title: 'Calendar View' }}
                    initialParams={{ user }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: 'Settings' }}
                    initialParams={{ user }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
