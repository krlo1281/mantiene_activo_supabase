
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getWorkers = async (req: Request, res: Response) => {
    try {
        const { companyId, search } = req.query;

        const whereClause: any = {};

        if (companyId && companyId !== 'ALL') {
            whereClause.companies = {
                some: {
                    id: String(companyId)
                }
            };
        }

        if (search) {
            const searchStr = String(search);
            whereClause.OR = [
                { firstName: { contains: searchStr, mode: 'insensitive' } },
                { lastName: { contains: searchStr, mode: 'insensitive' } },
                { dni: { contains: searchStr, mode: 'insensitive' } }
            ];
        }

        const workers = await prisma.worker.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                companies: {
                    select: { id: true, name: true, ruc: true }
                }
            }
        });
        res.json(workers);
    } catch (error) {
        console.error('Error getting workers:', error);
        res.status(500).json({ message: 'Error retrieving workers' });
    }
};

export const createWorker = async (req: Request, res: Response) => {
    try {
        const { dni, firstName, lastName, companyId } = req.body;

        // Basic validation
        if (!dni || !firstName || !lastName || !companyId) {
            return res.status(400).json({ message: 'All fields (DNI, First Name, Last Name, Company) are required' });
        }

        const existingWorker = await prisma.worker.findUnique({ where: { dni } });

        // Verify company exists
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(400).json({ message: 'Invalid Company ID' });
        }

        let worker;

        if (existingWorker) {
            // Check if already connected
            /*
             We could check if he is already in this company
             const isConnected = // ...
             But prisma.update with connect ignores if already connected?
             No, it might error or just work.
             Safest is to try update.
            */
            worker = await prisma.worker.update({
                where: { id: existingWorker.id },
                data: {
                    companies: {
                        connect: { id: companyId }
                    }
                },
                include: { companies: true }
            });
        } else {
            worker = await prisma.worker.create({
                data: {
                    dni,
                    firstName,
                    lastName,
                    companies: {
                        connect: { id: companyId }
                    }
                },
                include: { companies: true }
            });
        }

        res.status(201).json(worker);
    } catch (error) {
        console.error('Error creating worker:', error);
        res.status(500).json({ message: 'Error creating worker' });
    }
};

export const updateWorker = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { dni, firstName, lastName, companyId } = req.body;

        const data: any = { dni, firstName, lastName };
        // If companyId is provided, we might want to Add it? Or replace? 
        // For simple update from UI which usually sends "current state", 
        // we might not change companies here unless we have a specific "Link Company" feature.
        // But for now, let's assume we want to ensure he is linked to this companyId if provided.

        if (companyId) {
            data.companies = {
                connect: { id: companyId }
            };
        }

        const worker = await prisma.worker.update({
            where: { id },
            data: data,
            include: { companies: true }
        });

        res.json(worker);
    } catch (error) {
        console.error('Error updating worker:', error);
        res.status(500).json({ message: 'Error updating worker' });
    }
};

export const deleteWorker = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Check for assignments?
        // Prisma might handle cascade or restrict.
        await prisma.worker.delete({ where: { id } });
        res.json({ message: 'Worker deleted successfully' });
    } catch (error) {
        console.error('Error deleting worker:', error);
    }
};

const getMonthName = (month: number) => {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || 'Desconocido';
};

export const getWorkerDoseHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Get Worker Info
        const worker = await prisma.worker.findUnique({
            where: { id },
            include: { companies: true }
        });

        if (!worker) {
            return res.status(404).json({ message: 'Worker not found' });
        }

        // 2. Get Assignments with Readings (Historical)
        const assignments = await prisma.assignment.findMany({
            where: { workerId: id },
            include: {
                period: true,
                dosimeter: true,
                reading: true, // Assuming one-to-one reading
                company: true
            },
            orderBy: [
                { period: { year: 'desc' } },
                { period: { month: 'desc' } }
            ]
        });

        // 3. Calculate Statistics
        const now = new Date();
        const currentYear = now.getFullYear();

        // Last Assignment (for reference date)
        const lastAssignment = assignments.find(a => a.reading !== null) || assignments[0];

        let accumulatedDose12m = 0;
        let totalHp10 = 0;

        // Calculate Total Lifetime Dose
        assignments.forEach(a => {
            if (a.reading) {
                totalHp10 += a.reading.hp10;
            }
        });

        if (lastAssignment) {
            // Create a Date object for the last assignment's period
            // Assuming month is 1-12. Construct date as YYYY-MM-01
            const lastAssignmentDate = new Date(lastAssignment.period.year, lastAssignment.period.month - 1, 1);

            // Calculate start date (12 months prior)
            const startDate = new Date(lastAssignmentDate);
            startDate.setFullYear(startDate.getFullYear() - 1);

            // Sum doses within the window [startDate, lastAssignmentDate]
            assignments.forEach(a => {
                if (a.reading) {
                    const assignmentDate = new Date(a.period.year, a.period.month - 1, 1);
                    if (assignmentDate > startDate && assignmentDate <= lastAssignmentDate) {
                        accumulatedDose12m += a.reading.hp10;
                    }
                }
            });
        }

        // Total Readings Count
        const totalReadings = assignments.filter(a => a.reading !== null).length;
        const lastMonthDose = lastAssignment?.reading?.hp10 || 0;

        // 4. Prepare Chart Data (Last 12 periods chronological)
        const chartHistory = assignments
            .slice(0, 12)
            .map(a => ({
                period: `${getMonthName(a.period.month)} ${a.period.year}`,
                hp10: a.reading ? a.reading.hp10 : 0,
                hp007: a.reading ? a.reading.hp007 : 0,
                status: a.reading ? 'Leído' : 'Pendiente'
            }))
            .reverse(); // Chronological for chart

        res.json({
            worker,
            stats: {
                ytdHp10: accumulatedDose12m, // Reuse this field but mapped to 12m rolling
                ytdHp007: 0, // Not requested but kept for structure
                totalHp10,
                lastMonthDose,
                totalReadings,
                lastReadingDate: lastAssignment?.period ? `${getMonthName(lastAssignment.period.month)} ${lastAssignment.period.year}` : 'N/A'
            },
            history: chartHistory,
            assignments: assignments.map(a => ({
                id: a.id,
                period: `${getMonthName(a.period.month)} ${a.period.year}`,
                dosimeter: a.dosimeter.code,
                company: a.company.name,
                hp10: a.reading?.hp10,
                hp007: a.reading?.hp007,
                status: a.reading ? 'READ' : a.dosimeter.status
            }))
        });

    } catch (error) {
        console.error('Error getting worker dose history:', error);
        res.status(500).json({ message: 'Error retrieving worker history' });
    }
};
