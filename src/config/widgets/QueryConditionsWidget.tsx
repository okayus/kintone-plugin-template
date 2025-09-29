import React from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { WidgetProps } from "@rjsf/utils";

type QueryCondition = {
  fieldCode: string;
  fieldType: string;
  operator: string;
  stringValue?: string;
  arrayValue?: string[];
  entityValue?: Array<{ code: string; name?: string }>;
  logicalOperator?: "and" | "or";
};

// JSON Schemaの11個のoneOfパターンの正確な定義
interface OneOfPattern {
  fieldTypes: string[];
  operators: string[];
  valueType: "string" | "array" | "entity";
  requiresLogicalOperator: boolean;
}

const oneOfPatterns: OneOfPattern[] = [
  // 1. 文字列系（文字列値演算子）
  {
    fieldTypes: ["SINGLE_LINE_TEXT", "LINK"],
    operators: ["=", "!=", "like", "not like"],
    valueType: "string",
    requiresLogicalOperator: true,
  },
  // 2. 文字列系（配列値演算子）
  {
    fieldTypes: ["SINGLE_LINE_TEXT", "LINK"],
    operators: ["in", "not in"],
    valueType: "array",
    requiresLogicalOperator: true,
  },
  // 3. 数値系（文字列値演算子）
  {
    fieldTypes: ["NUMBER", "CALC"],
    operators: ["=", "!=", ">", ">=", "<", "<="],
    valueType: "string",
    requiresLogicalOperator: true,
  },
  // 4. 数値系（配列値演算子）
  {
    fieldTypes: ["NUMBER", "CALC"],
    operators: ["in", "not in"],
    valueType: "array",
    requiresLogicalOperator: true,
  },
  // 5. 複数行テキスト
  {
    fieldTypes: ["MULTI_LINE_TEXT"],
    operators: ["like", "not like", "is", "is not"],
    valueType: "string",
    requiresLogicalOperator: true,
  },
  // 6. リッチエディター
  {
    fieldTypes: ["RICH_TEXT"],
    operators: ["like", "not like"],
    valueType: "string",
    requiresLogicalOperator: true,
  },
  // 7. 選択系フィールド
  {
    fieldTypes: ["RADIO_BUTTON", "DROP_DOWN", "CHECK_BOX", "MULTI_SELECT"],
    operators: ["in", "not in"],
    valueType: "array",
    requiresLogicalOperator: true,
  },
  // 8. ステータス（文字列値演算子）
  {
    fieldTypes: ["STATUS"],
    operators: ["=", "!="],
    valueType: "string",
    requiresLogicalOperator: true,
  },
  // 9. ステータス（配列値演算子）
  {
    fieldTypes: ["STATUS"],
    operators: ["in", "not in"],
    valueType: "array",
    requiresLogicalOperator: true,
  },
  // 10. 日時系フィールド
  {
    fieldTypes: ["DATE", "TIME", "DATETIME"],
    operators: ["=", "!=", ">", ">=", "<", "<="],
    valueType: "string",
    requiresLogicalOperator: true,
  },
  // 11. Entity配列フィールド
  {
    fieldTypes: [
      "USER_SELECT",
      "ORGANIZATION_SELECT",
      "GROUP_SELECT",
      "STATUS_ASSIGNEE",
    ],
    operators: ["in", "not in"],
    valueType: "entity",
    requiresLogicalOperator: true,
  },
];

// フィールドタイプから利用可能な演算子を取得
const fieldTypeOperatorMap: Record<string, string[]> = {};
oneOfPatterns.forEach((pattern) => {
  pattern.fieldTypes.forEach((fieldType) => {
    if (!fieldTypeOperatorMap[fieldType]) {
      fieldTypeOperatorMap[fieldType] = [];
    }
    fieldTypeOperatorMap[fieldType] = [
      ...new Set([...fieldTypeOperatorMap[fieldType], ...pattern.operators]),
    ];
  });
});

// フィールドタイプと演算子の組み合わせから対応するoneOfパターンを見つける
const findOneOfPattern = (
  fieldType: string,
  operator: string,
): OneOfPattern | null => {
  return (
    oneOfPatterns.find(
      (pattern) =>
        pattern.fieldTypes.includes(fieldType) &&
        pattern.operators.includes(operator),
    ) || null
  );
};

// 演算子に対応する値の入力タイプを取得
const getValueInputType = (
  fieldType: string,
  operator: string,
): "string" | "array" | "entity" => {
  const pattern = findOneOfPattern(fieldType, operator);
  return pattern?.valueType || "string";
};

// oneOf構造に正確に対応したオブジェクトを生成
const createConditionObject = (condition: QueryCondition) => {
  const pattern = findOneOfPattern(condition.fieldType, condition.operator);

  if (!pattern) {
    // フォールバック：パターンが見つからない場合
    return {
      fieldCode: condition.fieldCode || "",
      fieldType: condition.fieldType || "SINGLE_LINE_TEXT",
      operator: condition.operator || "=",
      stringValue: condition.stringValue || "",
      logicalOperator: condition.logicalOperator || "and",
    };
  }

  // 基本プロパティ
  const baseObj = {
    fieldCode: condition.fieldCode || "",
    fieldType: condition.fieldType,
    operator: condition.operator,
  };

  // 値プロパティを追加
  const valueObj: Record<string, any> = {};
  if (pattern.valueType === "string") {
    valueObj.stringValue = condition.stringValue || "";
  } else if (pattern.valueType === "array") {
    valueObj.arrayValue = condition.arrayValue || [];
  } else if (pattern.valueType === "entity") {
    valueObj.entityValue = condition.entityValue || [];
  }

  // logicalOperatorを追加（JSON Schemaの全パターンで定義済み、デフォルト値: "and"）
  const logicalOperator = condition.logicalOperator || "and";

  return {
    ...baseObj,
    ...valueObj,
    logicalOperator,
  };
};

// 保存されたoneOf形式のデータをウィジェット内部形式に変換
const convertOneOfToQueryCondition = (oneOfData: any): QueryCondition => {
  const condition: QueryCondition = {
    fieldCode: oneOfData.fieldCode || "",
    fieldType: oneOfData.fieldType || "SINGLE_LINE_TEXT",
    operator: oneOfData.operator || "=",
    logicalOperator: oneOfData.logicalOperator || "and",
  };

  // 値の種類を判定して適切なプロパティに設定
  if (oneOfData.stringValue !== undefined) {
    condition.stringValue = oneOfData.stringValue;
  }
  if (oneOfData.arrayValue !== undefined) {
    condition.arrayValue = oneOfData.arrayValue;
  }
  if (oneOfData.entityValue !== undefined) {
    condition.entityValue = oneOfData.entityValue;
  }

  return condition;
};

// 保存されたデータを適切な内部形式に変換
const parseConditionsFromValue = (value: any): QueryCondition[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item: any) => {
    // 既にQueryCondition形式の場合はそのまま使用
    if (
      item &&
      typeof item === "object" &&
      "fieldCode" in item &&
      "fieldType" in item &&
      "operator" in item
    ) {
      return convertOneOfToQueryCondition(item);
    }

    // 不正なデータの場合はデフォルト値を返す
    return {
      fieldCode: "",
      fieldType: "SINGLE_LINE_TEXT",
      operator: "=",
      stringValue: "",
      logicalOperator: "and",
    } as QueryCondition;
  });
};

export const QueryConditionsWidget: React.FC<WidgetProps> = (props) => {
  const { value, onChange } = props;

  const conditions: QueryCondition[] = parseConditionsFromValue(value);

  const addCondition = () => {
    const newCondition: QueryCondition = {
      fieldCode: "",
      fieldType: "SINGLE_LINE_TEXT",
      operator: "=",
      stringValue: "",
      logicalOperator: "and",
    };

    const newConditions = [...conditions, newCondition];
    onChange(newConditions.map(createConditionObject));
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onChange(newConditions.map(createConditionObject));
  };

  const updateCondition = (index: number, updates: Partial<QueryCondition>) => {
    const newConditions = [...conditions];
    const currentCondition = newConditions[index];

    // フィールドタイプが変更された場合、演算子をリセット
    if (updates.fieldType && updates.fieldType !== currentCondition.fieldType) {
      const availableOperators = fieldTypeOperatorMap[updates.fieldType] || [];
      updates.operator = availableOperators[0] || "=";
      // 値もリセット
      updates.stringValue = "";
      updates.arrayValue = [];
      updates.entityValue = [];
    }

    // 演算子が変更された場合、値をリセット
    if (updates.operator && updates.operator !== currentCondition.operator) {
      updates.stringValue = "";
      updates.arrayValue = [];
      updates.entityValue = [];
    }

    newConditions[index] = { ...currentCondition, ...updates };
    onChange(newConditions.map(createConditionObject));
  };

  const renderValueInput = (condition: QueryCondition, index: number) => {
    const valueInputType = getValueInputType(
      condition.fieldType,
      condition.operator,
    );

    if (valueInputType === "array") {
      const arrayValue = condition.arrayValue || [];
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            条件値（複数）
          </Typography>
          {arrayValue.map((arrayItem, valueIndex) => (
            <Box
              key={valueIndex}
              sx={{ display: "flex", alignItems: "center", mb: 1 }}
            >
              <TextField
                size="small"
                value={arrayItem}
                onChange={(e) => {
                  const newArrayValue = [...arrayValue];
                  newArrayValue[valueIndex] = e.target.value;
                  updateCondition(index, { arrayValue: newArrayValue });
                }}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  const newArrayValue = arrayValue.filter(
                    (_, i) => i !== valueIndex,
                  );
                  updateCondition(index, { arrayValue: newArrayValue });
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              updateCondition(index, { arrayValue: [...arrayValue, ""] });
            }}
          >
            値を追加
          </Button>
        </Box>
      );
    }

    if (valueInputType === "entity") {
      const entityValue = condition.entityValue || [];
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            条件値（Entity）
          </Typography>
          {entityValue.map((entity, entityIndex) => (
            <Box
              key={entityIndex}
              sx={{ display: "flex", alignItems: "center", mb: 1 }}
            >
              <TextField
                size="small"
                label="コード"
                value={entity.code}
                onChange={(e) => {
                  const newEntityValue = [...entityValue];
                  newEntityValue[entityIndex] = {
                    ...entity,
                    code: e.target.value,
                  };
                  updateCondition(index, { entityValue: newEntityValue });
                }}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <TextField
                size="small"
                label="名前（任意）"
                value={entity.name || ""}
                onChange={(e) => {
                  const newEntityValue = [...entityValue];
                  newEntityValue[entityIndex] = {
                    ...entity,
                    name: e.target.value,
                  };
                  updateCondition(index, { entityValue: newEntityValue });
                }}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  const newEntityValue = entityValue.filter(
                    (_, i) => i !== entityIndex,
                  );
                  updateCondition(index, { entityValue: newEntityValue });
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              updateCondition(index, {
                entityValue: [...entityValue, { code: "", name: "" }],
              });
            }}
          >
            Entityを追加
          </Button>
        </Box>
      );
    }

    // string input
    return (
      <TextField
        fullWidth
        size="small"
        label="条件値"
        value={condition.stringValue || ""}
        onChange={(e) =>
          updateCondition(index, { stringValue: e.target.value })
        }
      />
    );
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        レコード取得条件
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        複数の条件を設定してレコードを絞り込めます。条件を指定しない場合は全レコードが対象になります。
      </Typography>

      {conditions.map((condition, index) => (
        <Box
          key={index}
          sx={{
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              条件 {index + 1}
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={() => removeCondition(index)}
            >
              <DeleteIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="フィールドコード"
              size="small"
              value={condition.fieldCode}
              onChange={(e) =>
                updateCondition(index, { fieldCode: e.target.value })
              }
              sx={{ flexGrow: 1 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>フィールドタイプ</InputLabel>
              <Select
                value={condition.fieldType}
                onChange={(e) =>
                  updateCondition(index, { fieldType: e.target.value })
                }
                label="フィールドタイプ"
              >
                {Object.keys(fieldTypeOperatorMap).map((fieldType) => (
                  <MenuItem key={fieldType} value={fieldType}>
                    {fieldType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>演算子</InputLabel>
              <Select
                value={condition.operator}
                onChange={(e) =>
                  updateCondition(index, { operator: e.target.value })
                }
                label="演算子"
              >
                {(fieldTypeOperatorMap[condition.fieldType] || []).map(
                  (operator) => (
                    <MenuItem key={operator} value={operator}>
                      {operator}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 2 }}>{renderValueInput(condition, index)}</Box>

          {index < conditions.length - 1 && (
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>論理演算子</InputLabel>
              <Select
                value={condition.logicalOperator || "and"}
                onChange={(e) =>
                  updateCondition(index, {
                    logicalOperator: e.target.value as "and" | "or",
                  })
                }
                label="論理演算子"
              >
                <MenuItem value="and">and</MenuItem>
                <MenuItem value="or">or</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addCondition}
        sx={{ mt: 1 }}
      >
        条件を追加
      </Button>
    </Box>
  );
};
