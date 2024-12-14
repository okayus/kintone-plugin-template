import React from "react";
import { createRoot } from "react-dom/client";

import ConfigForm from "./ConfigForm";

(async (PLUGIN_ID) => {
  createRoot(document.getElementById("config")!).render(
    <ConfigForm pluginId={PLUGIN_ID as string} />,
  );
})(kintone.$PLUGIN_ID);
