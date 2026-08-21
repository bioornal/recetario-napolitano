import { createClient } from '@insforge/sdk';

const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_INSFORGE_URL) || 'https://3agqcygs.us-east.insforge.app';
const anonKey = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_INSFORGE_ANON_KEY) || 'ik_70b987ef8140f0dd67249f4a81678d36400ecfb869010a42a403a3231a830414';

export const insforge = createClient({ baseUrl, anonKey });
export const db = insforge.database;

