// FEATURE REGISTRY: flip `enabled` to add or remove a tab. Route names match files in app/(app)/.
export const features = [
  { key: 'home',      route: 'index',     title: 'Home',      icon: 'home',      enabled: true },
  { key: 'nearby',    route: 'nearby',    title: 'Nearby',    icon: 'location',  enabled: true },
  { key: 'sos',       route: 'sos',       title: 'SOS',       icon: 'alert-circle', enabled: true },
  { key: 'repair',    route: 'repair',    title: 'Repair',    icon: 'construct', enabled: true },
  { key: 'maintenance', route: 'maintenance', title: 'Vehicle care', icon: 'car-sport', enabled: true },
  // Community is reached from Profile, keeping the primary tab bar focused on trip actions.
  { key: 'community', route: 'community', title: 'Community', icon: 'people',    enabled: false },
] as const;
