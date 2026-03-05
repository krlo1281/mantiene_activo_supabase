import { prisma } from './src/lib/prisma.js';

async function countAll() {
    try {
        const users = await prisma.user.count();
        const companies = await prisma.company.count();
        const workers = await prisma.worker.count();
        const dosimeters = await prisma.dosimeter.count();
        const periods = await prisma.period.count();
        const assignments = await prisma.assignment.count();
        const readings = await prisma.reading.count();

        console.table({
            "Usuarios": users,
            "Compañías": companies,
            "Trabajadores": workers,
            "Dosímetros": dosimeters,
            "Periodos": periods,
            "Asignaciones": assignments,
            "Lecturas": readings
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

countAll();
