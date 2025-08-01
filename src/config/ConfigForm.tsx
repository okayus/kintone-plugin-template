import React, { useMemo } from "react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

import { KintoneSdk } from "../shared/util/kintoneSdk";
import { KintoneUtil } from "../shared/util/KintoneUtil";

// Components
import { ActionButtons } from "./components/ActionButtons";
import { CommonSettingForm } from "./components/CommonSettingForm";
import { SettingForm } from "./components/SettingForm";
import { TabHeader } from "./components/TabHeader";
// Hooks
import { useConfigData } from "./hooks/useConfigData";
import { useConfigPersistence } from "./hooks/useConfigPersistence";
// Services
import { ConfigService } from "./services/ConfigService";
import { FileService } from "./services/FileService";
import { ValidationService } from "./services/ValidationService";
// Utils
import {
  createCommonSettingSchema,
  createCommonSettingUiSchema,
  createSettingSchema,
  createSettingUiSchema,
} from "./utils/schemaUtils";

interface AppProps {
  pluginId: string;
  kintoneSdk: KintoneSdk;
  kintoneUtil: typeof KintoneUtil;
}

const ConfigForm: React.FC<AppProps> = ({ pluginId, kintoneUtil }) => {
  // Services initialization with dependency injection
  const services = useMemo(() => {
    const configService = new ConfigService(pluginId, kintoneUtil);
    const validationService = new ValidationService();
    const fileService = new FileService(validationService);

    return { configService, validationService, fileService };
  }, [pluginId, kintoneUtil]);

  // State management
  const { state, actions } = useConfigData();
  const { formData, currentTab } = state;

  // Persistence operations
  const { handleSubmit, handleImport, handleExport } = useConfigPersistence({
    ...services,
    onDataLoaded: actions.setFormData,
  });

  // Schema generation
  const schema = useMemo(() => createSettingSchema(), []);
  const uiSchema = useMemo(() => createSettingUiSchema(), []);
  const commonSchema = useMemo(() => createCommonSettingSchema(), []);
  const commonUiSchema = useMemo(() => createCommonSettingUiSchema(), []);

  // Event handlers
  const onSubmit = () => handleSubmit(formData);
  const onImport = (event: React.ChangeEvent<HTMLInputElement>) =>
    handleImport(event, actions.setFormData);
  const onExport = () => handleExport(formData);

  return (
    <Box>
      {/* 共通設定セクション */}
      <CommonSettingForm
        formData={formData}
        schema={commonSchema}
        uiSchema={commonUiSchema}
        onUpdateCommonSetting={actions.handleUpdateCommonSetting}
      />

      {/* 個別設定タブセクション */}
      <Paper sx={{ mt: 2 }}>
        <TabHeader
          formData={formData}
          currentTab={currentTab}
          onTabChange={actions.handleTabChange}
          onAddTab={actions.handleAddTab}
          onDeleteTab={actions.handleDeleteTab}
        />

        <SettingForm
          formData={formData}
          currentTab={currentTab}
          schema={schema}
          uiSchema={uiSchema}
          onUpdateSetting={actions.handleUpdateSetting}
        />
      </Paper>

      <ActionButtons
        formData={formData}
        onImport={onImport}
        onExport={onExport}
        onSubmit={onSubmit}
        onAddTab={actions.handleAddTab}
      />
    </Box>
  );
};

export default ConfigForm;
