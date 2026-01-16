import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
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
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  Subscriptions: undefined;
};

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    locationServices: true,
    darkMode: false,
    biometricAuth: false,
    autoUpdate: true,
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Language Settings',
      'Language selection feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Privacy policy will be displayed here.',
      [{ text: 'OK' }]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'Terms of service will be displayed here.',
      [{ text: 'OK' }]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Success', 'Cache cleared successfully!');
          }
        }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              pushNotifications: true,
              emailNotifications: true,
              smsNotifications: false,
              locationServices: true,
              darkMode: false,
              biometricAuth: false,
              autoUpdate: true,
            });
            Alert.alert('Success', 'Settings reset to default!');
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement logout functionality
            navigation.navigate('Login');
          }
        }
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    rightComponent: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        {renderSettingItem(
          'Push Notifications',
          'Receive push notifications for orders and updates',
          <Switch
            value={settings.pushNotifications}
            onValueChange={(value) => updateSetting('pushNotifications', value)}
            trackColor={{ false: '#767577', true: '#ff7e8b' }}
            thumbColor={settings.pushNotifications ? '#fff' : '#f4f3f4'}
          />
        )}

        {renderSettingItem(
          'Email Notifications',
          'Receive order updates via email',
          <Switch
            value={settings.emailNotifications}
            onValueChange={(value) => updateSetting('emailNotifications', value)}
            trackColor={{ false: '#767577', true: '#ff7e8b' }}
            thumbColor={settings.emailNotifications ? '#fff' : '#f4f3f4'}
          />
        )}

        {renderSettingItem(
          'SMS Notifications',
          'Receive order updates via SMS',
          <Switch
            value={settings.smsNotifications}
            onValueChange={(value) => updateSetting('smsNotifications', value)}
            trackColor={{ false: '#767577', true: '#ff7e8b' }}
            thumbColor={settings.smsNotifications ? '#fff' : '#f4f3f4'}
          />
        )}
      </View>

      {/* Privacy & Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>

        {renderSettingItem(
          'Location Services',
          'Allow access to location for better delivery',
          <Switch
            value={settings.locationServices}
            onValueChange={(value) => updateSetting('locationServices', value)}
            trackColor={{ false: '#767577', true: '#ff7e8b' }}
            thumbColor={settings.locationServices ? '#fff' : '#f4f3f4'}
          />
        )}

        {renderSettingItem(
          'Biometric Authentication',
          'Use fingerprint or face ID for login',
          <Switch
            value={settings.biometricAuth}
            onValueChange={(value) => updateSetting('biometricAuth', value)}
            trackColor={{ false: '#767577', true: '#ff7e8b' }}
            thumbColor={settings.biometricAuth ? '#fff' : '#f4f3f4'}
          />
        )}
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>

        {renderSettingItem(
          'Dark Mode',
          'Switch to dark theme',
          <Switch
            value={settings.darkMode}
            onValueChange={(value) => updateSetting('darkMode', value)}
            trackColor={{ false: '#767577', true: '#ff7e8b' }}
            thumbColor={settings.darkMode ? '#fff' : '#f4f3f4'}
          />
        )}
      </View>

      {/* App Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        {renderSettingItem(
          'Language',
          'English',
          <Text style={styles.settingValue}>🇺🇸 EN</Text>,
          handleLanguageChange
        )}

        {renderSettingItem(
          'Auto Update',
          'Automatically update app when new version available',
          <Switch
            value={settings.autoUpdate}
            onValueChange={(value) => updateSetting('autoUpdate', value)}
            trackColor={{ false: '#767577', true: '#ff7e8b' }}
            thumbColor={settings.autoUpdate ? '#fff' : '#f4f3f4'}
          />
        )}

        {renderSettingItem(
          'Clear Cache',
          'Clear app cache to free up space',
          <Text style={styles.settingAction}>Clear</Text>,
          handleClearCache
        )}
      </View>

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>

        {renderSettingItem(
          'Privacy Policy',
          'Read our privacy policy',
          <Text style={styles.settingArrow}>›</Text>,
          handlePrivacyPolicy
        )}

        {renderSettingItem(
          'Terms of Service',
          'Read our terms and conditions',
          <Text style={styles.settingArrow}>›</Text>,
          handleTermsOfService
        )}
      </View>

      {/* Account Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        {renderSettingItem(
          'Reset Settings',
          'Reset all settings to default',
          <Text style={styles.settingAction}>Reset</Text>,
          handleResetSettings
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.version}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
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
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  settingAction: {
    fontSize: 16,
    color: '#ff7e8b',
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  version: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
});

export default SettingsScreen;