import React, { useEffect, useState } from "react";

import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import Ajv from "ajv";

import configSchema from "../shared/jsonSchema/config.schema.json";
import { KintoneSdk } from "../shared/util/kintoneSdk";

import type { ConfigSchema } from "../shared/types/Config";
import type { Properties } from "@kintone/rest-api-client/lib/src/client/types";
import type { IChangeEvent } from "@rjsf/core";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";

interface AppProps {
  pluginId: string;
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

const ConfigForm: React.FC<AppProps> = ({ pluginId }) => {
  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);
  const [formData, setFormData] = useState<ConfigSchema>({} as ConfigSchema);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const kintoneSdk = new KintoneSdk();
        const response = await kintoneSdk.fetchFields(
          Number(kintone.app.getId()),
        );

        const itemOptions = generateFieldOptions(response, [
          "SINGLE_LINE_TEXT",
        ]);
        setFieldOptions(itemOptions);

        const responseConfig = kintone.plugin.app.getConfig(pluginId);
        if (responseConfig.config) {
          setFormData(JSON.parse(responseConfig.config).config);
        }
      } catch (error) {
        console.error("Failed to fetch apps:", error);
      }
    };

    fetchApps();
  }, [pluginId]);

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
        window.location.href = "../../flow?app=" + kintone.app.getId();
      },
    );
  };

  const dynamicSchema = {
    ...configSchema,
    properties: {
      ...configSchema.properties,
      fields: {
        ...configSchema.properties.fields,
        items: {
          type: "string",
          oneOf: fieldOptions,
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
