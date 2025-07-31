import {
  createExportData,
  executeDownload,
  parseImportedFile,
} from "../utils/fileUtils";

import type { IValidationService } from "./ValidationService";
import type { ConfigSchema } from "../../shared/types/Config";
import type { FileOperationResult } from "../types/ConfigFormTypes";

export interface IFileService {
  exportConfig(data: ConfigSchema): void;
  importConfig(file: File): Promise<FileOperationResult>;
}

export class FileService implements IFileService {
  constructor(private validationService: IValidationService) {}

  exportConfig(data: ConfigSchema): void {
    const { dataUrl, filename } = createExportData(data);
    executeDownload(dataUrl, filename);
  }

  async importConfig(file: File): Promise<FileOperationResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result = parseImportedFile(
          content,
          (data) => this.validationService.validate(data).isValid,
        );
        resolve(result);
      };
      reader.readAsText(file);
    });
  }
}
