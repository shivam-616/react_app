import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Image,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { logoutUser } from "../../services/authService";
import { getUsername } from "../../services/apiClient";
import { updateUserProfile } from "../../services/userService";
import { fetchUserExpenses } from "../../services/expenseService";

const EXPORT_RANGES = ["This Week", "This Month", "Last Month", "All Time"];

export default function ProfileScreen() {
  const router = useRouter();
  
  // Display State
  const [username, setUsername] = useState<string>("User");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  // Settings Modal State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Export Modal State
  const [exportVisible, setExportVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const name = await getUsername();
      if (name) {
        setUsername(name);
        setFirstName(name);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/");
  };

  // --- IMAGE PICKER LOGIC ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3, // Compresses image to keep base64 string manageable
      base64: true, 
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfilePic(base64Image);
      
      // Instantly save the photo to the backend in the background
      await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone ? Number(phone) : null,
        profile_pc: base64Image,
      });
    }
  };

  // --- SAVE PROFILE LOGIC ---
  const handleSaveSettings = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Required", "First Name and Last Name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const success = await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone ? Number(phone) : null,
        profile_pc: profilePic || undefined,
      });

      if (success) {
        setUsername(firstName);
        setSettingsVisible(false);
      } else {
        Alert.alert("Error", "Could not save profile details.");
      }
    } catch {
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- CSV EXPORT LOGIC ---
  const handleExport = async (range: string) => {
    setExportLoading(true);
    try {
      const allExpenses = await fetchUserExpenses();
      if (!allExpenses || allExpenses.length === 0) {
        Alert.alert("No Data", "You don't have any expenses to export.");
        setExportLoading(false);
        return;
      }

      // Filter by range (same logic as dashboard)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let filtered = allExpenses;

      if (range === "This Month") {
        filtered = allExpenses.filter(exp => new Date(exp.timestamp).getMonth() === currentMonth && new Date(exp.timestamp).getFullYear() === currentYear);
      } else if (range === "Last Month") {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        filtered = allExpenses.filter(exp => new Date(exp.timestamp).getMonth() === lastMonthDate.getMonth() && new Date(exp.timestamp).getFullYear() === lastMonthDate.getFullYear());
      } else if (range === "This Week") {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        firstDayOfWeek.setHours(0, 0, 0, 0);
        filtered = allExpenses.filter(exp => new Date(exp.timestamp) >= firstDayOfWeek);
      }

      if (filtered.length === 0) {
        Alert.alert("No Data", `No expenses found for ${range}.`);
        setExportLoading(false);
        return;
      }

      // Create CSV String
      const header = "Date,Merchant,Category,Amount,Currency\n";
      const rows = filtered.map(exp => {
        const d = new Date(exp.timestamp).toLocaleDateString("en-US");
        const m = `"${exp.merchant.replace(/"/g, '""')}"`; // Escape quotes
        return `${d},${m},${exp.category},${exp.amount},${exp.currency || 'INR'}`;
      }).join("\n");
      const csvString = header + rows;

      // Write to File System
      const fileName = `Expenses_${range.replace(" ", "_")}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });

      // Open Share Sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Expenses' });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
      setExportVisible(false);
    } catch (e) {
      Alert.alert("Error", "Failed to generate export file.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black pt-24 px-10">
      
      {/* HEADER */}
      <View className="mb-10">
        <Text className="text-white text-4xl font-light tracking-tighter">
          Profile
        </Text>
        <Text className="text-gray-500 uppercase tracking-widest text-[10px] mt-2 font-light">
          Your Account
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* AVATAR & USERNAME */}
        <View className="items-center mb-12 mt-4">
          <TouchableOpacity 
            onPress={pickImage}
            activeOpacity={0.8}
            className="w-32 h-32 bg-[#111111] rounded-full justify-center items-center mb-6 border border-gray-800 shadow-xl relative"
          >
            {profilePic ? (
              <Image source={{ uri: profilePic }} className="w-full h-full rounded-full" />
            ) : (
              <Text className="text-white text-5xl font-light uppercase">
                {username.charAt(0)}
              </Text>
            )}
            
            {/* Camera Icon Badge */}
            <View className="absolute bottom-0 right-2 bg-white w-8 h-8 rounded-full justify-center items-center border-2 border-black">
              <Feather name="camera" size={14} color="black" />
            </View>
          </TouchableOpacity>

          <Text className="text-white text-2xl font-light tracking-wide">
            {username}
          </Text>
        </View>

        {/* SETTINGS CARDS */}
        <View className="bg-[#111111] border border-gray-900 rounded-[32px] overflow-hidden mb-10 shadow-xl">
          <TouchableOpacity 
            onPress={() => setSettingsVisible(true)}
            className="py-6 px-6 border-b border-gray-900/60 flex-row justify-between items-center"
          >
            <View className="flex-row items-center">
              <Feather name="user" size={18} color="#9ca3af" style={{ marginRight: 16 }} />
              <Text className="text-white text-lg font-light tracking-wide">Account Details</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#4b5563" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setExportVisible(true)}
            className="py-6 px-6 flex-row justify-between items-center"
          >
            <View className="flex-row items-center">
              <Feather name="download-cloud" size={18} color="#9ca3af" style={{ marginRight: 16 }} />
              <Text className="text-white text-lg font-light tracking-wide">Export CSV Data</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#4b5563" />
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-[#1a0f0f] border border-red-900/30 rounded-full h-16 justify-center items-center mb-10"
        >
          <Text className="text-red-500 font-bold uppercase tracking-widest text-xs">
            Sign Out
          </Text>
        </TouchableOpacity>
        <View className="h-20" />
      </ScrollView>

      {/* --- EXPORT MODAL --- */}
      <Modal visible={exportVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#111111] border-t border-gray-900 pt-8 px-10 pb-16 rounded-t-[32px] shadow-2xl">
            <Text className="text-white text-2xl font-light tracking-tighter mb-4">
              Export Data
            </Text>
            <Text className="text-gray-500 font-light text-sm mb-8">
              Select a date range to generate and download a CSV file of your expenses.
            </Text>
            
            {exportLoading ? (
              <View className="py-10 items-center justify-center">
                <ActivityIndicator color="white" size="large" />
                <Text className="text-gray-500 mt-4 uppercase tracking-widest text-[10px]">Generating CSV...</Text>
              </View>
            ) : (
              <>
                {EXPORT_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range}
                    onPress={() => handleExport(range)}
                    className="py-5 border-b border-gray-900 flex-row justify-between items-center"
                  >
                    <Text className="text-lg font-light text-white">
                      {range}
                    </Text>
                    <Feather name="download" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </>
            )}

            <TouchableOpacity
              onPress={() => setExportVisible(false)}
              disabled={exportLoading}
              className="mt-8 border border-gray-800 rounded-full h-14 justify-center items-center"
            >
              <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- ACCOUNT SETTINGS MODAL --- */}
      <Modal visible={settingsVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#111111] border-t border-gray-900 pt-8 px-10 pb-20 rounded-t-[32px] shadow-2xl">
            <Text className="text-white text-2xl font-light tracking-tighter mb-8">
              Edit Profile
            </Text>

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-gray-500 uppercase tracking-widest text-[10px] mb-2">First Name</Text>
                <TextInput
                  className="text-white text-lg py-2 border-b border-gray-800"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  placeholderTextColor="#444"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 uppercase tracking-widest text-[10px] mb-2">Last Name</Text>
                <TextInput
                  className="text-white text-lg py-2 border-b border-gray-800"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  placeholderTextColor="#444"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-gray-500 uppercase tracking-widest text-[10px] mb-2">Email</Text>
              <TextInput
                className="text-white text-lg py-2 border-b border-gray-800"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="john@example.com"
                placeholderTextColor="#444"
              />
            </View>

            <View className="mb-10">
              <Text className="text-gray-500 uppercase tracking-widest text-[10px] mb-2">Phone Number</Text>
              <TextInput
                className="text-white text-lg py-2 border-b border-gray-800"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="1234567890"
                placeholderTextColor="#444"
              />
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
                className="flex-1 border border-gray-800 rounded-full h-14 justify-center items-center"
              >
                <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSettings}
                disabled={isSaving}
                className="flex-1 bg-white rounded-full h-14 justify-center items-center"
              >
                {isSaving ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black font-bold uppercase tracking-widest text-[10px]">Save Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}