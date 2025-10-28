import SettingsHeader from '@/components/ui/SettingsHeader';
import { getColors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import HomeAssistantConfigModal from '../../components/Modals/HomeAssistantConfigModal';
import UserConfigModal from '../components/Modals/UsersConfigModal';
import { deviceStorageService } from '../services/DeviceStorageService';
import { SensorDevice, StoredDevices } from '../types';

interface CollapsibleSection {
  [key: string]: boolean;
}

interface CameraDevice extends SensorDevice {
  stream_url: string;
  motion_sensor: string;
  occupancy_sensor: string;
}

interface User {
  id: string;
  name: string;
  pin: string;
  role: 'Admin' | 'User' | 'Pro Admin';
}

type SettingsSection = 'devices' | 'users';

const SettingsScreen: React.FC = () => {
  const { hasAdminAccess, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const systemColorScheme = useColorScheme();
  const isDarkTheme = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = getColors(isDarkTheme);

  // Redirect non-admin users, but only if they are authenticated
  useEffect(() => {
    if (isAuthenticated && !hasAdminAccess) {
      Alert.alert(
        'Access Denied',
        'You need admin privileges to access settings.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    }
  }, [hasAdminAccess, isAuthenticated]);

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background 
    },
    scrollView: { 
      flex: 1 
    },
    loadingContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: colors.background 
    },
    
    // Header Styles
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 16,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 12 
    },
    title: { 
      fontSize: 28, 
      fontWeight: 'bold', 
      color: colors.text 
    },
    subtitle: { 
      fontSize: 16, 
      color: colors.textSecondary, 
      lineHeight: 22 
    },
    
    // Section Tabs with Quick Actions
    sectionTabsContainer: {
      marginHorizontal: 24,
      marginVertical: 16,
    },
    sectionTabsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTabs: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 16,
      padding: 6,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      flex: 1,
      marginRight: 12,
    },
    sectionTab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    sectionTabActive: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    sectionTabText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    sectionTabTextActive: {
      color: '#fff',
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    quickActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    quickActionText: { 
      fontSize: 14, 
      color: colors.primary, 
      fontWeight: '600' 
    },
    
    // Section Styles
    section: {
      backgroundColor: colors.surface,
      marginHorizontal: 24,
      marginBottom: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      overflow: 'hidden',
    },
    sectionHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      padding: 20,
      backgroundColor: colors.surfaceSecondary,
    },
    sectionTitleContainer: { 
      flex: 1 
    },
    sectionTitle: { 
      fontSize: 18, 
      fontWeight: '700', 
      color: colors.text,
      marginBottom: 4,
    },
    deviceCount: { 
      fontSize: 14, 
      color: colors.textSecondary,
      fontWeight: '500',
    },
    devicesList: { 
      paddingHorizontal: 20, 
      paddingVertical: 16,
    },
    deviceContainer: { 
      marginBottom: 20, 
      paddingBottom: 20, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border,
    },
    deviceContainerLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    deviceLabel: { 
      fontSize: 15, 
      fontWeight: '600', 
      marginBottom: 12, 
      color: colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      fontSize: 16,
      backgroundColor: colors.background,
      color: colors.text,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      marginLeft: 4,
    },
    
    // Save Button
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.primary,
      marginHorizontal: 24,
      marginTop: 24,
      marginBottom: 8,
      padding: 18,
      borderRadius: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    saveButtonText: { 
      color: '#fff', 
      fontSize: 18, 
      fontWeight: '700' 
    },
    bottomSpacer: { 
      height: 30 
    },

    // Users Section Styles
    usersContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      overflow: 'hidden',
    },
    usersHeader: {
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    usersHeaderContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    usersHeaderText: {
      flex: 1,
      marginRight: 16,
    },
    usersTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 6,
    },
    usersSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    usersTable: {
      padding: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      backgroundColor: colors.surfaceSecondary,
      marginHorizontal: 8,
      borderRadius: 8,
      marginBottom: 4,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginHorizontal: 8,
      alignItems: 'center',
    },
    tableCell: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    tableHeaderCell: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    addUserButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    addUserButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    actionCell: {
      flex: 0.6,
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'flex-end',
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surfaceSecondary,
    },
    actionButtonDisabled: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surfaceSecondary,
      opacity: 0.4,
    },
    
    // Icon Styles
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },

    // Pro Admin Badge
    proAdminBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    proAdminBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
  });

  const [devices, setDevices] = useState<StoredDevices | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [haConfigModalVisible, setHaConfigModalVisible] = useState(false);
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('devices');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<CollapsibleSection>({
    waterSensors: true,
    radarSensors: true,
    tempHumiditySensors: true,
    doorSensor: true,
    lights: true,
    cameras: true,
    acs: true,
    security: true,
  });

  // Check if user is the system Pro Admin (non-editable)
  const isProAdmin = (user: User): boolean => {
    return deviceStorageService.isSystemProAdmin(user.id);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      await deviceStorageService.ensureRadarSensorsCount();
      const loadedDevices = await deviceStorageService.loadDevices();
      setDevices(loadedDevices);
      
      const loadedUsers = await deviceStorageService.loadUsers();
      
      // Ensure there's always at least one Pro Admin
      let usersWithProAdmin = loadedUsers;
      const hasProAdmin = loadedUsers.some(user => user.role === 'Pro Admin');
      
      if (!hasProAdmin && loadedUsers.length > 0) {
        // Convert the first admin to Pro Admin if no Pro Admin exists
        usersWithProAdmin = loadedUsers.map((user, index) => 
          index === 0 && user.role === 'Admin' ? { ...user, role: 'Pro Admin' as const } : user
        );
        
        // If no admin exists at all, make the first user Pro Admin
        if (!usersWithProAdmin.some(user => user.role === 'Pro Admin')) {
          usersWithProAdmin[0] = { ...usersWithProAdmin[0], role: 'Pro Admin' };
        }
        
        await deviceStorageService.saveUsers(usersWithProAdmin);
      }
      
      setUsers(usersWithProAdmin);
    } catch (error) {
      Alert.alert('Error', 'Failed to load device settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const updateDevice = async (
    deviceType: keyof StoredDevices,
    deviceId: string,
    field: string,
    value: string
  ) => {
    if (!devices) return;

    setDevices(prevDevices => {
      if (!prevDevices) return prevDevices;
      const updatedDevices = { ...prevDevices };

      if (deviceType === 'doorSensor' || deviceType === 'security') {
        if (updatedDevices[deviceType] && updatedDevices[deviceType].id === deviceId) {
          updatedDevices[deviceType] = {
            ...updatedDevices[deviceType],
            [field]: value
          } as SensorDevice;
        }
      } else {
        const deviceArray = [...(updatedDevices[deviceType] as any[])];
        const deviceIndex = deviceArray.findIndex(device => device.id === deviceId);
        if (deviceIndex !== -1) {
          deviceArray[deviceIndex] = {
            ...deviceArray[deviceIndex],
            [field]: value
          };
          updatedDevices[deviceType] = deviceArray as any;
        }
      }

      return updatedDevices;
    });

    try {
      await deviceStorageService.updateDevice(deviceType, deviceId, { [field]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to save device settings');
      loadDevices();
    }
  };

  // Get section icon
const getSectionIcon = (sectionType: string): any => {
  const icons: { [key: string]: any } = {
    waterSensors: 'water-outline',
    radarSensors: 'scan-outline',
    tempHumiditySensors: 'thermometer-outline',
    doorSensor: 'lock-closed-outline',
    lights: 'bulb-outline',
    cameras: 'camera-outline',
    acs: 'snow-outline',
    security: 'shield-checkmark-outline',
  };
  return icons[sectionType] || 'settings-outline';
};


  // Generic device input (non-camera)
  const renderDeviceInput = (device: SensorDevice, deviceType: keyof StoredDevices, isLast: boolean = false) => (
    <View key={device.id} style={[styles.deviceContainer, isLast && styles.deviceContainerLast]}>
      <Text style={styles.deviceLabel}>{device.name}</Text>
      
      <Text style={styles.inputLabel}>Device Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter device name"
        placeholderTextColor={colors.textSecondary}
        value={device.name}
        onChangeText={(value) => updateDevice(deviceType, device.id, 'name', value)}
      />
      
      <Text style={styles.inputLabel}>Entity ID</Text>
      <TextInput
        style={styles.input}
        placeholder="sensor.device_entity"
        placeholderTextColor={colors.textSecondary}
        value={device.entity}
        onChangeText={(value) => updateDevice(deviceType, device.id, 'entity', value)}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  // Camera-specific inputs
  const renderCameraInput = (camera: CameraDevice, deviceType: keyof StoredDevices, isLast: boolean = false) => (
    <View key={camera.id} style={[styles.deviceContainer, isLast && styles.deviceContainerLast]}>
      <Text style={styles.deviceLabel}>{camera.name}</Text>
      
      <Text style={styles.inputLabel}>Camera Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter camera name"
        placeholderTextColor={colors.textSecondary}
        value={camera.name}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'name', value)}
      />
      
      <Text style={styles.inputLabel}>Stream URL</Text>
      <TextInput
        style={styles.input}
        placeholder="rtsp://camera.url/stream"
        placeholderTextColor={colors.textSecondary}
        value={camera.stream_url || ''}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'stream_url', value)}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Text style={styles.inputLabel}>Motion Sensor Entity</Text>
      <TextInput
        style={styles.input}
        placeholder="binary_sensor.motion_sensor"
        placeholderTextColor={colors.textSecondary}
        value={camera.motion_sensor || ''}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'motion_sensor', value)}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Text style={styles.inputLabel}>Occupancy Sensor Entity</Text>
      <TextInput
        style={styles.input}
        placeholder="binary_sensor.occupancy_sensor"
        placeholderTextColor={colors.textSecondary}
        value={camera.occupancy_sensor || ''}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'occupancy_sensor', value)}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  const renderDeviceSection = (title: string, devices: SensorDevice[], deviceType: keyof StoredDevices) => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(deviceType)} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          <Ionicons name={getSectionIcon(deviceType)} size={20} color={colors.primary} />
        </View>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.deviceCount}>
            {devices.length} device{devices.length !== 1 ? 's' : ''} configured
          </Text>
        </View>
        <Ionicons
          name={collapsedSections[deviceType] ? "chevron-down" : "chevron-up"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {!collapsedSections[deviceType] && (
        <View style={styles.devicesList}>
          {deviceType === 'cameras'
            ? (devices as CameraDevice[]).map((cam, index) => 
                renderCameraInput(cam, deviceType, index === devices.length - 1))
            : devices.map((dev, index) => 
                renderDeviceInput(dev, deviceType, index === devices.length - 1))}
        </View>
      )}
    </View>
  );

  const renderSingleDeviceSection = (title: string, device: SensorDevice | null, deviceType: keyof StoredDevices) => {
    if (!device) return null;
    return (
      <View style={styles.section}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(deviceType)} activeOpacity={0.7}>
          <View style={styles.iconContainer}>
            <Ionicons name={getSectionIcon(deviceType)} size={20} color={colors.primary} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.deviceCount}>1 device configured</Text>
          </View>
          <Ionicons
            name={collapsedSections[deviceType] ? "chevron-down" : "chevron-up"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {!collapsedSections[deviceType] && (
          <View style={styles.devicesList}>
            {renderDeviceInput(device, deviceType, true)}
          </View>
        )}
      </View>
    );
  };

  const renderUsersSection = () => (
    <View style={styles.usersContainer}>
      <View style={styles.usersHeader}>
        <View style={styles.usersHeaderContent}>
          <View style={styles.usersHeaderText}>
            <Text style={styles.usersTitle}>User Management</Text>
            <Text style={styles.usersSubtitle}>
              Manage users, permissions, and access controls for your system. Pro Admin users cannot be edited or deleted.
            </Text>
          </View>
          {users.length > 0 && (
            <TouchableOpacity 
              style={styles.addUserButton}
              onPress={() => {
                setEditingUser(null);
                setUsersModalVisible(true);
              }}
            >
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={styles.addUserButtonText}>Add User</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.usersTable}>
        {users.length > 0 ? (
          <>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Name</Text>
              <Text style={styles.tableHeaderCell}>PIN</Text>
              <Text style={styles.tableHeaderCell}>Role</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.6, textAlign: 'right' }]}>Actions</Text>
            </View>
            {users.map((user, index) => (
              <View key={user.id} style={[
                styles.tableRow,
                index === users.length - 1 && { borderBottomWidth: 0 }
              ]}>
                <Text style={styles.tableCell}>{user.name}</Text>
                <Text style={styles.tableCell}>••••</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[
                    styles.tableCell,
                    { 
                      color: user.role === 'Pro Admin' ? colors.warning : 
                            user.role === 'Admin' ? colors.primary : colors.textSecondary,
                      fontWeight: user.role === 'Pro Admin' ? '700' : 
                                 user.role === 'Admin' ? '600' : '500'
                    }
                  ]}>
                    {user.role}
                  </Text>
                  {user.role === 'Pro Admin' && (
                    <View style={styles.proAdminBadge}>
                      <Text style={styles.proAdminBadgeText}>Protected</Text>
                    </View>
                  )}
                </View>
                <View style={styles.actionCell}>
                  <TouchableOpacity 
                    style={isProAdmin(user) ? styles.actionButtonDisabled : styles.actionButton}
                    onPress={() => !isProAdmin(user) && editUser(user)}
                    disabled={isProAdmin(user)}
                  >
                    <Ionicons 
                      name="create-outline" 
                      size={18} 
                      color={isProAdmin(user) ? colors.textSecondary : colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={isProAdmin(user) ? styles.actionButtonDisabled : styles.actionButton}
                    onPress={() => !isProAdmin(user) && deleteUser(user.id)}
                    disabled={isProAdmin(user)}
                  >
                    <Ionicons 
                      name="trash-outline" 
                      size={18} 
                      color={isProAdmin(user) ? colors.textSecondary : colors.error} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyStateText}>
              No users configured yet.{'\n'}Add your first user to get started with access management.
            </Text>
            <TouchableOpacity 
              style={styles.addUserButton}
              onPress={() => {
                setEditingUser(null);
                setUsersModalVisible(true);
              }}
            >
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={styles.addUserButtonText}>Add First User</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const editUser = (user: User) => {
    if (isProAdmin(user)) {
      Alert.alert('Protected User', 'Pro Admin users cannot be edited.');
      return;
    }
    setEditingUser(user);
    setUsersModalVisible(true);
  };

  const deleteUser = async (userId: string) => {
    const userToDelete = users.find(user => user.id === userId);
    
    if (userToDelete && isProAdmin(userToDelete)) {
      Alert.alert('Protected User', 'Pro Admin users cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedUsers = users.filter(user => user.id !== userId);
              setUsers(updatedUsers);
              await deviceStorageService.saveUsers(updatedUsers);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const saveAllSettings = async () => {
    if (!devices) return;
    try {
      await deviceStorageService.saveDevices(devices);
      Alert.alert(
        'Success', 
        'All settings have been saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)')
          }
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const expandAllSections = () => {
    const expanded: any = {};
    Object.keys(collapsedSections).forEach(key => (expanded[key] = false));
    setCollapsedSections(expanded);
  };

  const collapseAllSections = () => {
    const collapsed: any = {};
    Object.keys(collapsedSections).forEach(key => (collapsed[key] = true));
    setCollapsedSections(collapsed);
  };

  const handleUserSaved = () => {
    loadDevices();
    setEditingUser(null);
  };

  const handleCloseUserModal = () => {
    setUsersModalVisible(false);
    setEditingUser(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="settings-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
        <Text style={{color: colors.text, fontSize: 16}}>Loading settings...</Text>
      </View>
    );
  }

  if (!devices) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} style={{ marginBottom: 16 }} />
        <Text style={{color: colors.text, fontSize: 16}}>Failed to load settings</Text>
      </View>
    );
  }

  // Don't render settings if user doesn't have admin access (but only if authenticated)
  if (isAuthenticated && !hasAdminAccess) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
        <Text style={{color: colors.text, fontSize: 16, textAlign: 'center'}}>Access Denied</Text>
        <Text style={{color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8}}>
          You need admin privileges to access settings
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SettingsHeader />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        
        {/* Section Tabs with Quick Actions in One Row */}
        <View style={styles.sectionTabsContainer}>
          <View style={styles.sectionTabsRow}>
            {/* Devices & Users Tabs */}
            <View style={styles.sectionTabs}>
              <TouchableOpacity
                style={[
                  styles.sectionTab,
                  activeSection === 'devices' && styles.sectionTabActive
                ]}
                onPress={() => setActiveSection('devices')}
              >
                <Ionicons
                  name="hardware-chip-outline"
                  size={18}
                  color={activeSection === 'devices' ? '#fff' : colors.textSecondary}
                />
                <Text style={[
                  styles.sectionTabText,
                  activeSection === 'devices' && styles.sectionTabTextActive
                ]}>
                  Devices
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sectionTab,
                  activeSection === 'users' && styles.sectionTabActive
                ]}
                onPress={() => setActiveSection('users')}
              >
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={activeSection === 'users' ? '#fff' : colors.textSecondary}
                />
                <Text style={[
                  styles.sectionTabText,
                  activeSection === 'users' && styles.sectionTabTextActive
                ]}>
                  Users
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expand/Collapse Buttons - Only show for Devices section */}
            {activeSection === 'devices' && (
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={expandAllSections}
                >
                  <Ionicons name="expand-outline" size={16} color={colors.primary} />
                  <Text style={styles.quickActionText}>Expand All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={collapseAllSections}
                >
                  <Ionicons name="contract-outline" size={16} color={colors.primary} />
                  <Text style={styles.quickActionText}>Collapse All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Content based on active section */}
        {activeSection === 'devices' ? (
          <>
            {/* Device Sections */}
            {renderDeviceSection('Water Sensors', devices.waterSensors, 'waterSensors')}
            {renderDeviceSection('Radar Sensors', devices.radarSensors, 'radarSensors')}
            {renderDeviceSection('Temperature & Humidity', devices.tempHumiditySensors, 'tempHumiditySensors')}
            {renderSingleDeviceSection('Door Sensor', devices.doorSensor, 'doorSensor')}
            {renderDeviceSection('Lights', devices.lights, 'lights')}
            {renderDeviceSection('Cameras', devices.cameras as any, 'cameras')}
            {renderDeviceSection('Air Conditioners', devices.acs, 'acs')}
            {renderSingleDeviceSection('Security System', devices.security, 'security')}

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveAllSettings}
              activeOpacity={0.8}
            >
              <Ionicons name="save-outline" size={22} color="#fff" />
              <Text style={styles.saveButtonText}>Save All Settings</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Users Section */}
            {renderUsersSection()}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {/* Home Assistant Configuration Modal */}
      <HomeAssistantConfigModal
        visible={haConfigModalVisible}
        onClose={() => setHaConfigModalVisible(false)}
      />
      
      {/* User Configuration Modal */}
      <UserConfigModal
        visible={usersModalVisible}
        onClose={handleCloseUserModal}
        onUserSaved={handleUserSaved}
        editingUser={editingUser}
      />
    </KeyboardAvoidingView>
  );
};

export default SettingsScreen;