import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { addExpense, submitSmsForExtraction } from "../../services/expenseService";

const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Health", "Other"];
type EntryMode = "manual" | "sms";

export default function AddExpenseScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<EntryMode>("manual");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food");
  const [sms, setSms] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (mode === "sms") {
      if (!sms.trim()) {
        Alert.alert("Error", "Paste an SMS first.");
        return;
      }

      setLoading(true);
      try {
        const success = await submitSmsForExtraction(sms.trim());
        if (success) {
          router.back();
        } else {
          Alert.alert("Error", "The SMS could not be queued.");
        }
      } catch {
        Alert.alert("Error", "Something went wrong.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!amount || !merchant) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount)) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      const success = await addExpense({
        merchant,
        amount: numericAmount,
        category,
        currency: "INR",
      });

      if (success) {
        router.back();
      } else {
        Alert.alert("Error", "Failed to save expense. Please try again.");
      }
    } catch {
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
        <View className="flex-row border border-gray-900 rounded-full p-1 mb-12">
          {(["manual", "sms"] as EntryMode[]).map((entryMode) => (
            <TouchableOpacity
              key={entryMode}
              onPress={() => setMode(entryMode)}
              className={`flex-1 h-11 rounded-full justify-center items-center ${
                mode === entryMode ? "bg-white" : "bg-black"
              }`}
            >
              <Text
                className={`uppercase tracking-widest text-[10px] font-bold ${
                  mode === entryMode ? "text-black" : "text-gray-500"
                }`}
              >
                {entryMode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === "manual" ? (
          <>
            <View className="mb-12">
              <Text className="text-gray-500 uppercase tracking-widest text-xs mb-4">
                Amount
              </Text>
              <View className="flex-row items-center">
                <Text className="text-white text-4xl font-light mr-3">INR</Text>
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
          </>
        ) : (
          <View className="mb-12">
            <Text className="text-gray-500 uppercase tracking-widest text-xs mb-4">
              Bank SMS
            </Text>
            <TextInput
              className="text-white text-lg min-h-48 py-5 px-0 border-b border-gray-900"
              placeholder="Paste the transaction message here."
              placeholderTextColor="#444"
              value={sms}
              onChangeText={setSms}
              multiline
              textAlignVertical="top"
            />
            <Text className="text-gray-600 uppercase tracking-widest text-[10px] mt-4 font-light">
              The backend will extract merchant, amount, category, and date.
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className="bg-white rounded-full h-16 justify-center items-center mb-10"
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black font-bold uppercase tracking-widest">
              {mode === "manual" ? "Save Expense" : "Queue SMS"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
