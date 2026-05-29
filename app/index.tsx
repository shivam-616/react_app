import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  const dollarPattern = Array(20).fill("$$$$$$$$$$$$$$$").join("\n");

  return (
    <View className="flex-1 bg-black justify-between py-20 px-10">
      {/* Background Texture */}
      <View className="absolute inset-0 opacity-10 flex justify-center items-center">
        <Text className="text-white text-4xl leading-[60px] tracking-[10px] text-center">
          {dollarPattern}
        </Text>
      </View>

      <View className="flex-1 justify-center items-center">
        <Text className="text-white text-6xl font-light text-center uppercase tracking-widest">
          Expense{"\n"}Tracker
        </Text>
      </View>

      <View className="gap-6">
        <TouchableOpacity
          onPress={() => router.push("/signup")}
          className="bg-white rounded-full h-16 justify-center items-center"
        >
          <Text className="text-black font-bold uppercase tracking-widest">Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/login")}
          className="border-[1px] border-gray-800 rounded-full h-16 justify-center items-center"
        >
          <Text className="text-white font-bold uppercase tracking-widest">Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
