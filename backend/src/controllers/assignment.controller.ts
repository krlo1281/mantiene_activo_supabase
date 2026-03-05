
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// Get all assignments (optional filtering by periodId or workerId via query params)
export const getAssignments = async (req: Request, res: Response) => {
    try {
        const { periodId, workerId, companyId, search } = req.query;

        const whereClause: any = {};
        if (periodId) whereClause.periodId = String(periodId);
        if (workerId) whereClause.workerId = String(workerId);

        // Filter by Company (Direct Field)
        if (companyId && companyId !== 'ALL') {
            whereClause.companyId = String(companyId);
        }

        // Search (Worker Name, DNI, Dosimeter Code)
        if (search) {
            const searchStr = String(search);
            whereClause.OR = [
                { worker: { firstName: { contains: searchStr, mode: 'insensitive' } } },
                { worker: { lastName: { contains: searchStr, mode: 'insensitive' } } },
                { worker: { dni: { contains: searchStr, mode: 'insensitive' } } },
                { dosimeter: { code: { contains: searchStr, mode: 'insensitive' } } }
            ];
        }

        const assignments = await prisma.assignment.findMany({
            where: whereClause,
            include: {
                period: true,
                worker: true,
                dosimeter: true,
                company: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(assignments);
    } catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({ message: 'Error retrieving assignments' });
    }
};

const getMonthNumber = (monthName: string): number | null => {
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const index = months.indexOf(monthName.toLowerCase().trim());
    return index !== -1 ? index + 1 : null;
};

export const createAssignment = async (req: Request, res: Response) => {
    try {
        let { periodId, workerId, dosimeterId, companyId, monthName, year } = req.body;

        if (!workerId || !dosimeterId) {
            return res.status(400).json({ message: 'Worker and Dosimeter are required' });
        }

        // Validate CompanyId
        if (!companyId) {
            // Try to infer from worker? 
            // Logic: A worker has companies. We need to assign for a specific company interaction.
            // If not provided, we can't create assignment reliably in M-N scenario.
            return res.status(400).json({ message: 'Company ID is required' });
        }

        // If no periodId, try to find or create based on Month/Year
        if (!periodId) {
            if (!monthName || !year) {
                return res.status(400).json({ message: 'Period ID or Month Name and Year are required' });
            }

            const monthData = getMonthNumber(monthName);
            if (!monthData) {
                return res.status(400).json({ message: 'Invalid month name' });
            }

            const yearData = Number(year);

            // Find or Create Period
            let period = await prisma.period.findUnique({
                where: {
                    month_year: {
                        month: monthData,
                        year: yearData
                    }
                }
            });

            if (!period) {
                period = await prisma.period.create({
                    data: {
                        month: monthData,
                        year: yearData,
                        status: 'OPEN'
                    }
                });
            }
            periodId = period.id;
        }

        // Check if dosimeter is already assigned in this period
        const existingAssignment = await prisma.assignment.findUnique({
            where: {
                periodId_dosimeterId: {
                    periodId,
                    dosimeterId
                }
            }
        });

        if (existingAssignment) {
            return res.status(400).json({ message: 'This dosimeter is already assigned in this period' });
        }

        const assignment = await prisma.assignment.create({
            data: { periodId, workerId, dosimeterId, companyId },
            include: {
                period: true,
                worker: true,
                dosimeter: true,
                company: true
            }
        });

        // Update dosimeter status to ASSIGNED?
        await prisma.dosimeter.update({
            where: { id: dosimeterId },
            data: { status: 'ASSIGNED' }
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ message: 'Error creating assignment' });
    }
};

export const deleteAssignment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Get assignment to find dosimeterId
        const assignment = await prisma.assignment.findUnique({ where: { id: String(id) } });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        await prisma.assignment.delete({ where: { id: String(id) } });

        // set dosimeter status back to AVAILABLE
        await prisma.dosimeter.update({
            where: { id: assignment.dosimeterId },
            data: { status: 'AVAILABLE' }
        });

        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({ message: 'Error deleting assignment' });
    }
};
