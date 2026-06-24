// src/hooks/useProducts.js
import { useState, useEffect } from "react";
import {
  getFlashSaleProducts,
  getProductsByCategory,
  getProductBySlug,
  searchProducts,
} from "../services/productService";

function useAsyncData(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFn()
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

export function useFlashSaleProducts() {
  const { data, loading, error } = useAsyncData(() => getFlashSaleProducts(8), []);
  return { products: data || [], loading, error };
}

export function useProductsByCategory(slug) {
  const { data, loading, error } = useAsyncData(() => getProductsByCategory(slug), [slug]);
  return { products: data || [], loading, error };
}

export function useProductBySlug(slug) {
  const { data, loading, error } = useAsyncData(() => getProductBySlug(slug), [slug]);
  return { product: data, loading, error };
}

export function useSearchProducts(keyword) {
  const { data, loading, error } = useAsyncData(
    () => keyword?.trim() ? searchProducts(keyword) : Promise.resolve([]),
    [keyword]
  );
  return { products: data || [], loading, error };
}
