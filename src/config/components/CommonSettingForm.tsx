import React from "react";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { customWidgets } from "../widgets/CustomWidgets";

import type { ConfigSchema } from "../../shared/types/Config";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";

interface CommonSettingFormProps {
  formData: ConfigSchema;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  onUpdateCommonSetting: (commonSettingData: any) => void;
}

export const CommonSettingForm: React.FC<CommonSettingFormProps> = ({
  formData,
  schema,
  uiSchema,
  onUpdateCommonSetting,
}) => {
  const handleChange = ({ formData: newCommonSetting }: any) => {
    onUpdateCommonSetting(newCommonSetting);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        共通設定
      </Typography>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData.commonSetting || {}}
        onChange={handleChange}
        validator={validator}
        widgets={customWidgets}
        showErrorList={false}
        omitExtraData
        liveOmit
      >
        {/* フォームボタンを非表示にする */}
        <div style={{ display: "none" }} />
      </Form>
    </Paper>
  );
};
