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
import { Feather } from "@expo/vector-icons";
import { addExpense, submitSmsForExtraction } from "../../services/expenseService";

const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Health", "Other"];

type EntryMode = "manual" | "sms" | "image";
const MODES: { id: EntryMode; label: string; icon: any }[] = [
  { id: "manual", label: "Manual", icon: "edit-2" },
  { id: "sms", label: "SMS", icon: "message-square" },
  { id: "image", label: "Scan", icon: "camera" },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<EntryMode>("manual");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food");
  const [sms, setSms] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (mode === "image") {
      Alert.alert("Coming Soon", "Receipt scanning is not yet available.");
      return;
    }

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

    // Manual Save Logic
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
      className="flex-1 bg-black pt-24"
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* --- HEADER & MODE SELECTOR --- */}
        <View className="px-10 mb-8">
          <Text className="text-white text-3xl font-light tracking-tighter mb-8">
            Add Expense
          </Text>

          <View className="flex-row bg-[#111111] border border-gray-900 rounded-[32px] p-1.5">
            {MODES.map((entryMode) => (
              <TouchableOpacity
                key={entryMode.id}
                onPress={() => setMode(entryMode.id)}
                className={`flex-1 flex-row h-12 rounded-[28px] justify-center items-center ${
                  mode === entryMode.id ? "bg-white" : "bg-transparent"
                }`}
              >
                <Feather 
                  name={entryMode.icon} 
                  size={14} 
                  color={mode === entryMode.id ? "black" : "#6b7280"} 
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`uppercase tracking-widest text-[10px] font-bold ${
                    mode === entryMode.id ? "text-black" : "text-gray-500"
                  }`}
                >
                  {entryMode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- MANUAL MODE --- */}
        {mode === "manual" && (
          <View className="px-6">
            <View className="bg-[#111111] border border-gray-900 rounded-[32px] p-8 mb-6 shadow-xl">
              
              <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light mb-2">
                Amount
              </Text>
              <View className="flex-row items-center border-b border-gray-800 pb-4 mb-8">
                <Text className="text-white text-4xl font-light mr-3 pb-1">₹</Text>
                <TextInput
                  className="text-white text-4xl font-light flex-1"
                  placeholder="0.00"
                  placeholderTextColor="#333"
                  keyboardType="decimal-pad"
                  autoFocus
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light mb-2">
                Merchant
              </Text>
              <TextInput
                className="text-white text-xl py-2 border-b border-gray-800 mb-2"
                placeholder="Where did you spend?"
                placeholderTextColor="#333"
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>

            <View className="bg-[#111111] border border-gray-900 rounded-[32px] p-8 mb-10 shadow-xl">
              <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light mb-6">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-5 py-3 rounded-full border ${
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
          </View>
        )}

        {/* --- SMS MODE --- */}
        {mode === "sms" && (
          <View className="px-6 mb-10">
            <View className="bg-[#111111] border border-gray-900 rounded-[32px] p-8 shadow-xl">
              <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light mb-4">
                Paste Bank SMS
              </Text>
              <TextInput
                className="text-white text-lg min-h-[160px] py-4 border-b border-gray-800 mb-6"
                placeholder="e.g. Spent Rs. 500 at Starbucks via..."
                placeholderTextColor="#333"
                value={sms}
                onChangeText={setSms}
                multiline
                textAlignVertical="top"
              />
              <View className="flex-row items-center">
                <Feather name="cpu" size={14} color="#6b7280" style={{ marginRight: 8 }} />
                <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light flex-1">
                  AI will extract merchant, amount, category, and date automatically.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* --- IMAGE (COMING SOON) MODE --- */}
        {mode === "image" && (
          <View className="px-6 mb-10">
            <View className="bg-[#111111] border border-gray-900 rounded-[32px] p-10 items-center justify-center min-h-[350px] shadow-xl">
              <View className="w-24 h-24 bg-gray-900 rounded-full items-center justify-center mb-6 border border-gray-800">
                <Feather name="camera" size={32} color="#9ca3af" />
              </View>
              
              <Text className="text-white text-2xl font-light mb-3">Scan Receipt</Text>
              
              <View className="bg-gray-800/80 px-4 py-1.5 rounded-full mb-6 border border-gray-700">
                <Text className="text-gray-300 text-[10px] uppercase tracking-widest font-bold">
                  Coming Soon
                </Text>
              </View>

              <Text className="text-gray-500 text-center font-light leading-relaxed text-sm">
                Soon you will be able to snap a photo of your physical bill. Our AI will read the receipt and instantly log the details.
              </Text>
            </View>
          </View>
        )}

        {/* --- SAVE BUTTON --- */}
        <View className="px-10">
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || mode === "image"}
            className={`rounded-full h-16 justify-center items-center shadow-lg ${
              mode === "image" ? "bg-gray-900" : "bg-white"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text className={`font-bold uppercase tracking-widest ${
                mode === "image" ? "text-gray-500" : "text-black"
              }`}>
                {mode === "manual" ? "Save Expense" : mode === "sms" ? "Queue SMS" : "Not Available"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}