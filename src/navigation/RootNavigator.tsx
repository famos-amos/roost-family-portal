import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ChoresScreen } from '../screens/ChoresScreen';
import { MealPlansScreen } from '../screens/MealPlansScreen';
import { BoardsScreen } from '../screens/BoardsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { GroceryListScreen } from '../screens/GroceryListScreen';
import { RecipesScreen } from '../screens/RecipesScreen';
import { SuggestionsScreen } from '../screens/SuggestionsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Chores" component={ChoresScreen} />
        <Stack.Screen name="MealPlans" component={MealPlansScreen} />
        <Stack.Screen name="Boards" component={BoardsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="GroceryList" component={GroceryListScreen} />
        <Stack.Screen name="Recipes" component={RecipesScreen} />
        <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
