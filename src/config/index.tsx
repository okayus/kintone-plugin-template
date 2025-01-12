import React from "react";
import { createRoot } from "react-dom/client";

import { KintoneSdk } from "../shared/util/kintoneSdk";
import { KintoneUtil } from "../shared/util/KintoneUtil";

import ConfigForm from "./ConfigForm";

(async (PLUGIN_ID) => {
  createRoot(document.getElementById("config")!).render(
    <ConfigForm
      pluginId={PLUGIN_ID as string}
      kintoneSdk={new KintoneSdk()}
      kintoneUtil={KintoneUtil}
    />,
  );
})(kintone.$PLUGIN_ID);
