import { v4 as uuidv4 } from 'uuid';
import { NotificationChannel } from './notification.entity';

export enum TemplateType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  CUSTOM = 'CUSTOM',
}

export interface CreateTemplateProps {
  name: string;
  type: TemplateType;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  isActive?: boolean;
}

export interface TemplateProps {
  id: string;
  name: string;
  type: TemplateType;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Template {
  private constructor(
    public readonly id: string,
    private _name: string,
    public readonly type: TemplateType,
    public readonly channel: NotificationChannel,
    private _subject: string | undefined,
    private _body: string,
    private _isActive: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  get name(): string {
    return this._name;
  }

  get subject(): string | undefined {
    return this._subject;
  }

  get body(): string {
    return this._body;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  static create(props: CreateTemplateProps): Template {
    const now = new Date();
    return new Template(
      uuidv4(),
      props.name,
      props.type,
      props.channel,
      props.subject,
      props.body,
      props.isActive ?? true,
      now,
      now
    );
  }

  static fromPersistence(props: TemplateProps): Template {
    return new Template(
      props.id,
      props.name,
      props.type,
      props.channel,
      props.subject,
      props.body,
      props.isActive,
      props.createdAt,
      props.updatedAt
    );
  }

  update(
    props: Partial<Pick<CreateTemplateProps, 'name' | 'subject' | 'body' | 'isActive'>>
  ): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.subject !== undefined) this._subject = props.subject;
    if (props.body !== undefined) this._body = props.body;
    if (props.isActive !== undefined) this._isActive = props.isActive;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Render template body with variables
   * Variables format: {{variableName}}
   */
  render(variables: Record<string, string>): { subject?: string; body: string } {
    let renderedBody = this._body;
    let renderedSubject = this._subject;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      renderedBody = renderedBody.replace(placeholder, value);
      if (renderedSubject) {
        renderedSubject = renderedSubject.replace(placeholder, value);
      }
    }

    return { subject: renderedSubject, body: renderedBody };
  }
}
