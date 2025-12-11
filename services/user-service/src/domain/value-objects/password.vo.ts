import { ValidationError } from '@shopflow/shared-utils';

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

export class Password {
  private readonly _value: string;

  private constructor(password: string) {
    this._value = password;
  }

  static create(
    password: string,
    requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
  ): Password {
    const errors = Password.validate(password, requirements);
    if (errors.length > 0) {
      throw new ValidationError('Password does not meet requirements', { errors });
    }
    return new Password(password);
  }

  static validate(
    password: string,
    requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
  ): string[] {
    const errors: string[] = [];

    if (!password || password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters`);
    }

    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requirements.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return errors;
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return '********'; // Never expose password in logs
  }
}
