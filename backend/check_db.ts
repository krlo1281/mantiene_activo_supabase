
import { prisma } from './src/lib/prisma';

async function main() {
    const companies = await prisma.company.count();
    const users = await prisma.user.count();
    const workers = await prisma.worker.count();
    const periods = await prisma.period.count();
    const assignments = await prisma.assignment.count();

    console.log(`COUNTS: Companies=${companies}, Users=${users}, Workers=${workers}, Periods=${periods}, Assignments=${assignments}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
