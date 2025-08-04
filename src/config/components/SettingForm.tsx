import React from "react";

import Box from "@mui/material/Box";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { customWidgets } from "../widgets/CustomWidgets";

import type { ConfigSchema } from "../../shared/types/Config";
import type { ConfigSetting } from "../types/ConfigFormTypes";
import type { RJSFSchema } from "@rjsf/utils";

const log = (type: string) => console.log.bind(console, type);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SettingFormProps {
  formData: ConfigSchema;
  currentTab: number;
  schema: RJSFSchema;
  uiSchema: Record<string, unknown>;
  onUpdateSetting: (index: number, settingData: ConfigSetting) => void;
}

export const SettingForm: React.FC<SettingFormProps> = ({
  formData,
  currentTab,
  schema,
  uiSchema,
  onUpdateSetting,
}) => (
  <>
    {formData.settings.map((setting, index) => (
      <TabPanel key={index} value={currentTab} index={index}>
        <Form
          schema={schema}
          uiSchema={uiSchema}
          validator={validator}
          formData={setting}
          formContext={{
            formData: formData,
            currentSetting: setting,
            currentIndex: index,
            handleUpdateSetting: onUpdateSetting,
          }}
          onChange={(e) => onUpdateSetting(index, e.formData)}
          onError={log("errors")}
          widgets={customWidgets}
        >
          <div /> {/* Submit buttonを非表示にする */}
        </Form>
      </TabPanel>
    ))}
  </>
);
