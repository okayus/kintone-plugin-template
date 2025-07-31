import { useState } from "react";

import {
  addSetting,
  adjustCurrentTab,
  calculateNewTabIndex,
  deleteSetting,
  updateSetting,
} from "../utils/configUtils";

import type { ConfigSchema } from "../../shared/types/Config";
import type { ConfigFormState, Setting } from "../types/ConfigFormTypes";

export const useConfigData = (initialData: ConfigSchema = { settings: [] }) => {
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

    handleUpdateSetting: (index: number, settingData: Setting) => {
      const newFormData = updateSetting(formData, index, settingData);
      setFormData(newFormData);
    },
  };

  return {
    state,
    actions,
  };
};
