// src/admin/pages/ReturnRequestsPage/ReturnRequestsPage.jsx
import { useEffect, useState } from 'react';
import { getAllReturnRequests, updateReturnRequest } from '../../../services/returnService';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import '../../components/DataTable.css';

const STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
const STATUS_COLOR = { pending: '#f5a623', approved: '#1a7a3a', rejected: '#e53935' };

function formatVnd(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0));
}

export default function ReturnRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [actingId, setActingId] = useState(null);
  const [noteMap, setNoteMap]   = useState({});
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    getAllReturnRequests()
      .then(setRequests)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id, status) {
    setActingId(id);
    try {
      await updateReturnRequest(id, status, noteMap[id] || '');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status, admin_note: noteMap[id] || r.admin_note } : r));
    } catch (e) {
      setError(e.message);
    } finally {
      setActingId(null);
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Yêu cầu hoàn hàng</h1>
          <p className="adm-page-subtitle">Duyệt hoặc từ chối yêu cầu hoàn hàng từ khách.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="adm-toolbar" style={{ marginBottom: 16 }}>
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            className={`adm-btn ${filter === s ? 'adm-btn-primary' : 'adm-btn-outline'} adm-btn-sm`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Tất cả' : STATUS_LABEL[s]}
            {s !== 'all' && (
              <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>
                {requests.filter(r => r.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <div style={{ color: '#e53935', marginBottom: 12 }}>{error}</div>}

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Khách hàng</th>
                <th>Đơn hàng</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Ngày gửi</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.map(r => (
                <tr key={r.id}>
                  <td className="adm-cell-primary">#{r.id}</td>
                  <td>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{r.users?.name || '—'}</p>
                    <p style={{ fontSize: 12, color: '#888' }}>{r.users?.email}</p>
                  </td>
                  <td>
                    <p style={{ fontWeight: 600 }}>#{r.order_id}</p>
                    <p style={{ fontSize: 12, color: '#888' }}>{formatVnd(r.orders?.total_amount)}</p>
                  </td>
                  <td style={{ maxWidth: 200, fontSize: 13 }}>{r.reason}</td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 13, color: STATUS_COLOR[r.status] }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {r.admin_note && (
                      <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Note: {r.admin_note}</p>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: '#888' }}>
                    {new Date(r.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    {r.status === 'pending' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input
                          className="adm-input"
                          placeholder="Ghi chú admin (tuỳ chọn)"
                          value={noteMap[r.id] || ''}
                          onChange={e => setNoteMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                          style={{ fontSize: 12, padding: '5px 8px' }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="adm-btn adm-btn-sm"
                            style={{ background: '#1a7a3a', color: '#fff', border: 'none' }}
                            disabled={actingId === r.id}
                            onClick={() => handleAction(r.id, 'approved')}
                          >
                            ✅ Duyệt
                          </button>
                          <button
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            disabled={actingId === r.id}
                            onClick={() => handleAction(r.id, 'rejected')}
                          >
                            ❌ Từ chối
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#888' }}>Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="adm-loading-row">Đang tải...</div>}
          {!loading && filtered.length === 0 && (
            <div className="adm-empty-state"><strong>Không có yêu cầu hoàn hàng</strong></div>
          )}
        </div>
      </div>
    </div>
  );
}
