import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons"; // <-- Import the icon library

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // <-- This removes the text labels
        tabBarStyle: { 
          backgroundColor: 'black', 
          borderTopColor: '#111',
          height: 85, // Slightly taller to center the icons perfectly
          paddingTop: 15,
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: '#444', // Dark gray for inactive tabs
      }}
    >
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          )
        }} 
      />
      
      <Tabs.Screen 
        name="insights" 
        options={{ 
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={24} color={color} />
          )
        }} 
      />
      
      <Tabs.Screen 
        name="add" 
        options={{ 
          tabBarIcon: ({ color }) => (
            // Made the plus icon slightly larger since it's the primary action
            <Feather name="plus-circle" size={32} color={color} /> 
          )
        }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{ 
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          )
        }} 
      />
    </Tabs>
  );
}