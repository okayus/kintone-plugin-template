import React from "react";

import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import type { ConfigSchema } from "../../shared/types/Config";

interface ActionButtonsProps {
  formData: ConfigSchema;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onSubmit: () => void;
  onAddTab: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  formData,
  onImport,
  onExport,
  onSubmit,
  onAddTab,
}) => (
  <>
    {/* Empty state */}
    {formData.settings.length === 0 && (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddTab}>
          設定を追加
        </Button>
      </Box>
    )}

    {/* Action buttons */}
    <Box mt={3} display="flex" justifyContent="space-between">
      <Box display="flex" gap={2}>
        <input
          type="file"
          accept=".json"
          onChange={onImport}
          style={{ display: "none" }}
          id="import-button"
        />
        <label htmlFor="import-button">
          <Button variant="outlined" component="span">
            インポート
          </Button>
        </label>
        <Button variant="outlined" onClick={onExport}>
          エクスポート
        </Button>
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={onSubmit}
        disabled={formData.settings.length === 0}
      >
        保存
      </Button>
    </Box>
  </>
);
