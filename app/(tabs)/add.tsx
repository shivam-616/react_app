import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { addExpense } from "../../services/expenseService";

const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Health", "Other"];

export default function AddExpenseScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!amount || !merchant) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      const success = await addExpense({
        merchant,
        amount: numericAmount,
        category,
        currency: "USD",
      });

      if (success) {
        router.back();
      } else {
        Alert.alert("Error", "Failed to save expense. Please try again.");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black pt-24 px-10"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <View className="mb-12">
          <Text className="text-gray-500 uppercase tracking-widest text-xs mb-4">
            Amount
          </Text>
          <View className="flex-row items-center">
            <Text className="text-white text-5xl font-light mr-2">$</Text>
            <TextInput
              className="text-white text-7xl font-light flex-1"
              placeholder="0.00"
              placeholderTextColor="#222"
              keyboardType="decimal-pad"
              autoFocus
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* Merchant Input */}
        <View className="mb-12">
          <Text className="text-gray-500 uppercase tracking-widest text-xs mb-2">
            Merchant
          </Text>
          <TextInput
            className="text-white text-2xl py-3 border-b border-gray-900"
            placeholder="Where did you spend?"
            placeholderTextColor="#444"
            value={merchant}
            onChangeText={setMerchant}
          />
        </View>

        {/* Category Selection */}
        <View className="mb-12">
          <Text className="text-gray-500 uppercase tracking-widest text-xs mb-6">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                className={`px-6 py-3 rounded-full border ${
                  category === cat
                    ? "bg-white border-white"
                    : "bg-black border-gray-800"
                }`}
              >
                <Text
                  className={`uppercase tracking-widest text-[10px] font-bold ${
                    category === cat ? "text-black" : "text-gray-500"
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className="bg-white rounded-full h-16 justify-center items-center mb-10"
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black font-bold uppercase tracking-widest">
              Save Expense
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
