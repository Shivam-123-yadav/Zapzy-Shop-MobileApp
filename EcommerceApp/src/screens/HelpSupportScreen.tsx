import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  ProductDetails: { product: any };
  Cart: undefined;
  Profile: undefined;
  EditProfile: undefined;
  AddressBook: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  Subscriptions: undefined;
};

type HelpSupportScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HelpSupport'
>;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const HelpSupportScreen = () => {
  const navigation = useNavigation<HelpSupportScreenNavigationProp>();

  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I place an order?',
      answer: 'To place an order, browse products, add items to your cart, and proceed to checkout. You can select delivery address, payment method, and confirm your order.',
    },
    {
      id: '2',
      question: 'How can I track my order?',
      answer: 'You can track your order from the Profile screen by selecting "Order Tracking". Enter your order ID to see real-time updates on your delivery status.',
    },
    {
      id: '3',
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including credit/debit cards, UPI, net banking, cash on delivery, and digital wallets.',
    },
    {
      id: '4',
      question: 'How do I return or exchange an item?',
      answer: 'Items can be returned within 7 days of delivery. Go to Order History, select the order, and choose the return option. Our customer service will guide you through the process.',
    },
    {
      id: '5',
      question: 'How do I update my delivery address?',
      answer: 'You can update your delivery address from the Profile screen by selecting "Address Book". Add, edit, or delete addresses as needed.',
    },
    {
      id: '6',
      question: 'What should I do if I receive a damaged item?',
      answer: 'If you receive a damaged item, please contact our customer support immediately with photos of the damage. We will arrange for a replacement or refund.',
    },
  ];

  const handleCallSupport = () => {
    const phoneNumber = '+91-1800-123-4567';
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call. Please try again.');
    });
  };

  const handleEmailSupport = () => {
    const email = 'support@ecommerceapp.com';
    const subject = 'Support Request';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open email app. Please try again.');
    });
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '+919876543210';
    const message = 'Hi, I need help with my order.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on this device.');
    });
  };

  const handleLiveChat = () => {
    Alert.alert(
      'Live Chat',
      'Live chat feature coming soon! Please use phone or email support for now.',
      [{ text: 'OK' }]
    );
  };

  const handleFAQToggle = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const renderFAQItem = ({ item }: { item: FAQItem }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => handleFAQToggle(item.id)}
      >
        <Text style={styles.faqQuestionText}>{item.question}</Text>
        <Text style={styles.faqToggleIcon}>
          {expandedFAQ === item.id ? '−' : '+'}
        </Text>
      </TouchableOpacity>

      {expandedFAQ === item.id && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );

  const renderContactOption = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    color: string = '#ff7e8b'
  ) => (
    <TouchableOpacity style={styles.contactOption} onPress={onPress}>
      <View style={[styles.contactIcon, { backgroundColor: color }]}>
        <Text style={styles.contactIconText}>{icon}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.contactArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      {/* Contact Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>

        {renderContactOption(
          '📞',
          'Phone Support',
          '1800-123-4567 (24/7)',
          handleCallSupport,
          '#4CAF50'
        )}

        {renderContactOption(
          '💬',
          'WhatsApp',
          'Chat with our support team',
          handleWhatsAppSupport,
          '#25D366'
        )}

        {renderContactOption(
          '✉️',
          'Email Support',
          'support@ecommerceapp.com',
          handleEmailSupport,
          '#FF6B6B'
        )}

        {renderContactOption(
          '💬',
          'Live Chat',
          'Chat with our support team',
          handleLiveChat,
          '#ff7e8b'
        )}
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        <FlatList
          data={faqData}
          renderItem={renderFAQItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionText}>📦 Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionText}>🔄 Return/Exchange</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionText}>💳 Refund Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionText}>📋 Order History</Text>
        </TouchableOpacity>
      </View>

      {/* Support Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support Hours</Text>

        <View style={styles.supportHours}>
          <View style={styles.hourItem}>
            <Text style={styles.hourDay}>Monday - Friday</Text>
            <Text style={styles.hourTime}>9:00 AM - 9:00 PM</Text>
          </View>
          <View style={styles.hourItem}>
            <Text style={styles.hourDay}>Saturday</Text>
            <Text style={styles.hourTime}>9:00 AM - 6:00 PM</Text>
          </View>
          <View style={styles.hourItem}>
            <Text style={styles.hourDay}>Sunday</Text>
            <Text style={styles.hourTime}>10:00 AM - 4:00 PM</Text>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>
          Need more help? Our support team is here to assist you 24/7.
        </Text>
        <Text style={styles.appVersion}>App Version: 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ff7e8b',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactIconText: {
    fontSize: 18,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  faqToggleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff7e8b',
  },
  faqAnswer: {
    paddingBottom: 15,
    paddingLeft: 5,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  quickAction: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 16,
    color: '#333',
  },
  supportHours: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  hourItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  hourDay: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  hourTime: {
    fontSize: 16,
    color: '#666',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
  },
});

export default HelpSupportScreen;