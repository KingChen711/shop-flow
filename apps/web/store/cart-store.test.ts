import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cart-store';

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useCartStore.setState({ items: [] });
  });

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      const { addItem } = useCartStore.getState();

      addItem({
        productId: '1',
        name: 'Test Product',
        price: 99.99,
        quantity: 1,
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.productId).toBe('1');
      expect(state.items[0]?.name).toBe('Test Product');
      expect(state.items[0]?.price).toBe(99.99);
      expect(state.items[0]?.quantity).toBe(1);
    });

    it('should increase quantity when adding existing item', () => {
      const { addItem } = useCartStore.getState();

      addItem({
        productId: '1',
        name: 'Test Product',
        price: 99.99,
        quantity: 1,
      });

      addItem({
        productId: '1',
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.quantity).toBe(3);
    });

    it('should add multiple different items', () => {
      const { addItem } = useCartStore.getState();

      addItem({ productId: '1', name: 'Product 1', price: 10, quantity: 1 });
      addItem({ productId: '2', name: 'Product 2', price: 20, quantity: 2 });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      const { addItem } = useCartStore.getState();

      addItem({ productId: '1', name: 'Product 1', price: 10, quantity: 1 });
      addItem({ productId: '2', name: 'Product 2', price: 20, quantity: 1 });

      useCartStore.getState().removeItem('1');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.productId).toBe('2');
    });

    it('should do nothing when removing non-existent item', () => {
      const { addItem } = useCartStore.getState();

      addItem({ productId: '1', name: 'Product 1', price: 10, quantity: 1 });

      useCartStore.getState().removeItem('999');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { addItem } = useCartStore.getState();

      addItem({ productId: '1', name: 'Product 1', price: 10, quantity: 1 });

      useCartStore.getState().updateQuantity('1', 5);

      const state = useCartStore.getState();
      expect(state.items[0]?.quantity).toBe(5);
    });

    it('should remove item when quantity is set to 0', () => {
      const { addItem } = useCartStore.getState();

      addItem({ productId: '1', name: 'Product 1', price: 10, quantity: 1 });

      useCartStore.getState().updateQuantity('1', 0);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from the cart', () => {
      const { addItem } = useCartStore.getState();

      addItem({ productId: '1', name: 'Product 1', price: 10, quantity: 1 });
      addItem({ productId: '2', name: 'Product 2', price: 20, quantity: 2 });

      useCartStore.getState().clearCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('getTotalItems', () => {
    it('should return total quantity of all items', () => {
      const { addItem } = useCartStore.getState();

      addItem({ productId: '1', name: 'Product 1', price: 10, quantity: 2 });
      addItem({ productId: '2', name: 'Product 2', price: 20, quantity: 3 });

      const total = useCartStore.getState().getTotalItems();
      expect(total).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      const total = useCartStore.getState().getTotalItems();
      expect(total).toBe(0);
    });
  });

  describe('getTotalPrice', () => {
    it('should calculate total price correctly', () => {
      const { addItem } = useCartStore.getState();

      addItem({ productId: '1', name: 'Product 1', price: 10, quantity: 2 }); // 20
      addItem({ productId: '2', name: 'Product 2', price: 15, quantity: 3 }); // 45

      const total = useCartStore.getState().getTotalPrice();
      expect(total).toBe(65);
    });

    it('should return 0 for empty cart', () => {
      const total = useCartStore.getState().getTotalPrice();
      expect(total).toBe(0);
    });
  });
});
