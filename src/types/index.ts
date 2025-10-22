export interface SensorDevice {
  id: string;
  name: string;
  entity: string;
  type: 'water' | 'radar' | 'temp_humidity' | 'door' | 'light' | 'camera' | 'ac' | 'security';
}

export interface StoredDevices {
  waterSensors: SensorDevice[];
  radarSensors: SensorDevice[];
  tempHumiditySensors: SensorDevice[];
  doorSensor: SensorDevice | null;
  lights: SensorDevice[];
  cameras: SensorDevice[];
  acs: SensorDevice[];
  security: SensorDevice | null;
}