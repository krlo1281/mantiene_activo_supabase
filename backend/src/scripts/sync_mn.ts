import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;
import { prisma as localPrisma } from '../lib/prisma.js';

async function syncMn() {
    console.log('[SYNC M:N] Empezando rescate en Nube...');

    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    if (!supabaseUrl) throw new Error("Missing SUPABASE_DATABASE_URL");

    const pool = new Pool({
        connectionString: supabaseUrl,
        max: 3,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const supabasePrisma = new PrismaClient({ adapter });

    try {
        const relations = await localPrisma.$queryRaw<Array<{ A: string, B: string }>>`
            SELECT "A", "B" FROM "_CompanyToWorker";
        `;

        console.log(`[SYNC M:N] Vinculando ${relations.length} trabajadores a Supabase...`);

        let c = 0;
        for (const row of relations) {
            try {
                await supabasePrisma.$executeRaw`
                    INSERT INTO "_CompanyToWorker" ("A", "B")
                    VALUES (${row.A}, ${row.B})
                    ON CONFLICT DO NOTHING;
                `;
                c++;
            } catch (err: any) {
                // Ignore silent errors
            }
            if (c % 100 === 0) console.log(`[SYNC]   Upserting Relación ${c}/${relations.length}`);
        }
        console.log(`[SYNC M:N] ✅ Perfecto! ${c} filas insertadas en la nube de Supabase.`);
    } catch (e) {
        console.error(e);
    } finally {
        await localPrisma.$disconnect();
        await supabasePrisma.$disconnect();
        await pool.end();
    }
}

syncMn();
