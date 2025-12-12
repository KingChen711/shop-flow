import { v4 as uuidv4 } from 'uuid';

export interface InventoryProps {
  id?: string;
  productId: string;
  totalStock: number;
  reservedStock: number;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Inventory {
  private readonly _id: string;
  private readonly _productId: string;
  private _totalStock: number;
  private _reservedStock: number;
  private _version: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: InventoryProps) {
    this._id = props.id || uuidv4();
    this._productId = props.productId;
    this._totalStock = props.totalStock;
    this._reservedStock = props.reservedStock;
    this._version = props.version;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Static factory methods
  static create(productId: string, initialStock: number = 0): Inventory {
    return new Inventory({
      productId,
      totalStock: initialStock,
      reservedStock: 0,
      version: 1,
    });
  }

  static fromPersistence(props: InventoryProps): Inventory {
    return new Inventory(props);
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get productId(): string {
    return this._productId;
  }

  get totalStock(): number {
    return this._totalStock;
  }

  get reservedStock(): number {
    return this._reservedStock;
  }

  get availableStock(): number {
    return this._totalStock - this._reservedStock;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  canReserve(quantity: number): boolean {
    return this.availableStock >= quantity;
  }

  reserve(quantity: number): void {
    if (!this.canReserve(quantity)) {
      throw new Error(`Cannot reserve ${quantity} units. Available stock: ${this.availableStock}`);
    }
    this._reservedStock += quantity;
    this._updatedAt = new Date();
    this._version++;
  }

  release(quantity: number): void {
    if (this._reservedStock < quantity) {
      throw new Error(`Cannot release ${quantity} units. Reserved stock: ${this._reservedStock}`);
    }
    this._reservedStock -= quantity;
    this._updatedAt = new Date();
    this._version++;
  }

  confirm(quantity: number): void {
    // Confirming a reservation means reducing both reserved and total stock
    if (this._reservedStock < quantity) {
      throw new Error(`Cannot confirm ${quantity} units. Reserved stock: ${this._reservedStock}`);
    }
    this._reservedStock -= quantity;
    this._totalStock -= quantity;
    this._updatedAt = new Date();
    this._version++;
  }

  updateStock(quantity: number): void {
    const newTotal = this._totalStock + quantity;
    if (newTotal < 0) {
      throw new Error(
        `Cannot reduce stock below 0. Current: ${this._totalStock}, Change: ${quantity}`
      );
    }
    if (newTotal < this._reservedStock) {
      throw new Error(
        `Cannot reduce total stock below reserved amount. Reserved: ${this._reservedStock}`
      );
    }
    this._totalStock = newTotal;
    this._updatedAt = new Date();
    this._version++;
  }

  setStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Stock cannot be negative');
    }
    if (quantity < this._reservedStock) {
      throw new Error(`Cannot set stock below reserved amount. Reserved: ${this._reservedStock}`);
    }
    this._totalStock = quantity;
    this._updatedAt = new Date();
    this._version++;
  }

  toJSON() {
    return {
      id: this._id,
      productId: this._productId,
      totalStock: this._totalStock,
      reservedStock: this._reservedStock,
      availableStock: this.availableStock,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
