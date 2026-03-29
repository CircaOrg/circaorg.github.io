export const IS_STATIC_DEPLOYMENT =
  typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
