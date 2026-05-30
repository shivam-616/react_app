import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { loginUser } from "../services/authService";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const success = await loginUser(username, password);
      if (success) {
        router.replace("/(tabs)/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black px-10 pt-32"
    >
      <View className="mb-12">
        <Text className="text-white text-4xl font-light uppercase tracking-[8px]">Sign In</Text>
      </View>

      <View className="gap-10">
        <View>
          <Text className="text-gray-500 uppercase tracking-widest text-xs mb-2">Username</Text>
          <TextInput
            className={`text-white text-lg py-3 border-b ${
              usernameFocused ? "border-white" : "border-gray-800"
            }`}
            placeholder="johndoe"
            placeholderTextColor="#444"
            value={username}
            onChangeText={setUsername}
            onFocus={() => setUsernameFocused(true)}
            onBlur={() => setUsernameFocused(false)}
            autoCapitalize="none"
          />
        </View>

        <View>
          <Text className="text-gray-500 uppercase tracking-widest text-xs mb-2">Password</Text>
          <TextInput
            className={`text-white text-lg py-3 border-b ${
              passwordFocused ? "border-white" : "border-gray-800"
            }`}
            placeholder="Password"
            placeholderTextColor="#444"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            secureTextEntry
          />
        </View>

        {error ? <Text className="text-red-500 text-sm mt-2">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className="bg-white rounded-full h-16 justify-center items-center mt-8"
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black font-bold uppercase tracking-widest">Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} className="items-center">
          <Text className="text-gray-500 uppercase tracking-widest text-xs">Go Back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
