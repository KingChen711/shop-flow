import { generateId, now } from '@shopflow/shared-utils';
import { Email } from '../value-objects/email.vo';

export interface UserProps {
  id?: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private readonly props: Required<Omit<UserProps, 'phone'>> & { phone?: string };

  private constructor(props: UserProps) {
    this.props = {
      id: props.id || generateId(),
      email: props.email,
      passwordHash: props.passwordHash,
      firstName: props.firstName,
      lastName: props.lastName,
      phone: props.phone,
      roles: props.roles || ['user'],
      isActive: props.isActive ?? true,
      createdAt: props.createdAt || now(),
      updatedAt: props.updatedAt || now(),
    };
  }

  // Factory method for creating new users
  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    return new User(props);
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get emailValue(): string {
    return this.props.email.value;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get roles(): string[] {
    return [...this.props.roles];
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic Methods
  updateProfile(data: { firstName?: string; lastName?: string; phone?: string }): void {
    if (data.firstName) {
      this.props.firstName = data.firstName;
    }
    if (data.lastName) {
      this.props.lastName = data.lastName;
    }
    if (data.phone !== undefined) {
      this.props.phone = data.phone;
    }
    this.props.updatedAt = now();
  }

  changePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = now();
  }

  addRole(role: string): void {
    if (!this.props.roles.includes(role)) {
      this.props.roles.push(role);
      this.props.updatedAt = now();
    }
  }

  removeRole(role: string): void {
    const index = this.props.roles.indexOf(role);
    if (index > -1) {
      this.props.roles.splice(index, 1);
      this.props.updatedAt = now();
    }
  }

  hasRole(role: string): boolean {
    return this.props.roles.includes(role);
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = now();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = now();
  }

  // Serialization
  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      email: this.props.email.value,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      phone: this.props.phone,
      roles: this.props.roles,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
