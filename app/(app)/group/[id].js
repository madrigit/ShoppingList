import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { AuthContext } from '../../context/AuthContext';
import { LoadingContext } from '../../context/LoadingContext';
import ErrorMessage from '../../components/ErrorMessage';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';
import { isValidEmail } from '../../utils/validation';

// Define view modes and tabs
const TABS = {
  SHOPPING_LIST: 'shoppingList',
  HISTORY: 'history'
};

// Define history view modes
const HISTORY_MODES = {
  MONTHS: 'months',
  CHECKOUTS: 'checkouts',
  ITEMS: 'items'
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const { showLoading, hideLoading } = useContext(LoadingContext);
  const navigation = useNavigation();
  const router = useRouter();
  
  // Get status bar height for Android
  const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;
  
  // State for tab navigation
  const [activeTab, setActiveTab] = useState(TABS.SHOPPING_LIST);
  
  // Group data state
  const [groupData, setGroupData] = useState(null);
  
  // Shopping list state
  const [shoppingList, setShoppingList] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState('');
  
  // History state
  const [history, setHistory] = useState([]);
  const [historyMode, setHistoryMode] = useState(HISTORY_MODES.MONTHS);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [checkoutsData, setCheckoutsData] = useState([]);
  
  // UI state
  const [networkError, setNetworkError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Invite modal state
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  
  // Tab animation
  const [indicatorPosition] = useState(new Animated.Value(0));
  
  // Load group data
  useEffect(() => {
    if (!id) return;
    
    console.log("Loading group data for ID:", id);
    showLoading('Loading group...');
    
    // Set up real-time listener for the group document
    const unsubscribe = onSnapshot(
      doc(db, 'groups', id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Received group data:", data.name);
          
          // Set group data and header title
          setGroupData(data);
          navigation.setOptions({ title: data.name });
          
          // Set shopping list with default checked property if not present
          const list = data.shoppingList || [];
          setShoppingList(list.map(item => {
            if (typeof item === 'string') {
              // Convert simple string items to objects with checked property
              return { name: item, checked: false };
            } else if (typeof item === 'object' && item !== null) {
              // Ensure object items have checked property
              return { ...item, checked: item.checked || false };
            }
            return item;
          }));
          
          // Set history data
          const historyData = data.history || [];
          setHistory(historyData);
          processHistoryData(historyData);
          
          hideLoading();
        } else {
          console.log('Group not found');
          setNetworkError('Group not found');
          hideLoading();
        }
      },
      (error) => {
        console.error('Error loading group:', error);
        setNetworkError('Failed to load group. Please check your connection.');
        hideLoading();
      }
    );
    
    // Clean up listener
    return () => unsubscribe();
  }, [id]);
  
  // Process history data to get monthly summaries
  const processHistoryData = (historyData) => {
    if (!historyData || !historyData.length) {
      setMonthlyData([]);
      return;
    }

    // Group checkouts by month
    const checkoutsByMonth = {};
    
    historyData.forEach(checkout => {
      try {
        // Ensure date is properly parsed
        const date = new Date(checkout.date);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.error('Invalid date in checkout:', checkout.date);
          return; // Skip this entry
        }
        
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        if (!checkoutsByMonth[monthKey]) {
          checkoutsByMonth[monthKey] = {
            key: monthKey,
            name: monthName,
            amount: 0,
            checkouts: [],
            month: date.getMonth(),
            year: date.getFullYear()
          };
        }
        
        checkoutsByMonth[monthKey].amount += parseFloat(checkout.amount) || 0;
        checkoutsByMonth[monthKey].checkouts.push(checkout);
        
      } catch (error) {
        console.error('Error processing checkout:', error, checkout);
      }
    });
    
    // Convert to array and sort by date (most recent first)
    let monthlyDataArray = Object.values(checkoutsByMonth);
    
    if (monthlyDataArray.length > 0) {
      monthlyDataArray.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      // Compare with previous month
      monthlyDataArray = monthlyDataArray.map((month, index) => {
        let trend = 'neutral';
        
        if (index < monthlyDataArray.length - 1) {
          const prevMonth = monthlyDataArray[index + 1];
          trend = month.amount < prevMonth.amount ? 'down' : month.amount > prevMonth.amount ? 'up' : 'neutral';
        }
        
        return { ...month, trend };
      });
    }
    
    setMonthlyData(monthlyDataArray);
  };
  
  // Change active tab with animation
  const handleTabChange = (tab) => {
    Animated.timing(indicatorPosition, {
      toValue: tab === TABS.SHOPPING_LIST ? 0 : 1,
      duration: 300,
      useNativeDriver: false
    }).start();
    setActiveTab(tab);
  };
  
  // Add new item to shopping list
  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    
    try {
      const trimmedItem = newItem.trim();
      const itemObject = { name: trimmedItem, checked: false };
      
      // Update local state immediately for UI responsiveness
      const updatedList = [...shoppingList, itemObject];
      setShoppingList(updatedList);
      
      // Clear input field
      setNewItem('');
      
      // Update Firestore in the background
      await updateDoc(doc(db, 'groups', id), {
        shoppingList: updatedList
      });
      
      setNetworkError('');
    } catch (error) {
      console.error('Error adding item:', error);
      setNetworkError('Failed to add item. Please check your connection.');
    }
  };
  
  // Toggle item checked status
  const handleToggleItem = async (item, index) => {
    try {
      // Update local state immediately for a smooth UI experience
      const updatedList = [...shoppingList];
      updatedList[index] = {
        ...updatedList[index],
        checked: !updatedList[index].checked
      };
      setShoppingList(updatedList);
      
      // Update Firestore in the background
      await updateDoc(doc(db, 'groups', id), {
        shoppingList: updatedList
      });
    } catch (error) {
      console.error('Error toggling item:', error);
      setNetworkError('Failed to update item. Please check your connection.');
      
      // If the server update fails, revert the local change
      const originalList = [...shoppingList];
      setShoppingList(originalList);
    }
  };
  
  // Open edit item modal
  const handleLongPressItem = (item) => {
    setEditItem(item);
    setEditItemName(item.name);
  };
  
  // Save edited item
  const handleSaveEdit = async () => {
    if (!editItemName.trim() || !editItem) return;
    
    try {
      const updatedList = [...shoppingList];
      const index = updatedList.findIndex(item => 
        item.name === editItem.name && item.checked === editItem.checked
      );
      
      if (index !== -1) {
        // Update item locally
        updatedList[index] = {
          ...updatedList[index],
          name: editItemName.trim()
        };
        
        setShoppingList(updatedList);
        
        // Update in Firestore
        await updateDoc(doc(db, 'groups', id), {
          shoppingList: updatedList
        });
      }
      
      // Reset edit state
      setEditItem(null);
      setEditItemName('');
    } catch (error) {
      console.error('Error editing item:', error);
      setNetworkError('Failed to edit item. Please check your connection.');
    }
  };
  
  // Delete item
  const handleDeleteItem = async (item, index) => {
    try {
      // Update local state immediately
      const updatedList = [...shoppingList];
      updatedList.splice(index, 1);
      setShoppingList(updatedList);
      
      // Update Firestore
      await updateDoc(doc(db, 'groups', id), {
        shoppingList: updatedList
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      setNetworkError('Failed to delete item. Please check your connection.');
      
      // Revert on error
      const originalList = [...shoppingList];
      setShoppingList(originalList);
    }
  };
  
  // Process checkout
  const handleCheckout = async () => {
    if (!checkoutAmount.trim()) return;
    
    try {
      const amount = parseFloat(checkoutAmount);
      
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Invalid amount', 'Please enter a valid amount');
        return;
      }
      
      // Get checked items
      const checkedItems = shoppingList.filter(item => item.checked);
      
      if (checkedItems.length === 0) {
        Alert.alert('No items selected', 'Please select at least one item');
        return;
      }
      
      // Create checkout object
      const checkout = {
        amount,
        date: new Date().toISOString(),
        buyer: user?.displayName || user?.email,
        items: checkedItems.map(item => item.name)
      };
      
      // Get current group data to ensure we have the latest state
      const groupRef = doc(db, 'groups', id);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const currentGroupData = groupDoc.data();
      let history = currentGroupData.history || [];
      
      // Add checkout to history
      history.push(checkout);
      
      // Remove checked items from shopping list
      const updatedShoppingList = shoppingList.filter(item => !item.checked);
      
      // Update local state
      setShoppingList(updatedShoppingList);
      setHistory(history);
      processHistoryData(history);
      
      // Update Firestore
      await updateDoc(groupRef, {
        shoppingList: updatedShoppingList,
        history
      });
      
      // Reset checkout state
      setCheckoutModalVisible(false);
      setCheckoutAmount('');
      
      // Show success message
      setSuccessMessage('Checkout successful!');
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Error processing checkout:', error);
      setNetworkError('Failed to process checkout. Please check your connection.');
    }
  };
  
  // Handle month selection in history
  const handleSelectMonth = (month) => {
    setSelectedMonth(month);
    // Sort checkouts by date (most recent first)
    const checkouts = [...month.checkouts];
    checkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    setCheckoutsData(checkouts);
    setHistoryMode(HISTORY_MODES.CHECKOUTS);
  };

  // Handle checkout selection in history
  const handleSelectCheckout = (checkout) => {
    setSelectedCheckout(checkout);
    setHistoryMode(HISTORY_MODES.ITEMS);
  };

  // Handle back navigation in history
  const handleHistoryBack = () => {
    if (historyMode === HISTORY_MODES.CHECKOUTS) {
      setHistoryMode(HISTORY_MODES.MONTHS);
      setSelectedMonth(null);
    } else if (historyMode === HISTORY_MODES.ITEMS) {
      setHistoryMode(HISTORY_MODES.CHECKOUTS);
      setSelectedCheckout(null);
    }
  };
  
  // Function to handle sending invitation
  const handleSendInvite = async () => {
    // Validate email
    if (!inviteEmail.trim() || !isValidEmail(inviteEmail)) {
      setInviteError('Please enter a valid email address');
      return;
    }
    
    try {
      setInviteError('');
      
      // Call the Cloud Function to send invitation
      const sendInvitation = httpsCallable(functions, 'sendInvitation');
      const result = await sendInvitation({
        groupId: id,
        email: inviteEmail.trim()
      });
      
      if (result.data.success) {
        // Show success message
        setSuccessMessage('Invitation sent successfully!');
        
        // Clear form and close modal
        setInviteEmail('');
        setInviteModalVisible(false);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        setInviteError(result.data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setInviteError('Failed to send invitation. Please try again.');
    }
  };
  
  // Check if checkout button should be active
  const hasCheckedItems = shoppingList.some(item => item.checked);
  
  // Render shopping list item
  const renderShoppingListItem = ({ item, index }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => handleToggleItem(item, index)}
        onLongPress={() => handleLongPressItem(item)}
        delayLongPress={500}
      >
        <Ionicons
          name={item.checked ? "checkbox" : "square-outline"}
          size={24}
          color={item.checked ? "#4CAF50" : "#666"}
          style={styles.checkbox}
        />
        <Text
          style={[
            styles.itemText,
            item.checked && styles.checkedItemText
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item, index)}
      >
        <Ionicons name="close" size={24} color="#F44336" />
      </TouchableOpacity>
    </View>
  );
  
  // Render history month item
  const renderMonthItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.monthItem}
      onPress={() => handleSelectMonth(item)}
    >
      <Text style={styles.monthName}>{item.name}</Text>
      <Text 
        style={[
          styles.monthAmount,
          item.trend === 'down' ? styles.amountDown : item.trend === 'up' ? styles.amountUp : null
        ]}
      >
        ${item.amount.toFixed(2)}
        {item.trend === 'down' && <Ionicons name="arrow-down" size={16} color="#4CAF50" />}
        {item.trend === 'up' && <Ionicons name="arrow-up" size={16} color="#F44336" />}
      </Text>
    </TouchableOpacity>
  );

  // Render checkout item
  const renderCheckoutItem = ({ item }) => {
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <TouchableOpacity 
        style={styles.checkoutItem}
        onPress={() => handleSelectCheckout(item)}
      >
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutDate}>{formattedDate}</Text>
          <Text style={styles.checkoutBuyer}>By: {item.buyer}</Text>
        </View>
        <Text style={styles.checkoutAmount}>${item.amount.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  // Render item in checkout
  const renderItemInCheckout = ({ item }) => (
    <View style={styles.itemInCheckout}>
      <Ionicons name="cart-outline" size={20} color="#666" style={styles.itemIcon} />
      <Text style={styles.itemName}>{item}</Text>
    </View>
  );
  
  // Calculate tab indicator position
  const indicatorTranslate = indicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%']
  });
  
  return (
    <View style={[styles.container, { paddingTop: STATUSBAR_HEIGHT }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{groupData?.name || 'Group'}</Text>
        
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setInviteModalVisible(true)}
        >
          <Ionicons name="person-add-outline" size={22} color="#6200ee" />
        </TouchableOpacity>
      </View>
      
      {/* Content based on active tab */}
      <View style={styles.mainContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentContainer}
          keyboardVerticalOffset={60}
        >
          {/* Shopping List Tab */}
          {activeTab === TABS.SHOPPING_LIST && (
            <>
              {/* Add Item Form */}
              <View style={styles.addForm}>
                <TextInput
                  style={styles.input}
                  value={newItem}
                  onChangeText={setNewItem}
                  placeholder="Add new item..."
                  maxLength={50}
                />
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    !newItem.trim() && styles.disabledButton
                  ]}
                  onPress={handleAddItem}
                  disabled={!newItem.trim()}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {/* Shopping List */}
              <FlatList
                data={shoppingList}
                renderItem={renderShoppingListItem}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={() => (
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyText}>No items added yet</Text>
                  </View>
                )}
              />
              
              {/* Checkout Button */}
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  !hasCheckedItems && styles.disabledCheckoutButton
                ]}
                onPress={() => setCheckoutModalVisible(true)}
                disabled={!hasCheckedItems}
              >
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              </TouchableOpacity>
            </>
          )}
          
          {/* History Tab */}
          {activeTab === TABS.HISTORY && (
            <>
              {history.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="time-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No purchase history yet</Text>
                </View>
              ) : historyMode === HISTORY_MODES.MONTHS ? (
                <FlatList
                  data={monthlyData}
                  renderItem={renderMonthItem}
                  keyExtractor={item => item.key}
                  contentContainerStyle={styles.listContent}
                  ListHeaderComponent={
                    <Text style={styles.listHeader}>Monthly Spending</Text>
                  }
                />
              ) : historyMode === HISTORY_MODES.CHECKOUTS ? (
                <>
                  <TouchableOpacity style={styles.historyBackButton} onPress={handleHistoryBack}>
                    <Ionicons name="arrow-back" size={20} color="#6200ee" />
                    <Text style={styles.historyBackButtonText}>Back to Months</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.listHeader}>{selectedMonth.name} Purchases</Text>
                  
                  <FlatList
                    data={checkoutsData}
                    renderItem={renderCheckoutItem}
                    keyExtractor={(item, index) => `${item.date}-${index}`}
                    contentContainerStyle={styles.listContent}
                  />
                </>
              ) : historyMode === HISTORY_MODES.ITEMS ? (
                <>
                  <TouchableOpacity style={styles.historyBackButton} onPress={handleHistoryBack}>
                    <Ionicons name="arrow-back" size={20} color="#6200ee" />
                    <Text style={styles.historyBackButtonText}>Back to Purchases</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.checkoutHeader}>
                    <Text style={styles.checkoutTitle}>Purchase Details</Text>
                    <Text style={styles.checkoutDetailDate}>
                      {new Date(selectedCheckout.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    <Text style={styles.checkoutDetailBuyer}>
                      Purchased by: {selectedCheckout.buyer}
                    </Text>
                    <Text style={styles.checkoutDetailAmount}>
                      Total: ${selectedCheckout.amount.toFixed(2)}
                    </Text>
                  </View>
                  
                  <FlatList
                    data={selectedCheckout.items}
                    renderItem={renderItemInCheckout}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                      <Text style={styles.itemsHeader}>Items Purchased:</Text>
                    }
                  />
                </>
              ) : null}
            </>
          )}
        </KeyboardAvoidingView>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === TABS.SHOPPING_LIST && styles.activeTab]} 
          onPress={() => handleTabChange(TABS.SHOPPING_LIST)}
        >
          <Ionicons 
            name="list-outline" 
            size={18} 
            color={activeTab === TABS.SHOPPING_LIST ? "#6200ee" : "#666"} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === TABS.SHOPPING_LIST && styles.activeTabText
            ]}
          >
            Shopping List
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === TABS.HISTORY && styles.activeTab]} 
          onPress={() => handleTabChange(TABS.HISTORY)}
        >
          <Ionicons 
            name="time-outline" 
            size={18} 
            color={activeTab === TABS.HISTORY ? "#6200ee" : "#666"} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === TABS.HISTORY && styles.activeTabText
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.tabIndicator,
            { left: indicatorTranslate }
          ]}
        />
      </View>
      
      {/* Edit Item Modal */}
      <Modal
        visible={!!editItem}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            
            <TextInput
              style={styles.modalInput}
              value={editItemName}
              onChangeText={setEditItemName}
              placeholder="Item name"
              maxLength={50}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditItem(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !editItemName.trim() && styles.disabledButton
                ]}
                onPress={handleSaveEdit}
                disabled={!editItemName.trim()}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Checkout Modal */}
      <Modal
        visible={checkoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Checkout</Text>
            
            <Text style={styles.amountLabel}>Enter total amount:</Text>
            <TextInput
              style={styles.modalInput}
              value={checkoutAmount}
              onChangeText={setCheckoutAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCheckoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !checkoutAmount.trim() && styles.disabledButton
                ]}
                onPress={handleCheckout}
                disabled={!checkoutAmount.trim()}
              >
                <Text style={styles.saveButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite to Group</Text>
            
            <TextInput
              style={styles.modalInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            {inviteError ? (
              <Text style={styles.errorText}>{inviteError}</Text>
            ) : null}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setInviteModalVisible(false);
                  setInviteEmail('');
                  setInviteError('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !inviteEmail.trim() && styles.disabledButton
                ]}
                onPress={handleSendInvite}
                disabled={!inviteEmail.trim()}
              >
                <Text style={styles.saveButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Network Error */}
      {networkError ? (
        <ErrorMessage 
          message={networkError} 
          autoHide={true}
          style={styles.networkError}
        />
      ) : null}
      
      {/* Success Message */}
      {successMessage ? (
        <View style={styles.successMessageContainer}>
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  mainContent: {
    flex: 1, // This will take all available space between header and tabs
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  backButtonText: {
    color: '#6200ee',
    marginLeft: 4,
    fontSize: 14,
  },
  inviteButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'relative',
    height: 60, 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },  
  tab: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },  
  activeTab: {
    borderTopWidth: 2, // Move the indicator to the top of each tab
    borderTopColor: '#6200ee',
    paddingTop: 4, // Adjust padding to account for the border
  },  
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabText: {
    color: '#6200ee',
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0, // Move indicator to the top of the bottom tab bar
    width: '50%',
    height: 2,
    backgroundColor: '#6200ee',
  },
  contentContainer: {
    flex: 1,
  },
  addForm: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 10,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  checkedItemText: {
    color: '#999',
    fontStyle: 'italic',
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: 5,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 16,
    marginBottom: 16, // Ensure this has enough margin from bottom
    borderRadius: 4,
    alignItems: 'center',
  },
  disabledCheckoutButton: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 10,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#6200ee',
    padding: 10,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  // History styles
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  monthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  monthName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  monthAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  amountDown: {
    color: '#4CAF50',
  },
  amountUp: {
    color: '#F44336',
  },
  historyBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
  },
  historyBackButtonText: {
    color: '#6200ee',
    fontSize: 16,
    marginLeft: 4,
  },
  checkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  checkoutInfo: {
    flex: 1,
  },
  checkoutDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  checkoutBuyer: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkoutAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutHeader: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  checkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  checkoutDetailDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  checkoutDetailBuyer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  checkoutDetailAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemsHeader: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  itemInCheckout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
  },
  networkError: {
    position: 'absolute',
    bottom: 80, // Increase to be above tabs
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  successMessageContainer: {
    position: 'absolute',
    bottom: 80, // Increase to be above tabs
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  successMessageText: {
    color: '#fff',
    fontSize: 16,
  },
});