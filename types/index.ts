export interface SensorDevice {
  id: string;
  name: string;
  type: string;
  entity: string;
  room?: string;
}

// Define types for different entity data
export interface BinarySensorData {
  entity_id: string;
  old_state: string;
  new_state: string;
  user_id: string | null;
  timestamp: string;
  attributes: {
    device_class: string;
    icon?: string;
    friendly_name: string;
  };
}

export interface ClimateData {
  entity_id: string;
  old_state: string;
  new_state: string;
  user_id: string | null;
  timestamp: string;
  attributes: {
    hvac_modes: string[];
    min_temp: number;
    max_temp: number;
    target_temp_step: number;
    fan_modes: string[];
    current_temperature: number | null;
    temperature: number;
    fan_mode: string;
    last_on_operation: string;
    device_code: number;
    manufacturer: string;
    supported_models: string[];
    supported_controller: string;
    commands_encoding: string;
    friendly_name: string;
    supported_features: number;
  };
}

export interface LightData {
  entity_id: string;
  old_state: string;
  new_state: string;
  user_id: string | null;
  timestamp: string;
  attributes: {
    supported_color_modes: string[];
    color_mode: string;
    friendly_name: string;
    supported_features: number;
  };
}

export interface SensorData {
  entity_id: string;
  old_state: string;
  new_state: string;
  user_id: string | null;
  timestamp: string;
  attributes: {
    state_class: string;
    unit_of_measurement: string;
    device_class: string;
    friendly_name: string;
  };
}

export type EntityData = BinarySensorData | ClimateData | LightData | SensorData;