import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SCRIPT } from '../config.js';
export async function createCloudClient() {
  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SUPABASE_SCRIPT;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Sin conexión con Supabase. Los tests locales siguen disponibles.'));
      document.head.append(script);
    });
  }
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}
export function assertResult(result) {
  if (result.error) throw new Error(result.error.message || 'Error de sincronización');
  return result.data;
}
export function mergeCycles(a, b) {
  const result = {};
  for (const key of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    if (key.startsWith('__epoch:')) continue;
    const epochKey = '__epoch:' + key,
      ae = Number(a?.[epochKey]?.[0] || 0),
      be = Number(b?.[epochKey]?.[0] || 0);
    result[key] = ae > be ? a[key] || [] : be > ae ? b[key] || [] : [...new Set([...(a?.[key] || []), ...(b?.[key] || [])])];
    if (ae || be) result[epochKey] = [Math.max(ae, be)];
  }
  return result;
}
// Serialized requests prevent callbacks from racing within this browser. Every
// operation captures its user ID and checks it again before writing local data.
export function serialQueue(onError) {
  let tail = Promise.resolve();
  return fn => {
    const next = tail.then(fn);
    tail = next.catch(onError);
    return tail;
  };
}
