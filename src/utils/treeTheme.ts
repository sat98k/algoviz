export interface NodeTheme {
  bg: string;
  border: string;
  primaryText: string;
  subText: string;
  badgeBg?: string;
  badgeBorder?: string;
  badgeText?: string;
  ringColor?: string;
  ringPulse?: boolean;
}

export const NODE_THEMES: Record<string, NodeTheme> = {
  active: {
    bg: '#f59e0b', // Amber 500
    border: '#fbbf24', // Amber 400
    primaryText: '#0a0a0c', // Pure dark for maximum contrast on amber (> 10:1)
    subText: '#1e293b', // Deep slate for legible metrics
    ringColor: '#f59e0b',
    ringPulse: true,
  },
  best: {
    bg: '#047857', // Emerald 700
    border: '#34d399', // Mint 400
    primaryText: '#ffffff', // Pure white (> 5.5:1)
    subText: '#ecfdf5', // Crisp mint white (> 7:1)
    badgeBg: '#064e3b',
    badgeBorder: '#34d399',
    badgeText: '#a7f3d0',
    ringColor: '#10b981',
  },
  solution: {
    bg: '#047857',
    border: '#34d399',
    primaryText: '#ffffff',
    subText: '#ecfdf5',
    badgeBg: '#064e3b',
    badgeBorder: '#34d399',
    badgeText: '#a7f3d0',
    ringColor: '#10b981',
  },
  pruned: {
    bg: '#4c0519', // Deep maroon 950
    border: '#f43f5e', // Rose 500
    primaryText: '#ffffff', // Pure white (> 12:1)
    subText: '#fecdd3', // Soft rose white (> 8:1)
    badgeBg: '#881337',
    badgeBorder: '#f43f5e',
    badgeText: '#ffe4e6',
  },
  explored: {
    bg: '#1e2433', // Deep navy slate
    border: '#475569', // Slate 600
    primaryText: '#f8fafc', // Slate 50 (> 11:1)
    subText: '#cbd5e1', // Slate 300 (> 7:1)
  },
  normal: {
    bg: '#12151e', // Obsidian base
    border: '#334155', // Slate 700
    primaryText: '#f1f5f9', // Slate 100 (> 13:1)
    subText: '#94a3b8', // Slate 400 (> 5.5:1)
  },
};

export function getNodeTheme(status?: string): NodeTheme {
  if (!status) return NODE_THEMES.normal;
  return NODE_THEMES[status] || NODE_THEMES.normal;
}
