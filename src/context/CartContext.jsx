// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(undefined);

const STORAGE_KEY = "hnstore_cart";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadFromStorage());

  // Lưu vào localStorage mỗi khi items thay đổi
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addToCart(product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
  }

  function removeFromCart(productId) {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) return removeFromCart(productId);
    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity } : i))
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart phải được dùng bên trong <CartProvider>");
  }
  return context;
}
