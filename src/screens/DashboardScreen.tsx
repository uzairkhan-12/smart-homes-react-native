import {
  AcCard,
  AcSettingsModal,
  CameraCard,
  DeviceSection,
  LightCard,
  SensorDetailsModal,
  SensorStatusPanel
} from '@/components';
import DashboardHeader from '@/components/ui/DashboardHeader';
import TempHumidityDetailsModal from '@/components/ui/TempHumidityDetailsModal';
import { getColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions
} from 'react-native';
import { BinarySensorData, ClimateData, LightData, SensorData, SensorDevice } from '../../types';
import { deviceStorageService } from '../services/DeviceStorageService';
import { HomeAssistantData, homeAssistantService } from '../services/HomeAssistantService';
import { ensureCorrectCameraConfig } from '../utils/configurationFixer';

const CONTAINER_PADDING = 4;
const CARD_GAP = 12;

const DashboardScreen: React.FC = () => {
  const { width: SCREEN_WIDTH = 400 } = useWindowDimensions();
  const { theme } = useTheme();
  const systemColorScheme = useColorScheme();
  const isDarkTheme = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = getColors(isDarkTheme);

  const [configuredDevices, setConfiguredDevices] = useState<SensorDevice[]>([]);
  const [cameraDevices, setCameraDevices] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [haData, setHaData] = useState<HomeAssistantData>({
    binarySensorData: {},
    climateData: {},
    lightData: {},
    sensorData: {}
  });
  const [isConnected, setIsConnected] = useState(false);
  const [showReloadButton, setShowReloadButton] = useState(false);

  // Modals
  const [acModalVisible, setAcModalVisible] = useState(false);
  const [selectedAc, setSelectedAc] = useState<SensorDevice | null>(null);
  const [tempHumidityModalVisible, setTempHumidityModalVisible] = useState(false);
  const [sensorDetailsModalVisible, setSensorDetailsModalVisible] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorDevice | null>(null);
  const [selectedSensorData, setSelectedSensorData] = useState<BinarySensorData | null>(null);
  const [avgTemperature, setAvgTemperature] = useState<number>(0);
  const [avgHumidity, setAvgHumidity] = useState<number>(0);

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Detect when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appState.match(/inactive|background/) && nextState === 'active') {
        // When returning to foreground, show reload button
        setShowReloadButton(true);
      }
      setAppState(nextState);
    });
    return () => sub.remove();
  }, [appState]);

  // Subscribe to Home Assistant
  useEffect(() => {
    const unsubscribe = homeAssistantService.subscribe((data: HomeAssistantData) => {
      setHaData(data);
      setIsConnected(homeAssistantService.isConnected());
    });
    if (!homeAssistantService.isConnected()) {
      homeAssistantService.connectWebSocket().catch(console.error);
    } else setIsConnected(true);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(homeAssistantService.isConnected());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load devices when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadConfiguredDevices();
    }, [])
  );

  useEffect(() => {
    calculateAverages();
  }, [haData.sensorData, configuredDevices]);

  // === LOADERS ===

  const loadConfiguredDevices = async () => {
    try {
      setLoading(true);
      await ensureCorrectCameraConfig();
      await deviceStorageService.ensureRadarSensorsCount();
      const devices = await deviceStorageService.getAllDevices();
      setConfiguredDevices(devices);
      setCameraDevices(devices.filter(d => d.type === 'camera'));
      const configuredOnly = await deviceStorageService.getConfiguredDevices();
      await homeAssistantService.initializeWithConfiguredDevices(configuredOnly);
    } catch (error) {
      console.error('❌ loadConfiguredDevices error:', error);
      Alert.alert('Error', 'Failed to load configured devices');
    } finally {
      setLoading(false);
    }
  };

  const loadCameraDevices = async () => {
    try {
      const devices = await deviceStorageService.getAllDevices();
      setCameraDevices(devices.filter(d => d.type === 'camera'));
    } catch (err) {
      console.error('Reload cameras error:', err);
    }
  };

  // === HELPERS ===

  const calculateAverages = () => {
    const tempHumidityDevices = configuredDevices?.filter(d => d.type === 'temp_humidity') || [];
    if (!tempHumidityDevices.length) {
      setAvgTemperature(0);
      setAvgHumidity(0);
      return;
    }

    let tSum = 0, hSum = 0, tCount = 0, hCount = 0;
    tempHumidityDevices.forEach(d => {
      const dd = getDeviceData(d);
      if (dd.type === 'sensor' && dd.data) {
        const data = dd.data as SensorData;
        const val = parseFloat(data.new_state);
        if (!isNaN(val)) {
          if (d.entity.includes('temp')) { tSum += val; tCount++; }
          if (d.entity.includes('humidity')) { hSum += val; hCount++; }
        }
      }
    });
    setAvgTemperature(tCount ? tSum / tCount : 0);
    setAvgHumidity(hCount ? hSum / hCount : 0);
  };

  const getDeviceData = (device: SensorDevice) => {
    const e = device.entity;
    if (haData.binarySensorData[e]) return { type: 'binary', data: haData.binarySensorData[e] };
    if (haData.climateData[e]) return { type: 'climate', data: haData.climateData[e] };
    if (haData.lightData[e]) return { type: 'light', data: haData.lightData[e] };
    if (haData.sensorData[e]) return { type: 'sensor', data: haData.sensorData[e] };
    return { type: 'unknown', data: null };
  };

  const toggleDevice = async (_id: string, _type: string, entityId: string) => {
    try {
      homeAssistantService.toggleEntity(entityId);
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle device');
    }
  };

  const getCardWidth = (items: number) => {
    const rW = SCREEN_WIDTH * 0.5;
    const totalGap = CARD_GAP * (items - 1);
    const available = rW - CONTAINER_PADDING * 2 - totalGap - 6;
    return available / items;
  };

  const openAcSettings = (ac: SensorDevice) => {
    setSelectedAc(ac);
    setAcModalVisible(true);
  };

  const closeAcSettings = () => {
    setAcModalVisible(false);
    setSelectedAc(null);
  };

  const handleSensorPress = (s: SensorDevice, data: BinarySensorData | null) => {
    setSelectedSensor(s);
    setSelectedSensorData(data);
    setSensorDetailsModalVisible(true);
  };

  const closeSensorDetails = () => {
    setSensorDetailsModalVisible(false);
    setSelectedSensor(null);
    setSelectedSensorData(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConfiguredDevices();
    setRefreshing(false);
  };

  // === UI ===

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkTheme && styles.loadingContainerDark]}>
        <Text style={[styles.loadingText, isDarkTheme && styles.textDark]}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkTheme && styles.containerDark]}>
      <DashboardHeader
        avgTemperature={avgTemperature}
        avgHumidity={avgHumidity}
        onTempHumidityDetailsPress={() => setTempHumidityModalVisible(true)}
        isConnected={isConnected}
      />

      <View style={styles.mainContent}>
        {/* LEFT COLUMN (CAMERAS) */}
        <View style={styles.leftColumn}>
          {showReloadButton ? (
            // 🔄 When reload button should show
            <BlurView intensity={70} tint={isDarkTheme ? 'dark' : 'light'} style={styles.blurContainer}>
              <View style={styles.reloadContainer}>
                <TouchableOpacity
                  style={styles.reloadButton}
                  onPress={async () => {
                    await loadCameraDevices();
                    setShowReloadButton(false);
                  }}
                >
                  <Text style={styles.reloadButtonText}>🔄 Reload Cameras</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          ) : (
            // Normal camera display
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {cameraDevices.length === 0 ? (
                <View style={styles.emptyColumnContainer}>
                  <Text style={styles.emptyColumnIcon}>📹</Text>
                  <Text style={[styles.emptyColumnTitle, isDarkTheme && styles.textDark]}>No Cameras</Text>
                  <Text style={[styles.emptyColumnMessage, isDarkTheme && styles.textSecondaryDark]}>
                    Configure cameras in Settings
                  </Text>
                </View>
              ) : (
                <View style={styles.camerasList}>
                  {cameraDevices.map(camera => {
                    const motion = haData.binarySensorData[camera.motion_sensor || ''];
                    const occupancy = haData.binarySensorData[camera.occupancy_sensor || ''];
                    const cam = {
                      ...camera,
                      motion_sensor_detected: motion ? motion.new_state === 'on' : false,
                      occupancy_sensor_detected: occupancy ? occupancy.new_state === 'on' : false,
                    };
                    return (
                      <View key={camera.id} style={styles.cameraCardItem}>
                        <CameraCard
                          camera={cam}
                          cardWidth={SCREEN_WIDTH * 0.5 - CONTAINER_PADDING - 12}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* RIGHT COLUMN */}
        <View style={styles.rightColumn}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Lights */}
            {(() => {
              const lights = configuredDevices.filter(d => d.type === 'light');
              if (!lights.length) return null;
              return (
                <DeviceSection title="Lights" devices={lights} icon="💡" itemsPerRow={2}>
                  {lights.map(l => {
                    const data = getDeviceData(l);
                    const isOn = data.type === 'light' && data.data ? (data.data as LightData).new_state === 'on' : false;
                    return (
                      <LightCard
                        key={l.id}
                        device={l}
                        isOn={isOn}
                        onToggle={toggleDevice}
                        cardWidth={getCardWidth(2)}
                      />
                    );
                  })}
                </DeviceSection>
              );
            })()}

            {/* AC */}
            {(() => {
              const acs = configuredDevices.filter(d => d.type === 'ac');
              if (!acs.length) return null;
              return (
                <DeviceSection title="Air Conditioners" devices={acs} icon="❄️" itemsPerRow={2}>
                  {acs.map(ac => {
                    const data = getDeviceData(ac);
                    const isOn = data.type === 'climate' && data.data ? (data.data as ClimateData).new_state !== 'off' : false;
                    const acData = data.type === 'climate' ? (data.data as ClimateData) : null;
                    return (
                      <AcCard
                        key={ac.id}
                        device={ac}
                        isOn={isOn}
                        acData={acData}
                        onToggle={toggleDevice}
                        onOpenSettings={openAcSettings}
                        cardWidth={getCardWidth(2)}
                      />
                    );
                  })}
                </DeviceSection>
              );
            })()}

            {/* Sensors */}
            {(() => {
              const binary = configuredDevices.filter(d => ['water', 'radar', 'door', 'security'].includes(d.type));
              if (!binary.length) return null;
              return (
                <View style={styles.sensorsContainer}>
                  <SensorStatusPanel
                    sensors={binary}
                    binarySensorData={haData.binarySensorData}
                    onSensorPress={handleSensorPress}
                  />
                </View>
              );
            })()}
          </ScrollView>
        </View>
      </View>

      {/* Modals */}
      <AcSettingsModal visible={acModalVisible} selectedAc={selectedAc} onClose={closeAcSettings} />
      <TempHumidityDetailsModal
        visible={tempHumidityModalVisible}
        tempHumidityDevices={configuredDevices.filter(d => d.type === 'temp_humidity')}
        sensorData={haData.sensorData}
        onClose={() => setTempHumidityModalVisible(false)}
      />
      <SensorDetailsModal
        visible={sensorDetailsModalVisible}
        sensor={selectedSensor}
        sensorData={selectedSensorData}
        onClose={closeSensorDetails}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { backgroundColor: '#121212' },
  mainContent: { flex: 1, flexDirection: 'row' },
  leftColumn: { flex: 1, paddingRight: 6 },
  rightColumn: { flex: 1, paddingLeft: 6 },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reloadContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  reloadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  reloadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  camerasList: { paddingHorizontal: CONTAINER_PADDING, paddingVertical: 8 },
  cameraCardItem: { marginBottom: 10 },
  sensorsContainer: { marginBottom: 8, paddingHorizontal: CONTAINER_PADDING, marginTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContainerDark: { backgroundColor: '#121212' },
  loadingText: { fontSize: 16, color: '#666' },
  scrollContent: { paddingHorizontal: CONTAINER_PADDING, paddingVertical: 8, paddingBottom: 16 },
  emptyColumnContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyColumnIcon: { fontSize: 40, marginBottom: 12 },
  emptyColumnTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  emptyColumnMessage: { fontSize: 13, color: '#666', textAlign: 'center' },
  textDark: { color: '#fff' },
  textSecondaryDark: { color: '#aaa' },
});

export default DashboardScreen;
