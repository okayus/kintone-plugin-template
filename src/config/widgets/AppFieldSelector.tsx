import React, { useState, useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Stack,
  CircularProgress,
  Typography 
} from '@mui/material';
import { Cache } from '../../shared/util/cache';
import type { KintoneApp } from '@kintone/rest-api-client/lib/src/client/types';

interface AppFieldValue {
  appId: string;
  targetField: string;
}

interface FieldOption {
  code: string;
  label: string;
}

interface AppFieldSelectorProps {
  id?: string;
  value: any;
  onChange: (value: any) => void;
}

export const AppFieldSelector: React.FC<AppFieldSelectorProps> = ({ id, value, onChange }) => {
  const [apps, setApps] = useState<KintoneApp[]>([]);
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [cache] = useState(() => Cache.getInstance());
  
  const currentValue: AppFieldValue = value || { appId: '', targetField: '' };

  useEffect(() => {
    const initCache = async () => {
      await cache.init();
      setApps(cache.getApps());
    };
    initCache();
  }, [cache]);

  useEffect(() => {
    const loadFields = async () => {
      if (!currentValue.appId) {
        setFields([]);
        return;
      }

      setLoading(true);
      try {
        const properties = await cache.getFormFields(currentValue.appId);
        const fieldOptions = Object.entries(properties)
          .filter(([, field]) => field.type === 'SINGLE_LINE_TEXT')
          .map(([code, field]) => ({
            code,
            label: field.label || code
          }));
        setFields(fieldOptions);
      } catch (error) {
        console.error('Failed to load fields:', error);
        setFields([]);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, [currentValue.appId, cache]);

  const handleAppChange = (appId: string) => {
    onChange({
      ...currentValue,
      appId,
      targetField: '' // Reset field when app changes
    });
  };

  const handleFieldChange = (targetField: string) => {
    onChange({
      ...currentValue,
      targetField
    });
  };

  return (
    <Stack spacing={2}>
      <FormControl fullWidth>
        <InputLabel id={`${id}-app-label`}>対象アプリ</InputLabel>
        <Select
          labelId={`${id}-app-label`}
          value={currentValue.appId}
          onChange={(e) => handleAppChange(e.target.value)}
          label="対象アプリ"
        >
          <MenuItem value="">
            <em>選択してください</em>
          </MenuItem>
          {apps.map((app) => (
            <MenuItem key={app.appId} value={app.appId}>
              {app.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!currentValue.appId || loading}>
        <InputLabel id={`${id}-field-label`}>対象フィールド</InputLabel>
        <Select
          labelId={`${id}-field-label`}
          value={currentValue.targetField}
          onChange={(e) => handleFieldChange(e.target.value)}
          label="対象フィールド"
        >
          <MenuItem value="">
            <em>選択してください</em>
          </MenuItem>
          {fields.map((field) => (
            <MenuItem key={field.code} value={field.code}>
              {field.label}
            </MenuItem>
          ))}
        </Select>
        {loading && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption">フィールドを読み込み中...</Typography>
          </Stack>
        )}
      </FormControl>
    </Stack>
  );
};