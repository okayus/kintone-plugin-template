import Ajv from "ajv";

import configSchema from "../../shared/jsonSchema/config.schema.json";

import type { ConfigSchema } from "../../shared/types/Config";
import type {
  ValidationError,
  ValidationResult,
} from "../../shared/types/KintoneTypes";
import type { ValidateFunction } from "ajv";

export interface IValidationService {
  validate(data: ConfigSchema): ValidationResult;
  getErrors(): ValidationError[] | null;
}

export class ValidationService implements IValidationService {
  private ajv: Ajv;
  private validateFunction: ValidateFunction;

  constructor() {
    this.ajv = new Ajv();
    this.validateFunction = this.ajv.compile(configSchema);
  }

  validate(data: ConfigSchema): ValidationResult {
    const isValid = this.validateFunction(data);

    if (!isValid) {
      return {
        isValid: false,
        errors: (this.validateFunction.errors as ValidationError[]) || [],
      };
    }

    return {
      isValid: true,
    };
  }

  getErrors(): ValidationError[] | null {
    return (this.validateFunction.errors as ValidationError[]) || null;
  }
}
