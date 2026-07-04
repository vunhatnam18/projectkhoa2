// src/admin/pages/VouchersPage/VouchersPage.jsx
import { useEffect, useState } from 'react';
import { getAllVouchers, createVoucher, toggleVoucher, deleteVoucher } from '../../../services/voucherService';
import '../../components/DataTable.css';

function formatVnd(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0));
}

const EMPTY = { code: '', description: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_discount_amount: '', usage_limit: '', valid_until: '' };

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllVouchers().then(setVouchers).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        valid_until: form.valid_until || null,
      };
      const created = await createVoucher(payload);
      setVouchers(prev => [created, ...prev]);
      setShowForm(false);
      setForm(EMPTY);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleToggle(id, isActive) {
    await toggleVoucher(id, isActive);
    setVouchers(prev => prev.map(v => v.id === id ? { ...v, is_active: isActive } : v));
  }

  async function handleDelete(id) {
    if (!confirm('Xoá voucher này?')) return;
    await deleteVoucher(id);
    setVouchers(prev => prev.filter(v => v.id !== id));
  }

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">🎟️ Voucher giảm giá</h1>
          <p className="adm-page-subtitle">Tạo và quản lý mã giảm giá cho khách hàng.</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Huỷ' : '+ Tạo voucher'}
        </button>
      </div>

      {error && <div style={{ color: '#e53935', marginBottom: 12 }}>{error}</div>}

      {showForm && (
        <div className="adm-card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Tạo voucher mới</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mã voucher *</label>
              <input className="adm-input" style={{ width: '100%' }} placeholder="SALE10" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mô tả</label>
              <input className="adm-input" style={{ width: '100%' }} placeholder="Giảm 10% cho đơn..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Loại giảm giá</label>
              <select className="adm-select" style={{ width: '100%' }} value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VNĐ)</option>
              </select></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Giá trị giảm *</label>
              <input className="adm-input" style={{ width: '100%' }} type="number" placeholder={form.discount_type === 'percent' ? '10' : '50000'} value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} required /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Đơn tối thiểu (VNĐ)</label>
              <input className="adm-input" style={{ width: '100%' }} type="number" placeholder="300000" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Giảm tối đa (VNĐ)</label>
              <input className="adm-input" style={{ width: '100%' }} type="number" placeholder="100000" value={form.max_discount_amount} onChange={e => setForm(f => ({ ...f, max_discount_amount: e.target.value }))} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Giới hạn lượt dùng</label>
              <input className="adm-input" style={{ width: '100%' }} type="number" placeholder="Không giới hạn" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Hết hạn</label>
              <input className="adm-input" style={{ width: '100%' }} type="datetime-local" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} /></div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setShowForm(false)}>Huỷ</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo voucher'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Mã</th><th>Mô tả</th><th>Giảm giá</th><th>Đơn tối thiểu</th><th>Đã dùng</th><th>Hết hạn</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {!loading && vouchers.map(v => (
                <tr key={v.id}>
                  <td className="adm-cell-primary" style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{v.code}</td>
                  <td style={{ fontSize: 13, color: '#666' }}>{v.description || '—'}</td>
                  <td style={{ fontWeight: 600 }}>
                    {v.discount_type === 'percent' ? `${v.discount_value}%` : formatVnd(v.discount_value)}
                    {v.max_discount_amount ? ` (tối đa ${formatVnd(v.max_discount_amount)})` : ''}
                  </td>
                  <td>{v.min_order_amount > 0 ? formatVnd(v.min_order_amount) : '—'}</td>
                  <td>{v.used_count}{v.usage_limit ? `/${v.usage_limit}` : ''}</td>
                  <td style={{ fontSize: 12, color: '#888' }}>{v.valid_until ? new Date(v.valid_until).toLocaleDateString('vi-VN') : 'Không giới hạn'}</td>
                  <td>
                    <button
                      className={`adm-btn adm-btn-sm ${v.is_active ? 'adm-btn-outline' : 'adm-btn-primary'}`}
                      onClick={() => handleToggle(v.id, !v.is_active)}
                    >
                      {v.is_active ? '✅ Đang bật' : '❌ Đang tắt'}
                    </button>
                  </td>
                  <td><button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(v.id)}>Xoá</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="adm-loading-row">Đang tải...</div>}
          {!loading && vouchers.length === 0 && <div className="adm-empty-state"><strong>Chưa có voucher</strong></div>}
        </div>
      </div>
    </div>
  );
}
