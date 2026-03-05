
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg
const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    try {
        console.log("Starting debug...");

        // 1. Get a Period
        const period = await prisma.period.findFirst({
            orderBy: { createdAt: 'desc' } // Get latest
        });

        if (!period) {
            console.log("No period found.");
            return;
        }
        console.log(`Using Period: ${period.month}/${period.year} (ID: ${period.id})`);

        // 2. Get Assignments for this period
        const assignments = await prisma.assignment.findMany({
            where: { periodId: period.id },
            include: { reading: true }
        });
        console.log(`Assignments in period: ${assignments.length}`);

        const workerIds = assignments.map(a => a.workerId);
        if (workerIds.length === 0) {
            console.log("No workers in period.");
            return;
        }

        // 3. Logic mirror
        let startMonth = period.month - 11;
        let startYear = period.year;
        if (startMonth <= 0) {
            startMonth += 12;
            startYear -= 1;
        }
        console.log(`Window Start: ${startMonth}/${startYear}`);

        // Query
        const historyAssignments = await prisma.assignment.findMany({
            where: {
                workerId: { in: workerIds },
                period: {
                    year: {
                        gte: startYear,
                        lte: period.year
                    }
                },
                reading: { isNot: null }
            },
            include: {
                reading: true,
                period: true
            }
        });

        console.log(`History Assignments Found: ${historyAssignments.length}`);

        const endVal = period.year * 100 + period.month;
        const startVal = startYear * 100 + startMonth;

        console.log(`Window Val: ${startVal} to ${endVal}`);

        const workerAccumulated: Record<string, { hp10: number, hp007: number, months: Set<number> }> = {};

        historyAssignments.forEach(h => {
            const pVal = h.period.year * 100 + h.period.month;
            if (pVal >= startVal && pVal <= endVal && h.reading) {
                if (!workerAccumulated[h.workerId]) {
                    workerAccumulated[h.workerId] = { hp10: 0, hp007: 0, months: new Set() };
                }
                const acc = workerAccumulated[h.workerId];
                if (acc) {
                    acc.hp10 += h.reading.hp10;
                    acc.hp007 += h.reading.hp007;
                    acc.months.add(pVal);
                }
            }
        });

        console.log("\n--- Results Sample ---");
        let count = 0;
        for (const [wid, acc] of Object.entries(workerAccumulated)) {
            if (count++ > 5) break;
            console.log(`Worker ${wid}: Months=${acc.months.size}, Hp10=${acc.hp10}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
