import React from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import type { ConfigSchema } from "../../shared/types/Config";

interface TabHeaderProps {
  formData: ConfigSchema;
  currentTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onAddTab: () => void;
  onDeleteTab: (index: number) => void;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  formData,
  currentTab,
  onTabChange,
  onAddTab,
  onDeleteTab,
}) => (
  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
    <Tabs value={currentTab} onChange={onTabChange}>
      {formData.settings.map((setting, index) => (
        <Tab
          key={index}
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span>{setting.name || `設定 ${index + 1}`}</span>
              {formData.settings.length > 1 && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTab(index);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          }
        />
      ))}
      <IconButton onClick={onAddTab} sx={{ ml: 1 }}>
        <AddIcon />
      </IconButton>
    </Tabs>
  </Box>
);
