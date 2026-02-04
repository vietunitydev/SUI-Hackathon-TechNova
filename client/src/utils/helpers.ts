import QRCode from 'qrcode';

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#667eea',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

/**
 * Format countdown time
 */
export function formatCountdown(milliseconds: number): string {
  if (milliseconds <= 0) return 'Sự kiện đang diễn ra!';

  const seconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days} ngày ${hours} giờ ${minutes} phút`;
  } else if (hours > 0) {
    return `${hours} giờ ${minutes} phút ${secs} giây`;
  } else if (minutes > 0) {
    return `${minutes} phút ${secs} giây`;
  } else {
    return `${secs} giây`;
  }
}

/**
 * Format SUI amount (from MIST)
 */
export function formatSUI(mist: number): string {
  const sui = mist / 1e9;
  return sui.toFixed(4) + ' SUI';
}

/**
 * Parse SUI to MIST
 */
export function suiToMist(sui: number): number {
  return Math.floor(sui * 1e9);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Check if event has started
 */
export function isEventStarted(eventTime: number): boolean {
  return Date.now() >= eventTime;
}

/**
 * Check if event has ended (1 day grace period)
 */
export function isEventEnded(eventTime: number): boolean {
  return Date.now() > eventTime + 86400000; // +24 hours
}

/**
 * Get ticket state label in Vietnamese
 */
export function getStateLabel(state: number): string {
  const labels: Record<number, string> = {
    0: 'Chờ sự kiện',
    1: 'Đã check-in',
    2: 'Huy hiệu kỷ niệm',
  };
  return labels[state] || 'Không xác định';
}

/**
 * Get ticket state emoji
 */
export function getStateEmoji(state: number): string {
  const emojis: Record<number, string> = {
    0: '🎫',
    1: '✅',
    2: '🏆',
  };
  return emojis[state] || '❓';
}

/**
 * Validate event form data
 */
export function validateEventForm(data: {
  name: string;
  eventTime: number;
  originalPrice: number;
  totalTickets: number;
  venue: string;
  description: string;
}): string | null {
  if (!data.name || data.name.trim().length < 3) {
    return 'Tên sự kiện phải có ít nhất 3 ký tự';
  }

  if (data.eventTime <= Date.now()) {
    return 'Thời gian sự kiện phải trong tương lai';
  }

  if (data.originalPrice <= 0) {
    return 'Giá vé phải lớn hơn 0';
  }

  if (data.totalTickets <= 0 || data.totalTickets > 10000) {
    return 'Số lượng vé phải từ 1 đến 10,000';
  }

  if (!data.venue || data.venue.trim().length < 3) {
    return 'Địa điểm phải có ít nhất 3 ký tự';
  }

  if (!data.description || data.description.trim().length < 10) {
    return 'Mô tả phải có ít nhất 10 ký tự';
  }

  return null;
}
