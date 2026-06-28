// src/context/CartContext.jsx
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  addCartItem,
  getCartItems,
  removeCartItem,
  removeCartItems,
  updateCartItemQuantity,
} from "../services/cartService";

const CartContext = createContext(undefined);

const STORAGE_KEY = "hnstore_cart";
const SELECTED_STORAGE_KEY = "hnstore_cart_selected";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const rows = raw ? JSON.parse(raw) : [];
    return rows.map((item) => {
      const idParts = String(item.id).split("-");
      const variantId = item.variantId || idParts[idParts.length - 1];
      return {
        ...item,
        id: String(variantId),
        variantId,
      };
    });
  } catch {
    return [];
  }
}

function loadSelectedFromStorage() {
  try {
    const raw = localStorage.getItem(SELECTED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeLocalItem(product, quantity) {
  const variantId = product.variantId || product.id;
  const id = String(variantId);
  return {
    ...product,
    id,
    variantId,
    quantity,
  };
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => loadFromStorage());
  const [selectedIds, setSelectedIds] = useState(() => loadSelectedFromStorage() || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isServerCart = Boolean(user);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems(loadFromStorage());
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const localItems = loadFromStorage();
      if (localItems.length > 0) {
        await Promise.all(
          localItems.map((item) => addCartItem(item.variantId, item.quantity))
        );
        localStorage.removeItem(STORAGE_KEY);
      }

      const rows = await getCartItems();
      setItems(rows);
      setError(null);
      setSelectedIds((prev) => {
        const validIds = new Set(rows.map((item) => item.id));
        const kept = prev.filter((id) => validIds.has(id));
        return kept.length ? kept : rows.map((item) => item.id);
      });
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Lưu giỏ localStorage cho khách chưa đăng nhập.
  useEffect(() => {
    if (!isServerCart) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [isServerCart, items]);

  useEffect(() => {
    localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(selectedIds));
  }, [selectedIds]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(items.map((item) => item.id));
      const kept = prev.filter((id) => validIds.has(id));
      if (kept.length > 0 || items.length === 0) return kept;
      return items.map((item) => item.id);
    });
  }, [items]);

  async function addToCart(product, quantity = 1, { selectOnlyThis = false } = {}) {
    const variantId = product.variantId || product.id;

    if (isServerCart) {
      setLoading(true);
      try {
        await addCartItem(variantId, quantity);
        const rows = await getCartItems();
        setItems(rows);
        const added = rows.find((item) => String(item.variantId) === String(variantId));
        if (added) {
          setSelectedIds((prev) => (
            selectOnlyThis ? [added.id] : Array.from(new Set([...prev, added.id]))
          ));
        }
        setError(null);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
      return;
    }

    setItems((prev) => {
      const existing = prev.find((i) => String(i.variantId || i.id) === String(variantId));
      if (existing) {
        return prev.map((i) =>
          String(i.variantId || i.id) === String(variantId)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, normalizeLocalItem(product, quantity)];
    });
    setSelectedIds((prev) => (
      selectOnlyThis ? [String(variantId)] : Array.from(new Set([...prev, String(variantId)]))
    ));
  }

  async function removeFromCart(itemId) {
    if (isServerCart) {
      try {
        await removeCartItem(itemId);
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setSelectedIds((prev) => prev.filter((id) => id !== itemId));
      } catch (err) {
        setError(err.message);
        throw err;
      }
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setSelectedIds((prev) => prev.filter((id) => id !== itemId));
  }

  async function updateQuantity(itemId, quantity) {
    if (quantity < 1) return removeFromCart(itemId);

    if (isServerCart) {
      try {
        await updateCartItemQuantity(itemId, quantity);
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
        );
      } catch (err) {
        setError(err.message);
        throw err;
      }
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  }

  function toggleSelected(itemId) {
    setSelectedIds((prev) => (
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    ));
  }

  function selectAll() {
    setSelectedIds(items.map((item) => item.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function setItemSelected(itemId, checked) {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, itemId]));
      return prev.filter((id) => id !== itemId);
    });
  }

  async function clearCart() {
    const ids = items.map((item) => item.id);
    if (isServerCart) await removeCartItems(ids);
    setItems([]);
    setSelectedIds([]);
  }

  async function clearSelectedItems() {
    const selectedSet = new Set(selectedIds);
    const selectedCartItemIds = items
      .filter((item) => selectedSet.has(item.id))
      .map((item) => item.id);

    if (isServerCart) await removeCartItems(selectedCartItemIds);
    setItems((prev) => prev.filter((item) => !selectedSet.has(item.id)));
    setSelectedIds([]);
  }

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIdSet.has(item.id)),
    [items, selectedIdSet]
  );
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedTotalItems = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const selectedTotalPrice = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        selectedIds,
        selectedItems,
        loading,
        error,
        isServerCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelected,
        setItemSelected,
        selectAll,
        clearSelection,
        clearCart,
        clearSelectedItems,
        refreshCart,
        totalItems,
        totalPrice,
        selectedTotalItems,
        selectedTotalPrice,
        allSelected,
      }}
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
