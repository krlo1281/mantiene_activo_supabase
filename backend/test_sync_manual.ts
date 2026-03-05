import { syncToSupabase } from './src/scripts/syncToSupabase.js';

async function run() {
    console.log('[DEBUG] Forzando sincronización...');
    try {
        const result = await syncToSupabase();
        console.log('[DEBUG] Resultado:', result);
    } catch (e: any) {
        console.error('[DEBUG] FATAL CATCH:', e);
    }
}
run();
