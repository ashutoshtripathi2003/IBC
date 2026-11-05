import type { IndustryIcon } from '@/content/catalog';

/** One consistent line-icon set (24px grid, 1.6 stroke). Decorative unless `label` is given. */
export const PATHS: Record<IndustryIcon | UiIcon, string> = {
  // Industries
  flask: 'M9 3h6M10 3v5.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 8.5V3M7.5 14h9',
  capsule: 'M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7zM7.5 10.5l6 6',
  drop: 'M12 3c3.5 4.2 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6.8 6-11zM9 15a3 3 0 0 0 3 3',
  rig: 'M12 3 6 21M12 3l6 18M8.6 13.5h6.8M7.3 17.5h9.4M12 3v4M4 21h16',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3',
  factory: 'M3 21V10l5 3V10l5 3V10l5 3V4h3v17zM3 21h18M7 17h2M12 17h2M17 17h2',
  ingot: 'M3 17.5 6.5 9h11l3.5 8.5zM6.5 9 8 5.5h8L17.5 9M3 17.5h18',
  car: 'M5 17h14M4 17v-4l2-5h12l2 5v4M4 13h16M7 17v2M17 17v2M7.5 13.5h.01M16.5 13.5h.01',
  crane: 'M6 21V4l14 3M6 4 3 7h3M6 7h14M16 7v5M14.5 12h3v3h-3zM3 21h8',
  bolt: 'M13 2 4.5 13.5H12L11 22l8.5-11.5H12z',
  chip: 'M7 7h10v10H7zM10 10h4v4h-4zM9.5 2.5V7M14.5 2.5V7M9.5 17v4.5M14.5 17v4.5M2.5 9.5H7M2.5 14.5H7M17 9.5h4.5M17 14.5h4.5',
  spool: 'M6 4h12M6 20h12M8 4v16M16 4v16M8 8l8 2M8 12l8 2M8 16l8-6',
  leaf: 'M5 19c0-8 5-13 15-14-1 10-6 15-14 15zM5 19l7-7',
  truck:
    'M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5V16h-7M6.5 19a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17 19a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z',
  valve: 'M3 10v6M21 10v6M3 13h5M16 13h5M8 9l8 8M8 17l8-8M12 9V5M9 5h6',
  // Interface
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8',
  pin: 'M12 21s-6.5-5.4-6.5-11a6.5 6.5 0 0 1 13 0c0 5.6-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  chevron: 'm9 6 6 6-6 6',
  chevronDown: 'm6 9 6 6 6-6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'm5 12.5 4.2 4.2L19 7',
  shield: 'M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6zM9 12l2.2 2.2L15.5 10',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  building:
    'M4 21V5l8-2v18M12 8h8v13M7.5 8h1.5M7.5 12h1.5M7.5 16h1.5M15.5 12h1.5M15.5 16h1.5M2.5 21h19',
  box: 'M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0',
  briefcase: 'M3 7.5h18V20H3zM8.5 7.5V5h7v2.5M3 13h18',
  wrench: 'M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2zM14.5 6.5l3-3',
  filter: 'M4 5h16l-6 7.5V19l-4 2v-8.5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  message: 'M4 5h16v11H8l-4 4z',
  plus: 'M12 5v14M5 12h14',
  globe:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  users:
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.8c2 .7 3.2 2.5 3.5 5.2',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-1.7 1l-.3 2h-4l-.3-2a7 7 0 0 1-1.7-1l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-3L3 9.3l2-3.4 1.9.7a7 7 0 0 1 1.7-1l.3-2h4l.3 2a7 7 0 0 1 1.7 1l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 3z',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
};

export type UiIcon =
  | 'search'
  | 'pin'
  | 'chevron'
  | 'chevronDown'
  | 'arrow'
  | 'check'
  | 'shield'
  | 'menu'
  | 'close'
  | 'building'
  | 'box'
  | 'user'
  | 'briefcase'
  | 'wrench'
  | 'filter'
  | 'clock'
  | 'message'
  | 'plus'
  | 'globe'
  | 'grid'
  | 'list'
  | 'bell'
  | 'home'
  | 'users'
  | 'file'
  | 'settings'
  | 'logout';

export function Icon({
  name,
  size = 20,
  label,
  className,
}: {
  name: IndustryIcon | UiIcon;
  size?: number;
  label?: string;
  className?: string | undefined;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
