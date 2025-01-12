import React, { useEffect, useState } from "react";

import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import Ajv from "ajv";

import configSchema from "../shared/jsonSchema/config.schema.json";
import { KintoneSdk } from "../shared/util/kintoneSdk";
import { KintoneUtil } from "../shared/util/KintoneUtil";

import type { ConfigSchema } from "../shared/types/Config";
import type { Properties } from "@kintone/rest-api-client/lib/src/client/types";
import type { IChangeEvent } from "@rjsf/core";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";

interface AppProps {
  pluginId: string;
  kintoneSdk: KintoneSdk;
  kintoneUtil: typeof KintoneUtil;
}

interface FieldOption {
  const: string;
  title: string;
}

const log = (type: string) => console.log.bind(console, type);

const generateFieldOptions = (
  properties: Properties,
  fields: string[],
): FieldOption[] => {
  const options = Object.keys(properties)
    .filter((fieldCode) => fields.includes(properties[fieldCode].type))
    .map((fieldCode) => {
      return {
        const: fieldCode,
        title: properties[fieldCode].label,
      };
    });
  options.unshift({ const: "", title: "" });
  return options;
};

const ConfigForm: React.FC<AppProps> = ({
  pluginId,
  kintoneSdk,
  kintoneUtil,
}) => {
  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);
  const [formData, setFormData] = useState<ConfigSchema>({} as ConfigSchema);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await kintoneSdk.fetchFields(
          Number(kintoneUtil.getId()),
        );

        const itemOptions = generateFieldOptions(response, [
          "SINGLE_LINE_TEXT",
        ]);
        setFieldOptions(itemOptions);

        const responseConfig = kintoneUtil.getConfig(pluginId);
        if (responseConfig.config) {
          setFormData(JSON.parse(responseConfig.config).config);
        }
      } catch (error) {
        console.error("Failed to fetch apps:", error);
      }
    };

    fetchApps();
  }, [pluginId, kintoneSdk, kintoneUtil]);

  const ajv = new Ajv();
  const validate = ajv.compile(configSchema);

  const handleSubmit = (data: IChangeEvent<any>) => {
    const valid = validate(data.formData);
    if (!valid) {
      console.error("Validation errors:", validate.errors);
      alert("設定にエラーがあります。修正してください。");
      return;
    }

    const configSetting = { config: data.formData };
    kintone.plugin.app.setConfig(
      { config: JSON.stringify(configSetting) },
      function () {
        alert("設定が保存されました。");
        window.location.href = "../../flow?app=" + kintoneUtil.getId();
      },
    );
  };

  const dynamicSchema = {
    ...configSchema,
    properties: {
      ...configSchema.properties,
      fields: {
        type: "array",
        items: {
          type: "string",
          enum: fieldOptions.map((option) => option.const),
        },
      },
    },
  };

  const UiSchema: UiSchema = {
    prefix: {
      "ui:widget": "textarea",
    },
  };

  return (
    <Form
      schema={dynamicSchema as RJSFSchema}
      uiSchema={UiSchema}
      validator={validator}
      formData={formData}
      onSubmit={handleSubmit}
      onError={log("errors")}
    />
  );
};

export default ConfigForm;
