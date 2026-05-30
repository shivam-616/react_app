import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { CategoryInsight, fetchCategoryInsights } from "../../services/expenseService";

export default function InsightsScreen() {
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCategoryInsights();
      // Sort categories from highest spending to lowest
      setInsights(data.sort((a, b) => b.totalSpent - a.totalSpent));
    } catch {
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [loadInsights]),
  );

  // Calculate totals to render the progress bars correctly
  const maxSpent = Math.max(...insights.map(i => i.totalSpent), 1);
  const totalSpent = insights.reduce((sum, item) => sum + item.totalSpent, 0);

 const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  if (isLoading && insights.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black pt-24 px-10">
      <View className="mb-12">
        <Text className="text-white text-4xl font-light tracking-tighter">
          Insights
        </Text>
        <Text className="text-gray-500 uppercase tracking-widest text-[10px] mt-2 font-light">
          Where your money goes
        </Text>
      </View>

      {insights.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 uppercase tracking-widest text-center text-xs font-light">
            No insights available yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadInsights} tintColor="white" />
          }
        >
          {insights.map((item, index) => {
            // Calculate what percentage this category is out of total spending
            const percentage = Math.round((item.totalSpent / totalSpent) * 100) || 0;
            // Bar width is relative to the absolute highest category (so the top one is always 100% wide)
            const barWidth = `${Math.max((item.totalSpent / maxSpent) * 100, 2)}%`;

            return (
              <View key={item.category || index.toString()} className="mb-10">
                <View className="flex-row justify-between items-end mb-2">
                  <Text className="text-white text-lg font-light tracking-wide uppercase">
                    {item.category}
                  </Text>
                  <Text className="text-gray-500 text-xs font-light">
                    {percentage}%
                  </Text>
                </View>
                
                <Text className="text-gray-400 text-sm font-light mb-4">
                  {formatCurrency(item.totalSpent)}
                </Text>

                {/* Custom Progress Bar */}
                <View className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-white rounded-full" 
                    style={{ width: barWidth as any }} 
                  />
                </View>
              </View>
            );
          })}
          <View className="h-20" />
        </ScrollView>
      )}
    </View>
  );
}