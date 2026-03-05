
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const [
            totalWorkers,
            assignedDosimeters,
            availableDosimeters,
            retiredDosimeters,
            totalDosimeters
        ] = await Promise.all([
            prisma.worker.count(),
            prisma.dosimeter.count({ where: { status: 'ASSIGNED' } }),
            prisma.dosimeter.count({ where: { status: 'AVAILABLE' } }),
            prisma.dosimeter.count({ where: { status: 'RETIRED' } }),
            prisma.dosimeter.count()
        ]);

        // Mock growth data for now
        const workerGrowth = 12;

        res.json({
            workers: {
                total: totalWorkers,
                growth: workerGrowth
            },
            dosimeters: {
                total: totalDosimeters,
                assigned: assignedDosimeters,
                available: availableDosimeters,
                retired: retiredDosimeters
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};
