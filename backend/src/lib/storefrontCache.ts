import { AsyncCache } from '@pick2buy/shared';

// Public catalogue data only. Never put account, cart, order or payment data here.
export const storefrontCache = new AsyncCache<unknown>(100);
