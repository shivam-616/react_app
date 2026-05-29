import React from "react";
import { View, Text, ScrollView } from "react-native";

const DUMMY_TRANSACTIONS = [
  { id: "1", merchant: "Apple Store", amount: -1299.0, date: "May 28" },
  { id: "2", merchant: "Salary", amount: 4500.0, date: "May 25" },
  { id: "3", merchant: "Whole Foods", amount: -84.21, date: "May 24" },
  { id: "4", merchant: "Netflix", amount: -15.99, date: "May 23" },
  { id: "5", merchant: "Gas Station", amount: -45.0, date: "May 22" },
  { id: "6", merchant: "Freelance Project", amount: 1200.0, date: "May 20" },
  { id: "7", merchant: "Uber", amount: -22.5, date: "May 19" },
];

export default function DashboardScreen() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View className="flex-1 bg-black pt-24">
      {/* Header Section */}
      <View className="px-10 mb-12">
        <Text className="text-gray-500 uppercase tracking-widest text-xs mb-2">
          {today}
        </Text>
        <Text className="text-white text-6xl font-light tracking-tighter">
          $3,182.21
        </Text>
        <Text className="text-gray-600 uppercase tracking-widest text-[10px] mt-2">
          Month to Date Spent
        </Text>
      </View>

      {/* Transactions List */}
      <View className="flex-1">
        <View className="px-10 mb-4">
          <Text className="text-white uppercase tracking-[4px] text-sm font-bold">
            Recent Activity
          </Text>
        </View>
        <ScrollView className="flex-1 px-10">
          {DUMMY_TRANSACTIONS.map((item) => (
            <View
              key={item.id}
              className="py-6 border-b border-gray-900 flex-row justify-between items-center"
            >
              <View>
                <Text className="text-white text-lg font-medium">
                  {item.merchant}
                </Text>
                <Text className="text-gray-600 text-xs uppercase tracking-widest mt-1">
                  {item.date}
                </Text>
              </View>
              <Text
                className={`text-xl ${
                  item.amount > 0 ? "text-white" : "text-gray-500"
                }`}
              >
                {item.amount > 0 ? "+" : ""}
                {item.amount.toFixed(2)}
              </Text>
            </View>
          ))}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
}
