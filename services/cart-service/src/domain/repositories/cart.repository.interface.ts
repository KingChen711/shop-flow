import { Cart } from '../entities/cart.entity';

export interface ICartRepository {
  /**
   * Find a cart by user ID
   * Returns null if no cart exists for the user
   */
  findByUserId(userId: string): Promise<Cart | null>;

  /**
   * Save a cart (create or update)
   */
  save(cart: Cart): Promise<void>;

  /**
   * Delete a cart by user ID
   */
  delete(userId: string): Promise<boolean>;

  /**
   * Check if a cart exists for a user
   */
  exists(userId: string): Promise<boolean>;

  /**
   * Set cart expiration time (in seconds)
   */
  setExpiration(userId: string, ttlSeconds: number): Promise<void>;
}
