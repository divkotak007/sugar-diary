import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import GlucoseLogScreen from '../screens/GlucoseLogScreen';
import InsulinLogScreen from '../screens/InsulinLogScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="GlucoseLog"
                    component={GlucoseLogScreen}
                    options={{ title: 'Log Glucose' }}
                />
                <Stack.Screen
                    name="InsulinLog"
                    component={InsulinLogScreen}
                    options={{ title: 'Log Insulin' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
