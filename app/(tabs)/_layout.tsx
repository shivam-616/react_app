import React from "react";
import { Tabs } from "expo-router";
import { View, Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "black",
          borderTopColor: "#111",
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 20,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <Text
              className={`text-3xl ${focused ? "text-white" : "text-gray-600"}`}
            >
              ⌂
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ focused }) => (
            <Text
              className={`text-3xl ${focused ? "text-white" : "text-gray-600"}`}
            >
              +
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
