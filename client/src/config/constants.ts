// Sui Configuration
export const SUI_NETWORK = 'testnet';

// Package ID - Deployed on Sui Testnet
export const PACKAGE_ID = '0xfd42fcbb4bca22fafe1a7caa0196c146f4cb04cc3c95768b6c3c3d3eebf0356a';

// Module names
export const MODULE_NAME = 'dynamic_ticket';

// Ticket States
export const TICKET_STATE = {
  PENDING: 0,
  CHECKED_IN: 1,
  COMMEMORATIVE: 2,
} as const;

export const TICKET_STATE_LABELS: Record<number, string> = {
  [TICKET_STATE.PENDING]: 'Chờ sự kiện',
  [TICKET_STATE.CHECKED_IN]: 'Đã check-in',
  [TICKET_STATE.COMMEMORATIVE]: 'Huy hiệu kỷ niệm',
};

// Image URLs based on state
export const TICKET_IMAGES: Record<number, string> = {
  [TICKET_STATE.PENDING]: 'https://api.ticket-system.io/pending.png',
  [TICKET_STATE.CHECKED_IN]: 'https://api.ticket-system.io/checked-in.png',
  [TICKET_STATE.COMMEMORATIVE]: 'https://api.ticket-system.io/poap-badge.png',
};

// Network config
export const NETWORK_CONFIG = {
  testnet: {
    url: 'https://fullnode.testnet.sui.io:443',
  },
  mainnet: {
    url: 'https://fullnode.mainnet.sui.io:443',
  },
};
