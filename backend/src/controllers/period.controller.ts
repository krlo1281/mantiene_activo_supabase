
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getPeriods = async (req: Request, res: Response) => {
    try {
        const periods = await prisma.period.findMany({
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
        res.json(periods);
    } catch (error) {
        console.error('Error getting periods:', error);
        res.status(500).json({ message: 'Error retrieving periods' });
    }
};

export const createPeriod = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.body;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and Year are required' });
        }

        const existingPeriod = await prisma.period.findUnique({
            where: {
                month_year: {
                    month: Number(month),
                    year: Number(year)
                }
            }
        });

        if (existingPeriod) {
            return res.status(400).json({ message: 'Period for this month/year already exists' });
        }

        const period = await prisma.period.create({
            data: {
                month: Number(month),
                year: Number(year),
                status: 'OPEN'
            }
        });

        res.status(201).json(period);
    } catch (error) {
        console.error('Error creating period:', error);
        res.status(500).json({ message: 'Error creating period' });
    }
};

export const updatePeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, backgroundDosimeterCode, backgroundHp10, backgroundHp007 } = req.body;

        console.log(`Updating period ${id} with:`, { status, backgroundDosimeterCode, backgroundHp10, backgroundHp007 });

        const safeNumber = (val: any) => {
            if (val === null || val === undefined) return undefined;
            if (typeof val === 'string') return Number(val.replace(',', '.'));
            return Number(val);
        };

        const bgHp10 = safeNumber(backgroundHp10);
        const bgHp007 = safeNumber(backgroundHp007);

        if (backgroundHp10 !== undefined && isNaN(bgHp10!)) {
            return res.status(400).json({ message: 'backgroundHp10 must be a valid number' });
        }
        if (backgroundHp007 !== undefined && isNaN(bgHp007!)) {
            return res.status(400).json({ message: 'backgroundHp007 must be a valid number' });
        }

        const dataToUpdate: any = {};
        if (status) dataToUpdate.status = status;
        if (backgroundDosimeterCode !== undefined) dataToUpdate.backgroundDosimeterCode = backgroundDosimeterCode;
        if (bgHp10 !== undefined) dataToUpdate.backgroundHp10 = bgHp10;
        if (bgHp007 !== undefined) dataToUpdate.backgroundHp007 = bgHp007;

        const period = await prisma.period.update({
            where: { id: String(id) },
            data: dataToUpdate
        });

        // Retroactive Recalculation
        if (backgroundHp10 !== undefined || backgroundHp007 !== undefined) {
            console.log(`Recalculating readings for period ${id}...`);

            // Get all readings for this period
            const readings = await prisma.reading.findMany({
                where: {
                    assignment: { periodId: String(id) }
                }
            });

            const newBgHp10 = Number(period.backgroundHp10 || 0);
            const newBgHp007 = Number(period.backgroundHp007 || 0);

            let updatedCount = 0;

            await prisma.$transaction(async (tx) => {
                for (const reading of readings) {
                    // Use raw values if exist, otherwise assume current hp10 is raw (fallback for old data)
                    // Ideally we should have migrated old data to have raw values = hp10. 
                    // For now, if raw is null, we assume the current hp10 was raw (before any bg subtraction).
                    const rawHp10 = reading.rawHp10 !== null ? reading.rawHp10 : reading.hp10;
                    const rawHp007 = reading.rawHp007 !== null ? reading.rawHp007 : reading.hp007;

                    // Update raw if it was null (migration on the fly)
                    const dataToSet: any = {
                        hp10: rawHp10 - newBgHp10,
                        hp007: rawHp007 - newBgHp007
                    };

                    if (reading.rawHp10 === null) dataToSet.rawHp10 = rawHp10;
                    if (reading.rawHp007 === null) dataToSet.rawHp007 = rawHp007;

                    await tx.reading.update({
                        where: { id: reading.id },
                        data: dataToSet
                    });
                    updatedCount++;
                }
            });
            console.log(`Recalculated ${updatedCount} readings for period ${id}`);
        }

        res.json(period);
    } catch (error: any) {
        console.error('Error updating period:', error);
        res.status(500).json({ message: 'Error updating period', error: error.message || String(error) });
    }
};

export const deletePeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.period.delete({ where: { id: String(id) } });
        res.json({ message: 'Period deleted successfully' });
    } catch (error) {
        console.error('Error deleting period:', error);
        res.status(500).json({ message: 'Error deleting period' });
    }
};
