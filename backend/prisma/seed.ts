
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
    console.log('Start seeding (Static Data)...')

    // 1. Create User (Admin)
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            email: 'admin@dosimetry.com',
            username: 'admin',
            password: 'admin',
            role: 'ADMIN',
        },
    })
    console.log(`Created user: ${admin.username}`)

    // 2. Create Company
    const company = await prisma.company.upsert({
        where: { ruc: '20123456789' },
        update: {},
        create: {
            ruc: '20123456789',
            name: 'Hospital Central',
            address: 'Av. Principal 123',
            email: 'contacto@hospital.com',
        },
    })
    console.log(`Created company: ${company.name}`)

    // 3. Create Workers
    const worker1 = await prisma.worker.create({
        data: {
            dni: '12345678',
            firstName: 'Juan',
            lastName: 'Perez',
            companyId: company.id,
        },
    })

    const worker2 = await prisma.worker.create({
        data: {
            dni: '87654321',
            firstName: 'Maria',
            lastName: 'Gomez',
            companyId: company.id,
        },
    })
    console.log(`Created workers: ${worker1.firstName}, ${worker2.firstName}`)

    // 4. Create Dosimeters
    const dos1 = await prisma.dosimeter.create({
        data: {
            code: 'DOS-001',
            type: 'TLD',
            status: 'AVAILABLE',
        },
    })
    const dos2 = await prisma.dosimeter.create({
        data: {
            code: 'DOS-002',
            type: 'TLD',
            status: 'AVAILABLE',
        },
    })
    console.log('Created dosimeters')

    // 5. Create Period (Original Static Date: Oct 2023)
    const period = await prisma.period.create({
        data: {
            month: 10,
            year: 2023,
            status: 'OPEN',
        },
    })
    console.log('Created period Oct-2023')

    // 6. Assignments
    // Assign DOS-001 to Juan
    const assignment1 = await prisma.assignment.create({
        data: {
            periodId: period.id,
            workerId: worker1.id,
            dosimeterId: dos1.id,
        },
    })

    // 7. Readings
    await prisma.reading.create({
        data: {
            assignmentId: assignment1.id,
            hp10: 0.5,
            hp007: 0.6,
            readDate: new Date(),
            source: 'MANUAL',
        },
    })

    // --- EXTRA DATA FOR DEMO ---
    const companiesData = [
        { ruc: '20555555551', name: 'Clinica San Felipe', address: 'Av. Gregorio Escobedo 650', email: 'rrhh@sanfelipe.com' },
        { ruc: '20100000002', name: 'Minera Yanacocha', address: 'Cajamarca Km 24', email: 'seguridad@yanacocha.com' },
        { ruc: '20600000003', name: 'Radiología Digital SAC', address: 'Calle Los Pinos 100', email: 'gerencia@radiodigital.pe' }
    ];

    for (const c of companiesData) {
        const comp = await prisma.company.upsert({
            where: { ruc: c.ruc },
            update: {},
            create: c
        });

        // Add 5 users per company
        for (let i = 1; i <= 5; i++) {
            const dni = `DNI-${comp.ruc.slice(0, 4)}-${i}`;
            await prisma.worker.upsert({
                where: { dni },
                update: {},
                create: {
                    dni,
                    firstName: `Trabajador ${i}`,
                    lastName: `De ${comp.name.split(' ')[0]}`,
                    companyId: comp.id
                }
            });
        }
    }

    console.log('Seeding finished (Expanded Data).')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
