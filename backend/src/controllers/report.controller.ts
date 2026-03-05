
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getMonthlyReport = async (req: Request, res: Response) => {
    // Handling monthly report generation with accumulated dose logic
    try {
        const { periodId, companyId, companyIds } = req.query;

        if (!periodId) {
            return res.status(400).json({ message: 'Period ID is required' });
        }

        const currentPeriod = await prisma.period.findUnique({
            where: { id: String(periodId) }
        });

        if (!currentPeriod) {
            return res.status(404).json({ message: 'Period not found' });
        }

        const whereClause: any = {
            periodId: String(periodId)
        };

        if (companyIds) {
            const ids = String(companyIds).split(',').filter(id => id.length > 0);
            if (ids.length > 0) {
                whereClause.companyId = { in: ids };
            }
        } else if (companyId && companyId !== 'ALL') {
            whereClause.companyId = String(companyId);
        }

        const assignments = await prisma.assignment.findMany({
            where: whereClause,
            include: {
                worker: true,
                dosimeter: true,
                reading: true,
                company: true
            },
            orderBy: {
                worker: {
                    lastName: 'asc'
                }
            }
        });

        // --- Calculate Accumulated Dose (Rolling 12 months) ---
        const workerIds = assignments.map(a => a.workerId);

        // Determine start of 12-month window
        let startMonth = currentPeriod.month - 11;
        let startYear = currentPeriod.year;
        if (startMonth <= 0) {
            startMonth += 12;
            startYear -= 1;
        }

        // Fetch history for these workers in the window
        // Logic: (year > startYear OR (year = startYear AND month >= startMonth)) 
        // AND (year < endYear OR (year = endYear AND month <= endMonth))
        const historyAssignments = await prisma.assignment.findMany({
            where: {
                workerId: { in: workerIds },
                period: {
                    year: {
                        gte: startYear,
                        lte: currentPeriod.year
                    }
                },
                reading: { isNot: null } // Only count if there is a reading
            },
            include: {
                reading: true,
                period: true
            },
            orderBy: {
                period: {
                    year: 'desc'
                }
            }
        });

        // Filter in memory for precise window (Prisma OR logic can be verbose for dates stored as int/int)
        const endVal = currentPeriod.year * 100 + currentPeriod.month;
        const startVal = startYear * 100 + startMonth;

        const workerAccumulated: Record<string, { hp10: number, hp007: number, months: Set<number> }> = {};

        historyAssignments.forEach(h => {
            const pVal = h.period.year * 100 + h.period.month;
            if (pVal >= startVal && pVal <= endVal && h.reading) {
                if (!workerAccumulated[h.workerId]) {
                    workerAccumulated[h.workerId] = { hp10: 0, hp007: 0, months: new Set() };
                }
                const acc = workerAccumulated[h.workerId];
                if (acc) {
                    // Update: Negative readings are treated as 0 for accumulation
                    const hp10 = h.reading.hp10 < 0 ? 0 : h.reading.hp10;
                    const hp007 = h.reading.hp007 < 0 ? 0 : h.reading.hp007;

                    acc.hp10 += hp10;
                    acc.hp007 += hp007;
                    acc.months.add(pVal);
                }
            }
        });

        const reportData = (assignments as any[]).map(a => ({
            id: a.id,
            workerName: `${a.worker.lastName}, ${a.worker.firstName}`,
            dni: a.worker.dni,
            company: a.company?.name || 'Sin Empresa',
            dosimeterCode: a.dosimeter.code,
            hp10: a.reading ? a.reading.hp10 : 0.0,
            hp007: a.reading ? a.reading.hp007 : 0.0,
            accumulatedHp10: workerAccumulated[a.workerId]?.hp10 || 0.0,
            accumulatedHp007: workerAccumulated[a.workerId]?.hp007 || 0.0,
            accumulatedMonths: workerAccumulated[a.workerId]?.months.size || 0,
            status: a.reading ? 'READ' : 'PENDING'
        }));

        res.json(reportData);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
};

export const getAssignmentHistory = async (req: Request, res: Response) => {
    try {
        const { companyId, dosimeterId } = req.query;

        const whereClause: any = {};

        if (companyId && companyId !== 'ALL') {
            whereClause.companyId = String(companyId);
        }

        if (dosimeterId && dosimeterId !== 'ALL') {
            whereClause.dosimeterId = String(dosimeterId);
        }

        const assignments = await prisma.assignment.findMany({
            where: whereClause,
            include: {
                period: true,
                worker: true,
                dosimeter: true,
                reading: true,
                company: true
            },
            orderBy: [
                { period: { year: 'desc' } },
                { period: { month: 'desc' } },
                { worker: { lastName: 'asc' } }
            ]
        });

        const historyData = (assignments as any[]).map(a => ({
            id: a.id,
            period: `${a.period.month}/${a.period.year}`,
            workerName: `${a.worker.lastName}, ${a.worker.firstName}`,
            dni: a.worker.dni,
            company: a.company?.name || 'Sin Empresa',
            dosimeterCode: a.dosimeter.code,
            status: a.reading ? 'READ' : (a.dosimeter.status === 'AVAILABLE' ? 'RETURNED' : 'ASSIGNED'),
            readingValue: a.reading ? `${a.reading.hp10} / ${a.reading.hp007}` : '-'
        }));

        res.json(historyData);
    } catch (error) {
        console.error('Error getting assignment history:', error);
        res.status(500).json({ message: 'Error retrieving assignment history' });
    }
};
