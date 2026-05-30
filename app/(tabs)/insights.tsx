import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated, // <-- Imported Animated!
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { 
  CategoryInsight, 
  ExpenseEntry, 
  fetchCategoryInsights, 
  fetchUserExpenses 
} from "../../services/expenseService";

type InsightView = "menu" | "categories" | "burnRate";

// --- NEW ANIMATED COMPONENT FOR CATEGORIES ---
const AnimatedCategoryItem = ({ item, maxSpent, totalSpent, index, formatCurrency, isLast }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Staggered fade in and slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100, // Delays each item slightly more than the last
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      // 2. Smoothly fill the progress bar right after it fades in
      Animated.timing(fillAnim, {
        toValue: (item.totalSpent / maxSpent) * 100,
        duration: 800,
        delay: index * 100 + 300, 
        useNativeDriver: false, // width animations don't support native driver
      }),
    ]).start();
  }, [item.totalSpent, maxSpent]);

  const percentage = Math.round((item.totalSpent / totalSpent) * 100) || 0;

  return (
    <Animated.View 
      style={{ opacity: fadeAnim, transform: [{ translateY }] }} 
      className={isLast ? "mb-2" : "mb-8"}
    >
      <View className="flex-row justify-between items-end mb-2">
        <Text className="text-white text-base font-light tracking-wide uppercase">
          {item.category}
        </Text>
        <Text className="text-gray-500 text-[10px] font-bold">
          {percentage}%
        </Text>
      </View>
      
      <Text className="text-gray-400 text-xs font-light mb-4">
        {formatCurrency(item.totalSpent)}
      </Text>

      <View className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
        <Animated.View 
          className="h-full bg-white rounded-full" 
          style={{ 
            width: fillAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            }) 
          }} 
        />
      </View>
    </Animated.View>
  );
};

export default function InsightsScreen() {
  const [activeView, setActiveView] = useState<InsightView>("menu");
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [currentMonthSpend, setCurrentMonthSpend] = useState(0);
  
  // Budget State
  const [monthlyBudget, setMonthlyBudget] = useState<number>(50000);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editBudgetInput, setEditBudgetInput] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const catData = await fetchCategoryInsights();
      if (Array.isArray(catData)) {
        setInsights(catData.sort((a, b) => b.totalSpent - a.totalSpent));
      }

      const allExpenses = await fetchUserExpenses();
      if (Array.isArray(allExpenses)) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthExpenses = allExpenses.filter((exp) => {
          if (!exp.timestamp) return false;
          const d = new Date(exp.timestamp);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const total = thisMonthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        setCurrentMonthSpend(total);
      }
    } catch {
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeView === "menu") {
        loadData();
      }
    }, [loadData, activeView])
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  const handleSaveBudget = () => {
    const num = parseFloat(editBudgetInput);
    if (!Number.isNaN(num) && num > 0) {
      setMonthlyBudget(num);
    }
    setBudgetModalVisible(false);
  };

  // --- VIEW 1: THE HUB MENU ---
  if (activeView === "menu") {
    return (
      <View className="flex-1 bg-black pt-24 px-8">
        <View className="mb-10">
          <Text className="text-white text-4xl font-light tracking-tighter">
            Insights
          </Text>
          <Text className="text-gray-500 uppercase tracking-widest text-[10px] mt-2 font-light">
            Analyze your habits
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="white" />
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between gap-y-4">
            
            <TouchableOpacity 
              onPress={() => setActiveView("categories")}
              activeOpacity={0.8}
              className="w-[48%] aspect-square bg-[#111111] border border-gray-900 rounded-3xl p-5 justify-between shadow-xl"
            >
              <View className="w-12 h-12 bg-gray-900 rounded-full items-center justify-center border border-gray-800">
                <Feather name="pie-chart" size={20} color="white" />
              </View>
              <View>
                <Text className="text-white text-lg font-light tracking-wide mb-1">Categories</Text>
                <Text className="text-gray-500 text-[10px] uppercase tracking-widest">Where it goes</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveView("burnRate")}
              activeOpacity={0.8}
              className="w-[48%] aspect-square bg-[#111111] border border-gray-900 rounded-3xl p-5 justify-between shadow-xl"
            >
              <View className="w-12 h-12 bg-gray-900 rounded-full items-center justify-center border border-gray-800">
                <Feather name="target" size={20} color="white" />
              </View>
              <View>
                <Text className="text-white text-lg font-light tracking-wide mb-1">Burn Rate</Text>
                <Text className="text-gray-500 text-[10px] uppercase tracking-widest">Monthly Limit</Text>
              </View>
            </TouchableOpacity>

            <View className="w-[48%] aspect-square bg-gray-900/30 border border-gray-900/50 rounded-3xl p-5 justify-between opacity-60">
              <View className="w-12 h-12 bg-gray-900/50 rounded-full items-center justify-center">
                <Feather name="trending-up" size={20} color="#6b7280" />
              </View>
              <View>
                <Text className="text-gray-400 text-lg font-light tracking-wide mb-1">Trends</Text>
                <Text className="text-gray-600 text-[10px] uppercase tracking-widest">Coming Soon</Text>
              </View>
            </View>

            <View className="w-[48%] aspect-square bg-gray-900/30 border border-gray-900/50 rounded-3xl p-5 justify-between opacity-60">
              <View className="w-12 h-12 bg-gray-900/50 rounded-full items-center justify-center">
                <Feather name="cpu" size={20} color="#6b7280" />
              </View>
              <View>
                <Text className="text-gray-400 text-lg font-light tracking-wide mb-1">AI Analyst</Text>
                <Text className="text-gray-600 text-[10px] uppercase tracking-widest">Coming Soon</Text>
              </View>
            </View>

          </View>
        )}
      </View>
    );
  }

  // --- VIEW 2: CATEGORY BREAKDOWN (NOW ANIMATED!) ---
  if (activeView === "categories") {
    const maxSpent = Math.max(...insights.map(i => i.totalSpent), 1);
    const totalSpent = insights.reduce((sum, item) => sum + item.totalSpent, 0);

    return (
      <View className="flex-1 bg-black pt-20 px-8">
        <TouchableOpacity 
          onPress={() => setActiveView("menu")}
          className="flex-row items-center mb-10"
        >
          <Feather name="chevron-left" size={24} color="white" />
          <Text className="text-white text-sm uppercase tracking-widest font-light ml-2">Back to Menu</Text>
        </TouchableOpacity>

        {/* New Hero Summary Header */}
        <View className="mb-10">
          <Text className="text-gray-500 uppercase tracking-widest text-[10px] mb-2 font-light">
            Total Tracked Spend
          </Text>
          <Text className="text-white text-5xl font-light tracking-tighter">
            {formatCurrency(totalSpent)}
          </Text>
        </View>

        {insights.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 uppercase tracking-widest text-center text-xs font-light">
              No data available yet.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="bg-[#111111] border border-gray-900 rounded-[32px] p-6 mb-10 shadow-xl">
              {insights.map((item, index) => {
                const isLast = index === insights.length - 1;
                return (
                  <AnimatedCategoryItem 
                    key={item.category || index.toString()}
                    item={item}
                    maxSpent={maxSpent}
                    totalSpent={totalSpent}
                    index={index}
                    formatCurrency={formatCurrency}
                    isLast={isLast}
                  />
                );
              })}
            </View>
            <View className="h-20" />
          </ScrollView>
        )}
      </View>
    );
  }

  // --- VIEW 3: BUDGET BURN RATE ---
  if (activeView === "burnRate") {
    const percentage = Math.min((currentMonthSpend / monthlyBudget) * 100, 100);
    const isOverBudget = currentMonthSpend >= monthlyBudget;
    
    let barColor = "bg-white";
    if (percentage > 85) barColor = "bg-red-500";
    else if (percentage > 65) barColor = "bg-orange-400";

    return (
      <View className="flex-1 bg-black pt-20 px-8">
        <TouchableOpacity 
          onPress={() => setActiveView("menu")}
          className="flex-row items-center mb-8"
        >
          <Feather name="chevron-left" size={24} color="white" />
          <Text className="text-white text-sm uppercase tracking-widest font-light ml-2">Back to Menu</Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-start mb-8">
          <Text className="text-white text-3xl font-light tracking-tighter">
            Burn Rate
          </Text>
          <TouchableOpacity 
            onPress={() => {
              setEditBudgetInput(monthlyBudget.toString());
              setBudgetModalVisible(true);
            }}
            className="bg-gray-900/60 px-4 py-2 rounded-full border border-gray-800"
          >
            <Text className="text-gray-300 uppercase tracking-widest text-[10px] font-medium">
              Edit Budget
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-[#111111] border border-gray-900 rounded-[32px] p-8 shadow-xl items-center">
          <Text className="text-gray-500 uppercase tracking-widest text-[10px] mb-4">
            {isOverBudget ? "Budget Exceeded!" : "Safe to spend"}
          </Text>
          
          <Text className={`text-5xl font-light tracking-tighter mb-2 ${isOverBudget ? 'text-red-500' : 'text-white'}`}>
            {formatCurrency(Math.max(monthlyBudget - currentMonthSpend, 0))}
          </Text>
          <Text className="text-gray-500 text-xs font-light mb-12">
            Remaining this month
          </Text>

          <View className="w-full">
            <View className="flex-row justify-between items-end mb-4">
              <Text className="text-gray-400 text-xs font-light">
                {formatCurrency(currentMonthSpend)} spent
              </Text>
              <Text className="text-gray-600 text-[10px] font-bold">
                {formatCurrency(monthlyBudget)} limit
              </Text>
            </View>
            
            <View className="h-6 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <View 
                className={`h-full rounded-full ${barColor}`} 
                style={{ width: `${percentage}%` }} 
              />
            </View>
            
            <Text className="text-gray-500 text-[10px] uppercase tracking-widest text-center mt-6">
              You have burned {percentage.toFixed(0)}% of your monthly budget.
            </Text>
          </View>
        </View>

        <Modal visible={budgetModalVisible} animationType="fade" transparent={true}>
          <View className="flex-1 justify-center items-center bg-black/90 px-8">
            <View className="w-full bg-[#111111] border border-gray-900 p-8 rounded-[32px] shadow-2xl">
              <Text className="text-white text-2xl font-light mb-6">Set Monthly Limit</Text>
              
              <View className="flex-row items-center border-b border-gray-800 pb-2 mb-8">
                <Text className="text-white text-3xl font-light mr-3 pb-1">₹</Text>
                <TextInput
                  className="text-white text-3xl font-light flex-1"
                  keyboardType="decimal-pad"
                  autoFocus
                  value={editBudgetInput}
                  onChangeText={setEditBudgetInput}
                />
              </View>

              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => setBudgetModalVisible(false)}
                  className="flex-1 border border-gray-800 rounded-full h-14 justify-center items-center"
                >
                  <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveBudget}
                  className="flex-1 bg-white rounded-full h-14 justify-center items-center"
                >
                  <Text className="text-black font-bold uppercase tracking-widest text-[10px]">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    );
  }

  return null;
}