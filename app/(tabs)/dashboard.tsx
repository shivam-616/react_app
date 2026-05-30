import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { logoutUser } from "../../services/authService";
import {
  CategoryInsight,
  ExpenseEntry,
  fetchCategoryInsights,
  fetchUserExpenses,
} from "../../services/expenseService";

export default function DashboardScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [expenseData, insightData] = await Promise.all([
        fetchUserExpenses(),
        fetchCategoryInsights(),
      ]);
      setExpenses(expenseData);
      setInsights(insightData);
    } catch {
      setExpenses([]);
      setInsights([]);
      setError("Unable to sync. Pull down to try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses]),
  );

  const totalSpent = expenses.reduce((sum, item) => {
    const value = Number(item.amount) || 0;
    return sum + value;
  }, 0);

  const currency = expenses[0]?.currency || "INR";
  const topInsight = insights[0];

  const formatCurrency = (amount: number, selectedCurrency = currency) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
    return `${isNegative ? "-" : ""}${selectedCurrency} ${formatted}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return "Now";
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/");
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
      <View className="px-10 mb-12">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light">
            {today}
          </Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-white text-6xl font-light tracking-tighter">
          {formatCurrency(totalSpent)}
        </Text>
        <Text className="text-gray-500 uppercase tracking-widest text-[10px] mt-2 font-light">
          Month to Date Spent
        </Text>
        {topInsight ? (
          <Text className="text-gray-500 uppercase tracking-widest text-[10px] mt-6 font-light">
            Stillness Check: {topInsight.category} leads at{" "}
            {formatCurrency(topInsight.totalSpent)}
          </Text>
        ) : null}
      </View>

      <View className="flex-1">
        <View className="px-10 mb-4">
          <Text className="text-white uppercase tracking-[4px] text-xs font-light">
            Recent Activity
          </Text>
          {error ? (
            <Text className="text-red-500 uppercase tracking-widest text-[10px] mt-3 font-light">
              {error}
            </Text>
          ) : null}
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
              {expenses.map((item, index) => {
                const itemId = item.external_id || index.toString();
                return (
                  <View key={itemId} className="border-b border-gray-900">
                    <TouchableOpacity
                      onPress={() => setExpandedId(expandedId === itemId ? null : itemId)}
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
                        {formatCurrency(Number(item.amount) || 0, item.currency)}
                      </Text>
                    </TouchableOpacity>

                    {expandedId === itemId && (
                      <View className="pb-6 pl-4 border-l border-gray-900 mb-2">
                        <View className="gap-1">
                          <View className="flex-row">
                            <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light">
                              Category:{" "}
                            </Text>
                            <Text className="text-gray-500 text-[10px] uppercase tracking-widest font-light">
                              {item.category}
                            </Text>
                          </View>
                          <View className="flex-row">
                            <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light">
                              Currency:{" "}
                            </Text>
                            <Text className="text-gray-500 text-[10px] uppercase tracking-widest font-light">
                              {item.currency}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
              <View className="h-20" />
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
