import type { ConfigSchema } from "../../shared/types/Config";

export interface Setting {
  name: string;
  appId: string;
  targetField: string;
  prefix: string;
}

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
  handleUpdateSetting: (index: number, settingData: Setting) => void;
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
