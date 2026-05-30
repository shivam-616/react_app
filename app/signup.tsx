import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { registerUser } from "../services/authService";

type FormKey = "firstName" | "lastName" | "username" | "email" | "phoneNumber" | "password";

export default function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState<Record<FormKey, string>>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const success = await registerUser(form);
      if (success.ok) {
        router.replace("/(tabs)/dashboard");
      } else {
        setError(success.message || "Registration failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    key: FormKey,
    placeholder: string,
    keyboardType: "default" | "email-address" | "phone-pad" = "default",
    secure = false,
  ) => (
    <View className="mb-8">
      <Text className="text-gray-500 uppercase tracking-widest text-xs mb-2">{label}</Text>
      <TextInput
        className={`text-white text-lg py-3 border-b ${
          focusedField === key ? "border-white" : "border-gray-800"
        }`}
        placeholder={placeholder}
        placeholderTextColor="#444"
        value={form[key]}
        onChangeText={(val) => setForm({ ...form, [key]: val })}
        onFocus={() => setFocusedField(key)}
        onBlur={() => setFocusedField("")}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize={key === "email" || key === "username" ? "none" : "words"}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
    >
      <ScrollView className="flex-1 px-10 pt-20">
        <View className="mb-12">
          <Text className="text-white text-4xl font-light uppercase tracking-[8px]">Sign Up</Text>
        </View>

        {renderInput("First Name", "firstName", "John")}
        {renderInput("Last Name", "lastName", "Doe")}
        {renderInput("Username", "username", "johndoe")}
        {renderInput("Email Address", "email", "john@example.com", "email-address")}
        {renderInput("Phone Number", "phoneNumber", "9876543210", "phone-pad")}
        {renderInput("Password", "password", "Password", "default", true)}

        {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          className="bg-white rounded-full h-16 justify-center items-center mt-4 mb-20"
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black font-bold uppercase tracking-widest">Register</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
