import type { Request, Response } from 'express';
import { syncToSupabase } from '../scripts/syncToSupabase.js';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../syncConfig.json');

// Variables de estado simples para la config
let autoSyncEnabled = false;
let autoSyncTime = '03:00'; // Formato HH:mm
let currentCronJob: cron.ScheduledTask | null = null;
let lastSyncStatus: { success: boolean; date: string | null; message?: string } = {
    success: false,
    date: null,
};

// Intentar cargar la configuración si existe
try {
    if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf8');
        const parsed = JSON.parse(data);
        if (typeof parsed.enabled === 'boolean') autoSyncEnabled = parsed.enabled;
        if (typeof parsed.time === 'string' && parsed.time.match(/^\d{2}:\d{2}$/)) autoSyncTime = parsed.time;
    }
} catch (error) {
    console.error('[CRON] Error leyendo syncConfig.json', error);
}

// Función para guardar en disco
const saveConfigToDisk = () => {
    try {
        fs.writeFileSync(configPath, JSON.stringify({ enabled: autoSyncEnabled, time: autoSyncTime }), 'utf8');
    } catch (error) {
        console.error('[CRON] Error guardando syncConfig.json', error);
    }
};

// Función interna para reprogramar el cron basado en la configuración actual
const rescheduleCron = () => {
    // 1. Detener job actual si existe
    if (currentCronJob) {
        currentCronJob.stop();
        currentCronJob = null;
    }

    // 2. Si el autosync está deshabilitado, salir
    if (!autoSyncEnabled) {
        console.log('[CRON] Sincronización automática desactivada.');
        return;
    }

    // 3. Parsear hora (HH:mm) a cron expression (M H * * *)
    const [hour, minute] = autoSyncTime.split(':');
    const cronExpression = `${minute} ${hour} * * *`;

    // 4. Programar nuevo job
    currentCronJob = cron.schedule(cronExpression, async () => {
        console.log(`[CRON] Disparando sincronización programada a las ${autoSyncTime}...`);
        const result = await syncToSupabase();
        lastSyncStatus = {
            success: result.success,
            date: new Date().toISOString(),
            message: result.message,
        };
    });

    console.log(`[CRON] Tarea programada configurada para ejecutarse a las ${autoSyncTime} (Exp: ${cronExpression})`);
};

// ==========================
// ENDPOINTS
// ==========================

// GET /api/sync/config -> Obtiene la configuración actual
export const getSyncConfig = async (req: Request, res: Response) => {
    res.json({
        enabled: autoSyncEnabled,
        time: autoSyncTime,
        lastSync: lastSyncStatus,
    });
};

// POST /api/sync/config -> Actualiza la configuración y reprograma
export const updateSyncConfig = async (req: Request, res: Response) => {
    const { enabled, time } = req.body;

    if (typeof enabled === 'boolean') {
        autoSyncEnabled = enabled;
    }

    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}$/)) {
        autoSyncTime = time;
    }

    saveConfigToDisk();
    rescheduleCron();

    res.json({
        message: 'Configuración actualizada',
        enabled: autoSyncEnabled,
        time: autoSyncTime,
    });
};

import { EventEmitter } from 'events';
export const syncEmitter = new EventEmitter();

// GET /api/sync/stream -> Servir SSE (Server-Sent Events) con los logs de sync
export const streamSyncLogs = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Enviar headers inmediatamente

    const onLog = (msg: string) => {
        res.write(`data: ${JSON.stringify({ type: 'log', message: msg })}\n\n`);
    };

    const onDone = (result: any) => {
        res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
        res.end(); // Terminar conexión cuando acaba
    };

    syncEmitter.on('log', onLog);
    syncEmitter.once('done', onDone);

    // Si el cliente desconecta temprano
    req.on('close', () => {
        syncEmitter.off('log', onLog);
        syncEmitter.off('done', onDone);
    });
};

// POST /api/sync/manual -> Dispara una sincronización imperativa
export const triggerManualSync = async (req: Request, res: Response) => {
    console.log('[API] Petición de sincronización manual recibida.');

    try {
        // Iniciar el proceso y mandar logs al EventEmitter
        syncToSupabase((msg) => {
            syncEmitter.emit('log', msg);
        }).then(result => {
            lastSyncStatus = {
                success: result.success,
                date: new Date().toISOString(),
                message: result.message,
            };
            syncEmitter.emit('done', result);
        }).catch(e => {
            console.error('[API] Error asíncrono en syncToSupabase:', e);
            lastSyncStatus = {
                success: false,
                date: new Date().toISOString(),
                message: e.message,
            };
            syncEmitter.emit('done', { success: false, message: e.message });
        });

        // Responder inmediatamente al frontend
        res.status(202).json({
            success: true,
            message: 'La sincronización ha iniciado.'
        });

    } catch (e: any) {
        console.error('[API] ❌ CATCH CRÍTICO en triggerManualSync:', e);
        res.status(500).json({ success: false, message: 'Fallo al despachar sincronización', error: e.message });
    }
};

// Inicialización de la configuración por defecto al arrancar el servidor
rescheduleCron();
