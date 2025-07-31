import { useEffect } from "react";

import type { ConfigSchema } from "../../shared/types/Config";
import type { IConfigService } from "../services/ConfigService";
import type { IFileService } from "../services/FileService";
import type { IValidationService } from "../services/ValidationService";

interface UseConfigPersistenceOptions {
  configService: IConfigService;
  validationService: IValidationService;
  fileService: IFileService;
  onDataLoaded: (data: ConfigSchema) => void;
}

export const useConfigPersistence = ({
  configService,
  validationService,
  fileService,
  onDataLoaded,
}: UseConfigPersistenceOptions) => {
  // 初期データロード
  useEffect(() => {
    const loadData = async () => {
      const data = await configService.loadConfig();
      onDataLoaded(data);
    };
    loadData();
  }, [configService, onDataLoaded]);

  const handleSubmit = async (data: ConfigSchema) => {
    const validationResult = validationService.validate(data);

    if (!validationResult.isValid) {
      console.error("Validation errors:", validationResult.errors);
      alert("設定にエラーがあります。修正してください。");
      return;
    }

    try {
      await configService.saveConfig(data);
    } catch (error) {
      console.error("Failed to save config:", error);
      alert("設定の保存に失敗しました。");
    }
  };

  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (data: ConfigSchema) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await fileService.importConfig(file);

      if (result.success && result.data) {
        onSuccess(result.data);
        alert("設定がインポートされました。画面に反映されています。");
      } else {
        alert(result.error || "インポートに失敗しました。");
      }
    } catch (error) {
      console.error("Failed to import config:", error);
      alert("設定のインポートに失敗しました。");
    }
  };

  const handleExport = (data: ConfigSchema) => {
    fileService.exportConfig(data);
  };

  return {
    handleSubmit,
    handleImport,
    handleExport,
  };
};
