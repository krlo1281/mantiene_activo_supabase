import { prisma } from './src/lib/prisma.js';

async function checkAndFix() {
    try {
        // En Prisma: _CompanyToWorker
        // A -> id de Company (alfabéticamente primero)
        // B -> id de Worker (alfabéticamente segundo)

        const rows = await prisma.assignment.findMany({
            select: { companyId: true, workerId: true },
            distinct: ['companyId', 'workerId']
        });

        console.log(`[FORCE] Reinyectando ${rows.length} afiliaciones (Company->A, Worker->B)`);

        let inserted = 0;
        for (const { companyId, workerId } of rows) {
            try {
                // Hay que usar comillas dobles para forzar mayúsculas en Postgres
                await prisma.$executeRaw`
                    INSERT INTO "_CompanyToWorker" ("A", "B") 
                    VALUES (${companyId}, ${workerId}) 
                    ON CONFLICT DO NOTHING;
                `;
                inserted++;
            } catch (err: any) {
                console.error(`Error:`, err.message);
            }
        }
        console.log(`Total re-inyectado: ${inserted}`);

        // Verificamos a Nayiby
        const w = await prisma.worker.findUnique({
            where: { dni: 'CE 006832454' },
            include: { companies: true }
        });
        console.log("Nayiby empresas ahora:", w?.companies.length);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkAndFix();
