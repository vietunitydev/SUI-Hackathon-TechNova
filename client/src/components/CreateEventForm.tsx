import React, { useState } from 'react';
import type { CreateEventParams } from '../types/ticket';

interface CreateEventFormProps {
  onSubmit: (params: CreateEventParams) => void;
  loading?: boolean;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateEventParams>({
    name: '',
    eventTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // +7 days
    originalPrice: 0,
    totalTickets: 0,
    venue: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'eventTime' ? new Date(value).getTime() : 
              name === 'originalPrice' || name === 'totalTickets' ? Number(value) : 
              value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 style={{ marginTop: 0 }}>Tạo Sự Kiện Mới</h2>

      <div>
        <label className="label">Tên sự kiện</label>
        <input
          type="text"
          name="name"
          className="input"
          value={formData.name}
          onChange={handleChange}
          placeholder="VD: TechNova Hackathon 2026"
          required
        />
      </div>

      <div>
        <label className="label">Thời gian sự kiện</label>
        <input
          type="datetime-local"
          name="eventTime"
          className="input"
          value={new Date(formData.eventTime).toISOString().slice(0, 16)}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label className="label">Giá vé (SUI)</label>
        <input
          type="number"
          name="originalPrice"
          className="input"
          value={formData.originalPrice}
          onChange={handleChange}
          placeholder="VD: 1000000000 (1 SUI)"
          step="1000000"
          min="0"
          required
        />
        <p style={{ fontSize: '12px', color: '#718096', marginTop: '-10px' }}>
          1 SUI = 1,000,000,000 MIST
        </p>
      </div>

      <div>
        <label className="label">Số lượng vé</label>
        <input
          type="number"
          name="totalTickets"
          className="input"
          value={formData.totalTickets}
          onChange={handleChange}
          placeholder="VD: 100"
          min="1"
          required
        />
      </div>

      <div>
        <label className="label">Địa điểm</label>
        <input
          type="text"
          name="venue"
          className="input"
          value={formData.venue}
          onChange={handleChange}
          placeholder="VD: Trung tâm Hội nghị Quốc gia"
          required
        />
      </div>

      <div>
        <label className="label">Mô tả</label>
        <textarea
          name="description"
          className="input"
          value={formData.description}
          onChange={handleChange}
          placeholder="Mô tả chi tiết về sự kiện..."
          rows={4}
          required
          style={{ resize: 'vertical' }}
        />
      </div>

      <button type="submit" className="button" disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Đang tạo...' : '🎉 Tạo sự kiện'}
      </button>
    </form>
  );
};
