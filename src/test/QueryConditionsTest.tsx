import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Paper from "@mui/material/Paper";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import { QueryConditionsWidget } from "../config/widgets/QueryConditionsWidget";

const theme = createTheme();

const TestApp: React.FC = () => {
  const [value, setValue] = useState([]);

  const mockProps = {
    value: value,
    onChange: setValue,
    formContext: {},
    schema: {
      type: "array",
      items: {
        oneOf: [], // oneOf構造はここでは省略
      },
    },
    uiSchema: {},
    idSchema: { $id: "root_queryConditions" },
    formData: value,
    registry: {} as any,
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    placeholder: "",
    rawErrors: [],
    onBlur: () => {
      // Test component - no action needed
    },
    onFocus: () => {
      // Test component - no action needed
    },
    id: "queryConditions",
    label: "レコード取得条件",
    name: "queryConditions",
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          QueryConditions Widget Test
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Widget Test
          </Typography>
          <QueryConditionsWidget {...mockProps} />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Value:
          </Typography>
          <Box
            component="pre"
            sx={{
              backgroundColor: "grey.100",
              p: 2,
              borderRadius: 1,
              overflow: "auto",
              fontSize: "0.875rem",
            }}
          >
            {JSON.stringify(value, null, 2)}
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

// テスト用のマウント
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<TestApp />);
}
