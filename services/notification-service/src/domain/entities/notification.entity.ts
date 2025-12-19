import { v4 as uuidv4 } from 'uuid';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export interface CreateNotificationProps {
  userId?: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  templateId?: string;
  referenceId?: string;
  referenceType?: string;
}

export interface NotificationProps {
  id: string;
  userId?: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipient: string;
  subject?: string;
  body: string;
  templateId?: string;
  referenceId?: string;
  referenceType?: string;
  errorMessage?: string;
  createdAt: Date;
  sentAt?: Date;
}

export class Notification {
  private constructor(
    public readonly id: string,
    public readonly userId: string | undefined,
    public readonly channel: NotificationChannel,
    private _status: NotificationStatus,
    public readonly recipient: string,
    public readonly subject: string | undefined,
    public readonly body: string,
    public readonly templateId: string | undefined,
    public readonly referenceId: string | undefined,
    public readonly referenceType: string | undefined,
    private _errorMessage: string | undefined,
    public readonly createdAt: Date,
    private _sentAt: Date | undefined
  ) {}

  get status(): NotificationStatus {
    return this._status;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  static create(props: CreateNotificationProps): Notification {
    return new Notification(
      uuidv4(),
      props.userId,
      props.channel,
      NotificationStatus.PENDING,
      props.recipient,
      props.subject,
      props.body,
      props.templateId,
      props.referenceId,
      props.referenceType,
      undefined,
      new Date(),
      undefined
    );
  }

  static fromPersistence(props: NotificationProps): Notification {
    return new Notification(
      props.id,
      props.userId,
      props.channel,
      props.status,
      props.recipient,
      props.subject,
      props.body,
      props.templateId,
      props.referenceId,
      props.referenceType,
      props.errorMessage,
      props.createdAt,
      props.sentAt
    );
  }

  markSent(): void {
    this._status = NotificationStatus.SENT;
    this._sentAt = new Date();
  }

  markDelivered(): void {
    this._status = NotificationStatus.DELIVERED;
  }

  markFailed(errorMessage: string): void {
    this._status = NotificationStatus.FAILED;
    this._errorMessage = errorMessage;
  }
}
