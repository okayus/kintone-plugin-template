import type { ConfigSchema } from "../../shared/types/Config";

// Auto-derive ConfigSetting type from ConfigSchema for better maintainability
// This ensures schema and types stay in sync automatically
export type ConfigSetting = ConfigSchema["settings"][number];

export interface ConfigFormState {
  formData: ConfigSchema;
  currentTab: number;
}

export interface ConfigFormActions {
  setFormData: (data: ConfigSchema) => void;
  setCurrentTab: (tab: number) => void;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  handleAddTab: () => void;
  handleDeleteTab: (index: number) => void;
  handleUpdateSetting: (index: number, settingData: ConfigSetting) => void;
}

export interface ConfigFormProps {
  pluginId: string;
  kintoneUtil: any;
}

export interface FileOperationResult {
  success: boolean;
  data?: ConfigSchema;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: any[];
}
