// src/pages/Seller/ProductForm.jsx
import { useState, useEffect } from "react";
import { useCategories } from "../../context/CategoryContext";
import { createProduct, updateProduct, addVariant, uploadProductImage } from "../../services/sellerService";
import { supabase } from "../../services/supabaseClient";
import { formatPrice } from "../../utils/format";
import styles from "./ProductForm.module.css";

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProductForm({ sellerId, editData, onSuccess }) {
  const { categories } = useCategories();
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({
    name: editData?.name || "",
    slug: editData?.slug || "",
    description: editData?.description || "",
    basePrice: editData?.base_price || "",
    categoryId: editData?.category_id || "",
    brandId: editData?.brand_id || "",
  });
  const [variants, setVariants] = useState(
    editData?.product_variants?.length > 0
      ? editData.product_variants
      : [{ color: "", size: "", storage: "", price: "", stock: "" }]
  );
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    supabase.from("brands").select("id, name").order("name")
      .then(({ data }) => setBrands(data || []));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === "name" && !editData) {
      setForm(f => ({ ...f, name: value, slug: slugify(value) }));
    }
    setErrors(err => ({ ...err, [name]: "" }));
  }

  function handleVariantChange(idx, field, value) {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  }

  function addVariantRow() {
    setVariants(prev => [...prev, { color: "", size: "", storage: "", price: "", stock: "" }]);
  }

  function removeVariantRow(idx) {
    setVariants(prev => prev.filter((_, i) => i !== idx));
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập tên sản phẩm";
    if (!form.slug.trim()) e.slug = "Vui lòng nhập slug";
    if (!form.basePrice || isNaN(form.basePrice) || Number(form.basePrice) <= 0) e.basePrice = "Giá phải lớn hơn 0";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) return setErrors(e2);

    setLoading(true);
    try {
      let product;
      if (editData) {
        product = await updateProduct(editData.id, {
          name: form.name,
          slug: form.slug,
          description: form.description,
          base_price: Number(form.basePrice),
          category_id: form.categoryId || null,
          brand_id: form.brandId || null,
        });
      } else {
        product = await createProduct({
          sellerId,
          name: form.name,
          slug: form.slug,
          description: form.description,
          basePrice: Number(form.basePrice),
          categoryId: form.categoryId || null,
          brandId: form.brandId || null,
        });
      }

      // Upload ảnh mới
      for (let i = 0; i < imageFiles.length; i++) {
        await uploadProductImage(product.id, imageFiles[i], i);
      }

      // Thêm variants mới (chỉ khi tạo mới)
      if (!editData) {
        for (const v of variants) {
          if (v.price && v.stock !== "") {
            await addVariant(product.id, {
              color: v.color || null,
              size: v.size || null,
              storage: v.storage || null,
              price: Number(v.price),
              stock: Number(v.stock),
            });
          }
        }
      }

      onSuccess();
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>{editData ? "✏️ Sửa sản phẩm" : "➕ Thêm sản phẩm mới"}</h2>
      </div>

      {/* Basic info */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Tên sản phẩm *</label>
            <input name="name" className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              placeholder="iPhone 15 Pro Max 256GB" value={form.name} onChange={handleChange} />
            {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Slug (URL) *</label>
            <input name="slug" className={`${styles.input} ${errors.slug ? styles.inputError : ""}`}
              placeholder="iphone-15-pro-max-256gb" value={form.slug} onChange={handleChange} />
            {errors.slug && <span className={styles.errorMsg}>{errors.slug}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Giá cơ bản (VNĐ) *</label>
            <input name="basePrice" type="number" className={`${styles.input} ${errors.basePrice ? styles.inputError : ""}`}
              placeholder="28990000" value={form.basePrice} onChange={handleChange} min={0} />
            {errors.basePrice && <span className={styles.errorMsg}>{errors.basePrice}</span>}
            {form.basePrice && !isNaN(form.basePrice) && (
              <span className={styles.pricePreview}>{formatPrice(Number(form.basePrice))}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Danh mục</label>
            <select name="categoryId" className={styles.select} value={form.categoryId} onChange={handleChange}>
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Thương hiệu</label>
            <select name="brandId" className={styles.select} value={form.brandId} onChange={handleChange}>
              <option value="">-- Chọn thương hiệu --</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.field} style={{ marginTop: 14 }}>
          <label className={styles.label}>Mô tả sản phẩm</label>
          <textarea name="description" className={styles.textarea} rows={4}
            placeholder="Mô tả chi tiết về sản phẩm..." value={form.description} onChange={handleChange} />
        </div>
      </div>

      {/* Images */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Hình ảnh sản phẩm</h3>
        <input type="file" multiple accept="image/*" onChange={handleImageChange} className={styles.fileInput} />
        {imagePreviews.length > 0 && (
          <div className={styles.previews}>
            {imagePreviews.map((url, i) => (
              <img key={i} src={url} alt={`preview ${i}`} className={styles.preview} />
            ))}
          </div>
        )}
        {editData?.product_images?.length > 0 && imagePreviews.length === 0 && (
          <div className={styles.previews}>
            {editData.product_images.sort((a, b) => a.display_order - b.display_order).map((img, i) => (
              <img key={i} src={img.image_url} alt={`img ${i}`} className={styles.preview} />
            ))}
          </div>
        )}
      </div>

      {/* Variants */}
      {!editData && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Phiên bản sản phẩm</h3>
          <p className={styles.sectionSub}>Thêm các phiên bản khác nhau (màu sắc, dung lượng,...)</p>
          {variants.map((v, idx) => (
            <div key={idx} className={styles.variantRow}>
              <input className={styles.inputSm} placeholder="Màu sắc" value={v.color} onChange={e => handleVariantChange(idx, "color", e.target.value)} />
              <input className={styles.inputSm} placeholder="Dung lượng" value={v.storage} onChange={e => handleVariantChange(idx, "storage", e.target.value)} />
              <input className={styles.inputSm} placeholder="Size" value={v.size} onChange={e => handleVariantChange(idx, "size", e.target.value)} />
              <input className={styles.inputSm} type="number" placeholder="Giá *" value={v.price} onChange={e => handleVariantChange(idx, "price", e.target.value)} min={0} />
              <input className={styles.inputSm} type="number" placeholder="Tồn kho *" value={v.stock} onChange={e => handleVariantChange(idx, "stock", e.target.value)} min={0} />
              {variants.length > 1 && (
                <button type="button" className={styles.removeVariantBtn} onClick={() => removeVariantRow(idx)}>✕</button>
              )}
            </div>
          ))}
          <button type="button" className={styles.addVariantBtn} onClick={addVariantRow}>+ Thêm phiên bản</button>
        </div>
      )}

      <div className={styles.formActions}>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Đang lưu..." : editData ? "💾 Lưu thay đổi" : "🚀 Đăng sản phẩm"}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onSuccess}>Huỷ</button>
      </div>
    </form>
  );
}
