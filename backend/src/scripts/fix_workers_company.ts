import { prisma } from '../lib/prisma.js';

async function execute() {
    console.log('[REPAIR] Iniciando reparación de Empresas en Trabajadores...');

    try {
        const workers = await prisma.worker.findMany({
            include: { assignments: true, companies: true }
        });

        let i = 0;
        let c = 0;
        for (const w of workers) {
            // Si el trabajador tiene el array de empresas vacío localmente
            if (!w.companies || w.companies.length === 0) {
                // Buscamos todas sus asignaciones para saber en qué empresa trabajó
                const uniqueCompanyIds = [...new Set(w.assignments.map(a => a.companyId))];

                if (uniqueCompanyIds.length > 0) {
                    await prisma.worker.update({
                        where: { id: w.id },
                        data: {
                            companies: {
                                connect: uniqueCompanyIds.map(id => ({ id }))
                            }
                        }
                    });
                    c++;
                }
            }
            i++;
            if (i % 50 === 0) console.log(`[REPAIR] Revisando trabajador ${i}/${workers.length}`);
        }

        console.log(`[REPAIR] ✅ Finalizado. Se vincularon exitosamente ${c} trabajadores a sus respectivas compañías.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
execute();
