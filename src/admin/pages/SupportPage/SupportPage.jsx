// src/admin/pages/SupportPage/SupportPage.jsx
import { useEffect, useState } from 'react';
import { getAllSupportMessages, replyMessage, closeMessage } from '../../../services/supportService';
import '../../components/DataTable.css';

const STATUS_LABEL = { open: 'Chờ xử lý', replied: 'Đã trả lời', closed: 'Đã đóng' };
const STATUS_COLOR = { open: '#f5a623', replied: '#1a7a3a', closed: '#888' };

export default function SupportPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [replyMap, setReplyMap] = useState({});
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    getAllSupportMessages().then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleReply(id) {
    if (!replyMap[id]?.trim()) return;
    setActingId(id);
    try {
      await replyMessage(id, replyMap[id]);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, reply: replyMap[id], status: 'replied' } : m));
    } finally { setActingId(null); }
  }

  async function handleClose(id) {
    setActingId(id);
    try {
      await closeMessage(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'closed' } : m));
    } finally { setActingId(null); }
  }

  const filtered = filter === 'all' ? messages : messages.filter(m => m.status === filter);

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">💬 Hỗ trợ khách hàng</h1>
          <p className="adm-page-subtitle">Xem và phản hồi tin nhắn từ khách hàng.</p>
        </div>
      </div>

      <div className="adm-toolbar" style={{ marginBottom: 16 }}>
        {['all', 'open', 'replied', 'closed'].map(s => (
          <button key={s} className={`adm-btn ${filter === s ? 'adm-btn-primary' : 'adm-btn-outline'} adm-btn-sm`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'Tất cả' : STATUS_LABEL[s]}
            <span style={{ marginLeft: 5, background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>
              {s === 'all' ? messages.length : messages.filter(m => m.status === s).length}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading && <div className="adm-loading-row">Đang tải...</div>}
        {!loading && filtered.length === 0 && <div className="adm-empty-state"><strong>Không có tin nhắn</strong></div>}
        {filtered.map(m => (
          <div key={m.id} className="adm-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{m.users?.name || m.guest_name || 'Khách vãng lai'}</p>
                <p style={{ fontSize: 12, color: '#888' }}>{m.users?.email || m.guest_email || ''}</p>
                <p style={{ fontSize: 11, color: '#aaa' }}>{new Date(m.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: STATUS_COLOR[m.status] }}>{STATUS_LABEL[m.status]}</span>
            </div>
            <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 12 }}>
              {m.message}
            </div>
            {m.reply && (
              <div style={{ background: '#eaffea', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 12, color: '#1a7a3a' }}>
                <strong>Phản hồi:</strong> {m.reply}
              </div>
            )}
            {m.status !== 'closed' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  className="adm-input"
                  rows={2}
                  style={{ flex: 1, resize: 'none' }}
                  placeholder="Nhập phản hồi..."
                  value={replyMap[m.id] || ''}
                  onChange={e => setReplyMap(prev => ({ ...prev, [m.id]: e.target.value }))}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="adm-btn adm-btn-primary adm-btn-sm" disabled={actingId === m.id || !replyMap[m.id]?.trim()} onClick={() => handleReply(m.id)}>
                    Gửi
                  </button>
                  <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={actingId === m.id} onClick={() => handleClose(m.id)}>
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
