import React, { useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  CategoryInsight,
  ExpenseEntry,
  fetchCategoryInsights,
  fetchUserExpenses,
  updateExpense,
} from "../../services/expenseService";

const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Health", "Other"];
const DATE_FILTERS = ["This Week", "This Month", "Last Month", "All Time"];

export default function DashboardScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [topInsight, setTopInsight] = useState<CategoryInsight | null>(null);

  // --- Filtering & Sorting State ---
  const [dateFilter, setDateFilter] = useState<string>("This Month");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'date' | 'amt_desc' | 'amt_asc'>('date');

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  // --- Edit Modal State ---
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMerchant, setEditMerchant] = useState("");
  const [editCategory, setEditCategory] = useState("Food");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchUserExpenses();
      setExpenses(Array.isArray(data) ? data : []);
      
      const insights = await fetchCategoryInsights();
      if (Array.isArray(insights) && insights.length > 0) {
        insights.sort((a, b) => b.totalSpent - a.totalSpent);
        setTopInsight(insights[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses]),
  );

  // --- Dynamic Filtering & Sorting Logic ---
  const { filteredExpenses, dynamicTotal } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    let filtered = [...safeExpenses];

    // 1. Filter by Date
    if (dateFilter === "This Month") {
      filtered = filtered.filter(exp => {
        if (!exp.timestamp) return false;
        const d = new Date(exp.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (dateFilter === "Last Month") {
      filtered = filtered.filter(exp => {
        if (!exp.timestamp) return false;
        const d = new Date(exp.timestamp);
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
      });
    } else if (dateFilter === "This Week") {
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);
      filtered = filtered.filter(exp => {
        if (!exp.timestamp) return false;
        return new Date(exp.timestamp) >= firstDayOfWeek;
      });
    }

    // 2. Calculate Total for the filtered period
    const newTotal = filtered.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // 3. Sort the results based on selected order
    if (sortOrder === 'amt_desc') {
      filtered.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    } else if (sortOrder === 'amt_asc') {
      filtered.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
    } else {
      // Default: Sort by Date Descending (Newest first)
      filtered.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    }

    return { filteredExpenses: filtered, dynamicTotal: newTotal };
  }, [expenses, dateFilter, sortOrder]);

  // Apply Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const displayedExpenses = filteredExpenses.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const formatCurrency = (amount: number, currencyCode: string = "INR") => {
    const symbol = currencyCode === "INR" ? "₹" : `${currencyCode} `;
    return `${symbol}${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  const formatDate = (dateStr?: string | number) => {
    if (!dateStr) return "Unknown Date";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const cycleSortOrder = () => {
    if (sortOrder === 'date') setSortOrder('amt_desc');
    else if (sortOrder === 'amt_desc') setSortOrder('amt_asc');
    else setSortOrder('date');
    setCurrentPage(0); // Reset to page 1 when sorting changes
  };

  const openEditModal = (expense: ExpenseEntry) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditMerchant(expense.merchant);
    setEditCategory(expense.category);
    setEditModalVisible(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    const numericAmount = parseFloat(editAmount);
    if (Number.isNaN(numericAmount) || !editMerchant.trim()) {
      Alert.alert("Error", "Please provide a valid amount and merchant.");
      return;
    }
    setIsUpdating(true);
    try {
      const success = await updateExpense({
        ...editingExpense,
        merchant: editMerchant,
        amount: numericAmount,
        category: editCategory,
      });
      if (success) {
        setEditModalVisible(false);
        loadExpenses();
      } else {
        Alert.alert("Error", "Failed to update expense.");
      }
    } catch {
      Alert.alert("Error", "Network error while updating.");
    } finally {
      setIsUpdating(false);
    }
  };

 return (
    <View className="flex-1 bg-black pt-24">
      {/* --- REDESIGNED HEADER SECTION --- */}
      <View className="px-10 mb-8 flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-gray-500 uppercase tracking-widest text-[10px] mb-2 font-light">
            {dateFilter === "This Month" ? "Month to Date" : `${dateFilter} Spent`}
          </Text>
          <Text className="text-white text-4xl font-light tracking-tighter">
            {formatCurrency(dynamicTotal)}
          </Text>
        </View>

        {/* Date Filter Pill on the Right */}
        <TouchableOpacity 
          onPress={() => setFilterModalVisible(true)}
          className="flex-row items-center bg-gray-900/60 px-4 py-2.5 rounded-full border border-gray-800"
        >
          <Text className="text-gray-300 uppercase tracking-widest text-[10px] font-medium mr-2">
            {dateFilter}
          </Text>
          <Feather name="calendar" size={12} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* --- TOP INSIGHT CARD --- */}
      {topInsight && dateFilter === "This Month" && (
        <View className="px-8 mb-10">
          <View className="bg-[#111111] border border-gray-900 rounded-[32px] p-6 flex-row items-center justify-between">
             <View>
                <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light mb-1">
                  Highest Category
                </Text>
                <Text className="text-white text-lg font-light">
                  {topInsight.category}
                </Text>
             </View>
             <View className="items-end">
                <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light mb-1">
                  Spent
                </Text>
                <Text className="text-white text-lg font-light">
                  {formatCurrency(topInsight.totalSpent)}
                </Text>
             </View>
          </View>
        </View>
      )}

      {/* --- RECENT ACTIVITY SECTION --- */}
      <View className="flex-1">
        <View className="px-10 mb-4 flex-row justify-between items-end">
          <View>
            <Text className="text-white uppercase tracking-[4px] text-xs font-light">
              {dateFilter === "All Time" ? "All Activity" : "Recent Activity"}
            </Text>
            {error ? (
              <Text className="text-red-500 uppercase tracking-widest text-[10px] mt-2 font-light">
                {error}
              </Text>
            ) : null}
          </View>
          
          {/* SORT TOGGLE BUTTON */}
          <TouchableOpacity 
            onPress={cycleSortOrder}
            className="flex-row items-center pb-0.5"
          >
            <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light mr-1.5">
              {sortOrder === 'amt_desc' ? 'High-Low' : sortOrder === 'amt_asc' ? 'Low-High' : 'Sort: Date'}
            </Text>
            <Feather name="filter" size={12} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {filteredExpenses.length === 0 ? (
          <View className="flex-1 justify-center items-center px-10">
            <Text className="text-gray-500 uppercase tracking-widest text-center text-xs font-light">
              No transactions found for {dateFilter.toLowerCase()}.
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={loadExpenses} tintColor="white" />
            }
          >
            <View className="px-6 mt-2">
              
              {/* --- NEW WRAPPER CARD FOR THE LIST --- */}
              <View className="bg-[#111111] border border-gray-900 rounded-[32px] overflow-hidden mb-6">
                {displayedExpenses.map((item, index) => {
                  const itemId = item.external_id || index.toString();
                  // Check if it's the last item to remove the bottom line
                  const isLast = index === displayedExpenses.length - 1; 
                  
                  return (
                    <View key={itemId} className={isLast ? "px-6" : "px-6 border-b border-gray-900/60"}>
                      <TouchableOpacity
                        onPress={() => setExpandedId(expandedId === itemId ? null : itemId)}
                        activeOpacity={0.7}
                        className="py-5 flex-row justify-between items-center"
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
                        <View className="pb-5 pl-4 border-l border-gray-800 mb-2 mt-1">
                          <View className="gap-1">
                            <View className="flex-row">
                              <Text className="text-gray-500 uppercase tracking-widest text-[10px] font-light">
                                Category:{" "}
                              </Text>
                              <Text className="text-gray-400 text-[10px] uppercase tracking-widest font-light">
                                {item.category}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => openEditModal(item)}
                            className="mt-4 bg-gray-800 rounded-full py-2.5 items-center mr-6"
                          >
                            <Text className="text-white text-[10px] uppercase tracking-widest font-bold">
                              Edit
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <View className="flex-row justify-between items-center px-2 pb-6">
                  <TouchableOpacity
                    disabled={currentPage === 0}
                    onPress={() => setCurrentPage((prev) => prev - 1)}
                    className={`px-6 py-3 rounded-full border ${
                      currentPage === 0 ? "border-gray-900 opacity-50" : "border-gray-700"
                    }`}
                  >
                    <Text className={`text-[10px] uppercase tracking-widest font-bold ${
                      currentPage === 0 ? "text-gray-700" : "text-gray-300"
                    }`}>
                      Prev
                    </Text>
                  </TouchableOpacity>

                  <Text className="text-gray-600 text-[10px] uppercase tracking-widest">
                    Page {currentPage + 1} of {totalPages}
                  </Text>

                  <TouchableOpacity
                    disabled={currentPage >= totalPages - 1}
                    onPress={() => setCurrentPage((prev) => prev + 1)}
                    className={`px-6 py-3 rounded-full border ${
                      currentPage >= totalPages - 1 ? "border-gray-900 opacity-50" : "border-gray-700"
                    }`}
                  >
                    <Text className={`text-[10px] uppercase tracking-widest font-bold ${
                      currentPage >= totalPages - 1 ? "text-gray-700" : "text-gray-300"
                    }`}>
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View className="h-20" />
            </View>
          </ScrollView>
        )}
      </View>
      
      {/* --- DATE RANGE FILTER MODAL --- */}
      <Modal visible={filterModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#111111] border-t border-gray-900 pt-8 px-10 pb-16 rounded-t-[32px] shadow-2xl">
            <Text className="text-white text-2xl font-light tracking-tighter mb-8">
              Select Range
            </Text>
            
            {DATE_FILTERS.map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => {
                  setDateFilter(range);
                  setCurrentPage(0); 
                  setFilterModalVisible(false);
                }}
                className={`py-5 border-b border-gray-900 flex-row justify-between items-center`}
              >
                <Text className={`text-lg font-light ${dateFilter === range ? "text-white" : "text-gray-500"}`}>
                  {range}
                </Text>
                {dateFilter === range && (
                  <Feather name="check" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
              className="mt-8 border border-gray-800 rounded-full h-14 justify-center items-center"
            >
              <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- EDIT MODAL --- */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#111111] border-t border-gray-900 pt-8 px-10 pb-20 rounded-t-[32px] shadow-2xl">
            <Text className="text-white text-2xl font-light tracking-tighter mb-8">
              Edit Expense
            </Text>

            <Text className="text-gray-500 uppercase tracking-widest text-xs mb-2">Amount</Text>
            <TextInput
              className="text-white text-xl py-2 border-b border-gray-800 mb-6"
              keyboardType="decimal-pad"
              value={editAmount}
              onChangeText={setEditAmount}
            />

            <Text className="text-gray-500 uppercase tracking-widest text-xs mb-2">Merchant</Text>
            <TextInput
              className="text-white text-xl py-2 border-b border-gray-800 mb-6"
              value={editMerchant}
              onChangeText={setEditMerchant}
            />

            <Text className="text-gray-500 uppercase tracking-widest text-xs mb-4">Category</Text>
            <View className="flex-row flex-wrap gap-2 mb-10">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setEditCategory(cat)}
                  className={`px-4 py-2 rounded-full border ${
                    editCategory === cat ? "bg-white border-white" : "bg-black border-gray-800"
                  }`}
                >
                  <Text
                    className={`uppercase tracking-widest text-[10px] font-bold ${
                      editCategory === cat ? "text-black" : "text-gray-500"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="flex-1 border border-gray-800 rounded-full h-14 justify-center items-center"
              >
                <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateExpense}
                disabled={isUpdating}
                className="flex-1 bg-white rounded-full h-14 justify-center items-center"
              >
                {isUpdating ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black font-bold uppercase tracking-widest text-[10px]">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}