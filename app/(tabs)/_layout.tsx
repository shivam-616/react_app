import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

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
            <Ionicons
              name="leaf-outline"
              size={24}
              color={focused ? "white" : "#4b5563"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="add-circle-outline"
              size={27}
              color={focused ? "white" : "#4b5563"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
