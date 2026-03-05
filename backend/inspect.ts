import { prisma } from './src/lib/prisma.js';

async function verify() {
    try {
        const worker = await prisma.worker.findUnique({
            where: { dni: 'CE 006832454' },
            include: { companies: true, assignments: true }
        });
        console.log(JSON.stringify(worker, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
