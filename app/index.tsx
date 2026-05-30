import React, { useEffect, useState, useRef } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { isSessionActive } from "../services/authService";

export default function WelcomeScreen() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  // --- ENTRANCE ANIMATION VALUES ---
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(30)).current; 
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(30)).current; 

  // --- BACKGROUND ANIMATION VALUE ---
  const bgFloatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const active = await isSessionActive();
        if (active) {
          router.replace("/(tabs)/dashboard");
        } else {
          startEntranceAnimation();
        }
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [router]);

  const startEntranceAnimation = () => {
    Animated.stagger(250, [
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(heroTranslateY, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(buttonTranslateY, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgFloatAnim, {
          toValue: 1,
          duration: 12000, 
          useNativeDriver: true,
        }),
        Animated.timing(bgFloatAnim, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Expanded to Array(60) to guarantee it reaches the absolute top and bottom
  const row = "₹       ₹       ₹       ₹       ₹       ₹       ₹       ₹       ₹       ₹       ₹";
  const bgPattern = Array(60).fill(row).join("\n\n");

  if (checkingSession) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black overflow-hidden relative">
      
      {/* --- LAYER 1: SUBTLE ANIMATED BACKGROUND TEXTURE --- */}
      <Animated.View 
        pointerEvents="none" 
        className="absolute -inset-[150px] justify-center items-center opacity-[0.05]"
        style={{
          transform: [{
            translateY: bgFloatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-40, 40] 
            })
          }]
        }}
      >
        <Text className="text-white text-xl font-bold tracking-[10px] text-center leading-[30px]">
          {bgPattern}
        </Text>
      </Animated.View>

      {/* --- LAYER 2: THE TARGETED "DISAPPEAR" MASK --- */}
      
      {/* Top Fade: Allows symbols at the very top edge, then fades into black */}
      <View pointerEvents="none" className="absolute top-[10%] left-0 right-0 h-8 bg-black/40 z-0" />
      <View pointerEvents="none" className="absolute top-[10%] mt-8 left-0 right-0 h-8 bg-black/80 z-0" />
      
      {/* Solid Black Band: Perfectly positioned directly behind the text */}
      <View pointerEvents="none" className="absolute top-[10%] mt-16 left-0 right-0 h-[30%] bg-black z-0" />
      
      {/* Bottom Fade: Fades back out so symbols appear behind the buttons */}
      <View pointerEvents="none" className="absolute top-[40%] mt-16 left-0 right-0 h-8 bg-black/80 z-0" />
      <View pointerEvents="none" className="absolute top-[40%] mt-24 left-0 right-0 h-8 bg-black/50 z-0" />
      <View pointerEvents="none" className="absolute top-[40%] mt-32 left-0 right-0 h-8 bg-black/20 z-0" />

      {/* --- LAYER 3: FOREGROUND CONTENT --- */}
      <View className="flex-1 justify-between py-24 px-10 z-10">
        
        {/* HERO SECTION */}
        <Animated.View 
          className="mt-20"
          style={{
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslateY }]
          }}
        >
          <Text className="text-white text-6xl font-light tracking-tighter mb-4 leading-[64px]">
            Clarity{"\n"}in your{"\n"}finances.
          </Text>
          
          <Text className="text-gray-500 uppercase tracking-widest text-xs font-light">
            Track Every Rupee.
          </Text>
        </Animated.View>

        {/* ACTION BUTTONS */}
        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }]
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
            className="bg-white rounded-full h-16 justify-center items-center shadow-lg mb-2"
          >
            <Text className="text-black font-bold uppercase tracking-widest text-[10px]">
              Log In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/signup")}
            activeOpacity={0.8}
            className="items-center py-5"
          >
            <Text className="text-gray-400 text-xs font-light">
              Don't have an account? <Text className="text-white font-medium">Sign up</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
      </View>
    </View>
  );
}