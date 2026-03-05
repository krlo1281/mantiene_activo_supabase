
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'
import XLSX from 'xlsx'; // Default import usually better for xlsx
import path from 'path';
import fs from 'fs';

const { Pool } = pg
const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const FILE_PATH = path.resolve(process.cwd(), '../migration_preview_final.xlsx');

const MONTH_MAP: { [key: string]: number } = {
    'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4, 'MAYO': 5, 'JUNIO': 6,
    'JULIO': 7, 'AGOSTO': 8, 'SETIEMBRE': 9, 'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
};

async function cleanDatabase() {
    console.log('Cleaning database...');
    await prisma.reading.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.dosimeter.deleteMany({});
    await prisma.worker.deleteMany({});
    await prisma.company.deleteMany({}); // Delete all companies. 
    // Note: If Admin user was somehow linked to a company, it might be an issue. 
    // But checking seed.ts, Admin User is not linked to Company.
    // Worker is linked to Company.
    await prisma.period.deleteMany({});
    console.log('Database cleaned.');
}

async function importData() {
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        process.exit(1);
    }

    // Handle XLSX import weirdness if default doesn't work.
    // Sometimes it is XLSX.default
    const wb = XLSX.readFile ? XLSX.readFile(FILE_PATH) : (XLSX as any).default.readFile(FILE_PATH);

    // --- 1. COMPANIES ---
    console.log('Importing Companies...');
    const companiesSheet = wb.Sheets['Companies_To_Create'];
    if (!companiesSheet) {
        console.error('Sheet Companies_To_Create not found');
        return;
    }
    const companiesData = XLSX.utils.sheet_to_json(companiesSheet);

    const companyMap = new Map<string, string>(); // Name -> ID

    for (const row of companiesData as any[]) {
        const name = row['EMPRESA']?.toString().trim();
        if (!name) continue;

        let comp = await prisma.company.findFirst({ where: { name: name } });
        if (!comp) {
            comp = await prisma.company.create({ data: { name: name } });
        }
        companyMap.set(name, comp.id);
    }
    console.log(`Impoted ${companyMap.size} companies.`);

    // --- 2. WORKERS ---
    console.log('Importing Workers...');
    const workersSheet = wb.Sheets['Workers_To_Create'];
    if (!workersSheet) {
        console.error('Sheet Workers_To_Create not found');
        return;
    }
    const workersData = XLSX.utils.sheet_to_json(workersSheet);

    const workerMap = new Map<string, string>(); // DNI -> ID

    for (const row of workersData as any[]) {
        const dni = row['DNI']?.toString().trim();
        const firstName = row['NOMBRES']?.toString().trim() || 'Unknown';
        const lastName = row['APELLIDOS']?.toString().trim() || 'Unknown';
        const companyName = row['EMPRESA']?.toString().trim();

        if (!dni || !companyName) continue;

        const companyId = companyMap.get(companyName);
        if (!companyId) continue;

        // Upsert Worker
        try {
            const worker = await prisma.worker.upsert({
                where: { dni: dni },
                update: {
                    firstName,
                    lastName,
                    companies: { connect: { id: companyId } }
                },
                create: {
                    dni,
                    firstName,
                    lastName,
                    companies: { connect: { id: companyId } }
                }
            });
            workerMap.set(dni, worker.id);
        } catch (e) {
            console.error(`Error worker ${dni}:`, e);
        }
    }
    console.log(`Imported workers.`);

    // --- 3. ASSIGNMENTS & READINGS ---
    console.log('Importing Assignments & Readings...');
    const assignSheet = wb.Sheets['Assignments_Readings'];
    if (!assignSheet) {
        console.error('Sheet Assignments_Readings not found');
        return;
    }
    const assignData = XLSX.utils.sheet_to_json(assignSheet);

    let assignmentCount = 0;
    let readingCount = 0;

    for (const row of assignData as any[]) {
        const dni = row['DNI']?.toString().trim();
        const periodMonthName = row['MES']?.toString().trim().toUpperCase();
        const periodYear = parseInt(row['AÑO']);
        const dosimeterCode = row['DOSIMETRO']?.toString().trim();
        const companyName = row['EMPRESA']?.toString().trim();

        if (!dni || !periodMonthName || !periodYear || !dosimeterCode || !companyName) continue;

        const workerId = workerMap.get(dni);
        if (!workerId) continue;

        const companyId = companyMap.get(companyName);
        if (!companyId) {
            console.warn(`Company ${companyName} not found for assignment. Skipping.`);
            continue;
        }

        const monthNum = MONTH_MAP[periodMonthName];
        if (!monthNum) continue;

        // Ensure Worker is connected to this Company (Safety net)
        await prisma.worker.update({
            where: { id: workerId },
            data: { companies: { connect: { id: companyId } } }
        }).catch(() => { }); // Ignore if already connected

        // Period
        let period = await prisma.period.findFirst({
            where: { month: monthNum, year: periodYear }
        });
        if (!period) {
            period = await prisma.period.create({
                data: { month: monthNum, year: periodYear, status: 'OPEN' }
            });
        }

        // Dosimeter (OSL)
        let dosimeter = await prisma.dosimeter.findUnique({ where: { code: dosimeterCode } });
        if (!dosimeter) {
            dosimeter = await prisma.dosimeter.create({
                data: { code: dosimeterCode, type: 'OSL', status: 'AVAILABLE' }
            });
        }
        // Do not force reset to AVAILABLE here. Let the assignment logic dictate.


        // Assignment
        try {
            // Find existing based on period and dosimeter (Unique constraint)
            const assignment = await prisma.assignment.upsert({
                where: { periodId_dosimeterId: { periodId: period.id, dosimeterId: dosimeter.id } },
                update: { workerId: workerId, companyId: companyId }, // Ensure worker and company are correct
                create: { periodId: period.id, workerId: workerId, dosimeterId: dosimeter.id, companyId: companyId }
            });

            // Mark Dosimeter as ASSIGNED
            await prisma.dosimeter.update({
                where: { id: dosimeter.id },
                data: { status: 'ASSIGNED' }
            });

            assignmentCount++;

            // Reading
            const hp10Raw = row['Hp10'];
            const hp007Raw = row['Hp0.07'];

            const parseVal = (val: any) => {
                if (val === undefined || val === null || val === '') return null;
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            };

            const hp10 = parseVal(hp10Raw);
            const hp007 = parseVal(hp007Raw);

            if (hp10 !== null && hp007 !== null) {
                await prisma.reading.upsert({
                    where: { assignmentId: assignment.id },
                    update: { hp10, hp007, readDate: new Date(), source: 'MIGRATION' },
                    create: { assignmentId: assignment.id, hp10, hp007, readDate: new Date(), source: 'MIGRATION' }
                });
                readingCount++;
            }

        } catch (e) {
            console.error(`Error assignment ${dni}:`, e);
        }
    }

    console.log(`Imported ${assignmentCount} assignments.`);
    console.log(`Imported ${readingCount} readings.`);
}

cleanDatabase()
    .then(() => importData())
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
