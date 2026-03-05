import { Router } from 'express';
import { getSyncConfig, updateSyncConfig, triggerManualSync, streamSyncLogs } from '../controllers/sync.controller.js';

const router = Router();

// Endpoint para obtener configuración actual del cron de sincronización
router.get('/config', getSyncConfig);

// Endpoint para actualizar la configuración de sincronización (hora, habilitado)
router.post('/config', updateSyncConfig);

// Endpoint SSE para emitir logs en tiempo real
router.get('/stream', streamSyncLogs);

// Endpoint para disparar sincronización manual inmediata
router.post('/manual', triggerManualSync);

export default router;
