import React from "react";
import { createRoot } from "react-dom/client";

import { KintoneSdk } from "../shared/util/kintoneSdk";
import { KintoneUtil } from "../shared/util/KintoneUtil";

import ConfigForm from "./ConfigForm";

(async (PLUGIN_ID) => {
  const configElement = document.getElementById("config");
  if (!configElement) {
    throw new Error("Config element not found");
  }
  createRoot(configElement).render(
    <ConfigForm
      pluginId={PLUGIN_ID as string}
      kintoneSdk={new KintoneSdk()}
      kintoneUtil={KintoneUtil}
    />,
  );
})(kintone.$PLUGIN_ID);
