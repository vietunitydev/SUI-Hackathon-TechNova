import React from 'react';
import { CreateEventForm } from '../components/CreateEventForm';
import type { CreateEventParams } from '../types/ticket';

interface CreateEventPageProps {
  userAddress?: string;
  onSubmit: (params: CreateEventParams) => void;
  loading: boolean;
}

export const CreateEventPage: React.FC<CreateEventPageProps> = ({ userAddress, onSubmit, loading }) => {
  if (!userAddress) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔐</div>
        <h3 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Vui lòng kết nối ví</h3>
        <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
          Bạn cần kết nối ví Sui Wallet để tạo sự kiện
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6' }}>
          Tạo sự kiện mới và bắt đầu bán vé với công nghệ NFT trên blockchain Sui. 
          Hệ thống tự động chống phe vé và đảm bảo tính minh bạch.
        </p>
      </div>
      
      <CreateEventForm onSubmit={onSubmit} loading={loading} />
      
      <div className="card" style={{ marginTop: '20px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <h4 style={{ color: '#60a5fa', marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>
          Tính năng của hệ thống
        </h4>
        <ul style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
          <li>Vé NFT thay đổi trạng thái tự động theo thời gian</li>
          <li>Chống phe vé: Không được bán lại cao hơn giá gốc</li>
          <li>Hàng chờ FIFO đảm bảo công bằng</li>
          <li>POAP (Proof of Attendance) kỷ niệm sau sự kiện</li>
          <li>Minh bạch hoàn toàn trên blockchain</li>
        </ul>
      </div>
    </div>
  );
};
