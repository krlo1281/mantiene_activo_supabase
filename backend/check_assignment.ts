import { prisma } from './src/lib/prisma.js';

async function check() {
    try {
        const assignment = await prisma.assignment.findFirst({
            include: { company: true, worker: true }
        });

        console.log("=== EJEMPLO DE ASIGNACIÓN ===");
        console.log(JSON.stringify(assignment, null, 2));

        const workersWithAssignments = await prisma.worker.count({
            where: { assignments: { some: {} } }
        });
        console.log(`\nTrabajadores con al menos 1 asignación: ${workersWithAssignments}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
