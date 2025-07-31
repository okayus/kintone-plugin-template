import Ajv from "ajv";

import configSchema from "../../shared/jsonSchema/config.schema.json";

import type { ConfigSchema } from "../../shared/types/Config";
import type { ValidationResult } from "../types/ConfigFormTypes";

export interface IValidationService {
  validate(data: ConfigSchema): ValidationResult;
  getErrors(): any[] | null;
}

export class ValidationService implements IValidationService {
  private ajv: Ajv;
  private validateFunction: any;

  constructor() {
    this.ajv = new Ajv();
    this.validateFunction = this.ajv.compile(configSchema);
  }

  validate(data: ConfigSchema): ValidationResult {
    const isValid = this.validateFunction(data);

    if (!isValid) {
      return {
        isValid: false,
        errors: this.validateFunction.errors,
      };
    }

    return {
      isValid: true,
    };
  }

  getErrors(): any[] | null {
    return this.validateFunction.errors || null;
  }
}
