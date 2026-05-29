import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchUserExpenses, AddDTO } from "../../services/expenseService";

export default function DashboardScreen() {
  const [expenses, setExpenses] = useState<AddDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserExpenses();
      setExpenses(data || []);
    } catch (err) {
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  // Safely compute total
  const totalSpent = expenses.reduce((sum, item) => {
    const val = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount as any) || 0;
    return sum + val;
  }, 0);

  // Robust currency formatter
  const formatCurrency = (amount: number) => {
    try {
      const isNegative = amount < 0;
      const absAmount = Math.abs(amount);
      const formatted = absAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
      return `${isNegative ? "-" : ""}$${formatted}`;
    } catch (e) {
      return `$${amount || 0}`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (isLoading && expenses.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black pt-24">
      {/* Header Section */}
      <View className="px-10 mb-12">
        <Text className="text-gray-500 uppercase tracking-widest text-[10px] mb-2 font-light">
          {today}
        </Text>
        <Text className="text-white text-6xl font-light tracking-tighter">
          {formatCurrency(totalSpent)}
        </Text>
        <Text className="text-gray-500 uppercase tracking-widest text-[10px] mt-2 font-light">
          Month to Date Spent
        </Text>
      </View>

      {/* Transactions List */}
      <View className="flex-1">
        <View className="px-10 mb-4">
          <Text className="text-white uppercase tracking-[4px] text-xs font-light">
            Recent Activity
          </Text>
        </View>

        {expenses.length === 0 ? (
          <View className="flex-1 justify-center items-center px-10">
            <Text className="text-gray-500 uppercase tracking-widest text-center text-xs font-light">
              No transactions yet.{"\n"}Tap + to add one.
            </Text>
          </View>
        ) : (
          <ScrollView 
            className="flex-1"
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={loadExpenses} tintColor="white" />
            }
          >
            <View className="px-10">
              {expenses.map((item, index) => (
                <View key={item.external_id || index.toString()} className="border-b border-gray-900">
                  <TouchableOpacity
                    onPress={() => setExpandedId(expandedId === item.external_id ? null : item.external_id)}
                    activeOpacity={0.7}
                    className="py-6 flex-row justify-between items-center"
                  >
                    <View className="flex-1">
                      <Text className="text-white text-lg font-light tracking-wide">
                        {item.merchant}
                      </Text>
                      <Text className="text-gray-500 text-[10px] uppercase tracking-widest font-light mt-1">
                        {formatDate(item.timestamp)}
                      </Text>
                    </View>
                    <Text className="text-white text-lg font-light">
                      {formatCurrency(item.amount)}
                    </Text>
                  </TouchableOpacity>

                  {expandedId === item.external_id && (
                    <View className="pb-6 pl-4 border-l border-gray-900 mb-2">
                      <View className="gap-1">
                        <View className="flex-row">
                          <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light">Category: </Text>
                          <Text className="text-gray-500 text-[10px] uppercase tracking-widest font-light">{item.category}</Text>
                        </View>
                        <View className="flex-row">
                          <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light">Currency: </Text>
                          <Text className="text-gray-500 text-[10px] uppercase tracking-widest font-light">{item.currency}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ))}
              <View className="h-20" />
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
