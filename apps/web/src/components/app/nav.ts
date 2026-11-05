import type { UiIcon } from '@/components/ui/Icon';

export const APP_NAV: readonly { href: string; label: string; icon: UiIcon }[] = [
  { href: '/app', label: 'Dashboard', icon: 'home' },
  { href: '/app/network', label: 'My Network', icon: 'users' },
  { href: '/app/discover', label: 'Discover', icon: 'search' },
  { href: '/app/businesses', label: 'Businesses', icon: 'building' },
  { href: '/app/products', label: 'Products', icon: 'box' },
  { href: '/app/rfqs', label: 'RFQs', icon: 'file' },
  { href: '/app/messages', label: 'Messages', icon: 'message' },
  { href: '/app/opportunities', label: 'Opportunities', icon: 'briefcase' },
  { href: '/app/notifications', label: 'Notifications', icon: 'bell' },
  { href: '/app/profile', label: 'My Profile', icon: 'user' },
  { href: '/app/settings', label: 'Settings', icon: 'settings' },
];
