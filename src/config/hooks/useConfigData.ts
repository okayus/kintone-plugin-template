import { useState } from "react";

import {
  addSetting,
  adjustCurrentTab,
  calculateNewTabIndex,
  createDefaultCommonSetting,
  deleteSetting,
  updateSetting,
} from "../utils/configUtils";

import type { ConfigSchema } from "../../shared/types/Config";
import type { ConfigFormState, ConfigSetting } from "../types/ConfigFormTypes";

export const useConfigData = (
  initialData: ConfigSchema = {
    settings: [],
    commonSetting: createDefaultCommonSetting(),
  },
) => {
  const [formData, setFormData] = useState<ConfigSchema>(initialData);
  const [currentTab, setCurrentTab] = useState(0);

  const state: ConfigFormState = {
    formData,
    currentTab,
  };

  const actions = {
    setFormData,
    setCurrentTab,

    handleTabChange: (_: React.SyntheticEvent, newValue: number) => {
      setCurrentTab(newValue);
    },

    handleAddTab: () => {
      const newFormData = addSetting(formData);
      setFormData(newFormData);
      setCurrentTab(calculateNewTabIndex(formData.settings.length));
    },

    handleDeleteTab: (index: number) => {
      const newFormData = deleteSetting(formData, index);
      setFormData(newFormData);
      setCurrentTab(adjustCurrentTab(currentTab, newFormData.settings.length));
    },

    handleUpdateSetting: (index: number, settingData: ConfigSetting) => {
      const newFormData = updateSetting(formData, index, settingData);
      setFormData(newFormData);
    },

    handleUpdateCommonSetting: (commonSettingData: any) => {
      const newFormData = {
        ...formData,
        commonSetting: commonSettingData,
      };
      setFormData(newFormData);
    },
  };

  return {
    state,
    actions,
  };
};
