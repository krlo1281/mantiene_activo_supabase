
import { prisma } from './src/lib/prisma'

async function main() {
    console.log('--- PERIODS ---')
    const periods = await prisma.period.findMany({
        orderBy: [{ year: 'desc' }, { month: 'desc' }]
    })
    console.log(periods)

    console.log('\n--- ASSIGNMENTS ---')
    const assignments = await prisma.assignment.findMany({
        include: {
            period: true,
            worker: true,
            dosimeter: true
        }
    })

    if (assignments.length === 0) {
        console.log("NO ASSIGNMENTS FOUND.")
    } else {
        assignments.forEach(a => {
            console.log(`ID: ${a.id} | Period: ${a.period.month}/${a.period.year} (ID: ${a.periodId}) | Worker: ${a.worker.firstName} | Dosimeter: ${a.dosimeter.code}`)
        })
    }

    console.log('\n--- READINGS ---')
    const readings = await prisma.reading.findMany({
        include: { assignment: true }
    })
    console.log(readings.length + " readings found.")
    readings.forEach(r => {
        console.log(`Reading for Assignment ${r.assignmentId}: Hp10=${r.hp10}`)
    })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
