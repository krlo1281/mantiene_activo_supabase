import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

import { prisma as localPrisma } from '../lib/prisma.js';

export const syncToSupabase = async (onLog?: (msg: string) => void) => {
    const log = (msg: string) => {
        console.log(msg);
        if (onLog) onLog(msg);
    };

    log('[SYNC] Iniciando sincronización hacia Supabase...');
    const startTime = Date.now();

    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    if (!supabaseUrl) throw new Error("Missing SUPABASE_DATABASE_URL");

    // Crear Pool independiente para Supabase y conectarlo vía Adapter
    // Esto previene los PrismaClientInitializationError causados por mezclar URLs nativas con un PrismaClient.
    // Usamos timeout nativo de pg para transacciones pesadas
    const pool = new Pool({
        connectionString: supabaseUrl,
        max: 3, // Límite estricto para no saturar Supabase Free Tier
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);

    const supabasePrisma = new PrismaClient({ adapter });

    try {
        // Función auxiliar para mini-pausas
        const chunkArray = <T>(array: T[], size: number): T[][] => {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        };
        const CHUNK_SIZE = 3; // Max concurrent connections

        // 0. Sincronizar Usuarios (Users)
        log('[SYNC] Sincronizando Usuarios...');
        const users = await localPrisma.user.findMany();
        const userChunks = chunkArray(users, CHUNK_SIZE);
        for (const chunk of userChunks) {
            await Promise.all(chunk.map(user =>
                supabasePrisma.user.upsert({ where: { id: user.id }, update: user, create: user })
            ));
        }

        // 1. Sincronizar Compañías (Companies)
        log('[SYNC] Sincronizando Compañías...');
        const companies = await localPrisma.company.findMany();
        const compChunks = chunkArray(companies, CHUNK_SIZE);
        for (const chunk of compChunks) {
            await Promise.all(chunk.map(comp =>
                supabasePrisma.company.upsert({ where: { id: comp.id }, update: comp, create: comp })
            ));
        }

        // 2. Sincronizar Trabajadores (Workers)
        log('[SYNC] Sincronizando Trabajadores...');
        const workers = await localPrisma.worker.findMany();
        const workerChunks = chunkArray(workers, CHUNK_SIZE);
        let iW = 0;
        for (const chunk of workerChunks) {
            await Promise.all(chunk.map(worker =>
                supabasePrisma.worker.upsert({ where: { id: worker.id }, update: worker, create: worker })
            ));
            iW += chunk.length;
            if (iW % 300 === 0) log(`[SYNC]   Sincronizado Trabajador ${iW}/${workers.length}`);
        }

        // 3. Sincronizar Dosímetros (Dosimeters)
        log('[SYNC] Sincronizando Dosímetros...');
        const dosimeters = await localPrisma.dosimeter.findMany();
        const dosimChunks = chunkArray(dosimeters, CHUNK_SIZE);
        for (const chunk of dosimChunks) {
            await Promise.all(chunk.map(dosimeter =>
                supabasePrisma.dosimeter.upsert({ where: { id: dosimeter.id }, update: dosimeter, create: dosimeter })
            ));
        }

        // 4. Sincronizar Periodos (Periods)
        log('[SYNC] Sincronizando Periodos...');
        const periods = await localPrisma.period.findMany();
        const periodChunks = chunkArray(periods, CHUNK_SIZE);
        for (const chunk of periodChunks) {
            await Promise.all(chunk.map(period =>
                supabasePrisma.period.upsert({ where: { id: period.id }, update: period, create: period })
            ));
        }

        // 5. Sincronizar Asignaciones (Assignments)
        log('[SYNC] Sincronizando Asignaciones...');
        const assignments = await localPrisma.assignment.findMany();
        const assignChunks = chunkArray(assignments, CHUNK_SIZE);
        let iA = 0;
        for (const chunk of assignChunks) {
            await Promise.all(chunk.map(assignment =>
                supabasePrisma.assignment.upsert({ where: { id: assignment.id }, update: assignment, create: assignment })
            ));
            iA += chunk.length;
            if (iA % 300 === 0) log(`[SYNC]   Sincronizada Asignación ${iA}/${assignments.length}`);
        }

        // 6. Sincronizar Lecturas (Readings)
        log('[SYNC] Sincronizando Lecturas...');
        const readings = await localPrisma.reading.findMany();
        const readingChunks = chunkArray(readings, CHUNK_SIZE);
        let iR = 0;
        for (const chunk of readingChunks) {
            await Promise.all(chunk.map(reading =>
                supabasePrisma.reading.upsert({ where: { id: reading.id }, update: reading, create: reading })
            ));
            iR += chunk.length;
            if (iR % 300 === 0) log(`[SYNC]   Sincronizada Lectura ${iR}/${readings.length}`);
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        log(`[SYNC] ✅ Sincronización exitosa. Tiempo: ${duration}s`);
        return { success: true, message: 'Sincronización completada', duration };

    } catch (error: any) {
        log(`[SYNC] ❌ Error durante la sincronización: ${error?.message || error}`);
        return { success: false, message: 'Error durante la sincronización', error };
    } finally {
        await localPrisma.$disconnect();
        await supabasePrisma.$disconnect();
        await pool.end();
    }
};

import { fileURLToPath } from 'url';

// Permitir ejecución directa desde la consola en entorno ESM
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
    syncToSupabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
