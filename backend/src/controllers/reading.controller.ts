
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// Get readings (optionally filtered by periodId via the related Assignment)
export const getReadings = async (req: Request, res: Response) => {
    try {
        const { periodId } = req.query;

        const whereClause: any = {};
        if (periodId) {
            whereClause.assignment = {
                periodId: String(periodId)
            };
        }

        const readings = await prisma.reading.findMany({
            where: whereClause,
            include: {
                assignment: {
                    include: {
                        worker: true,
                        dosimeter: true,
                        period: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(readings);
    } catch (error) {
        console.error('Error getting readings:', error);
        res.status(500).json({ message: 'Error retrieving readings' });
    }
};

export const createReading = async (req: Request, res: Response) => {
    try {
        const { assignmentId, hp10, hp007, readDate, source } = req.body;

        if (!assignmentId || hp10 === undefined || hp007 === undefined) {
            return res.status(400).json({ message: 'Assignment ID, Hp(10), and Hp(0.07) are required' });
        }

        const existingReading = await prisma.reading.findUnique({
            where: { assignmentId }
        });

        if (existingReading) {
            return res.status(400).json({ message: 'Reading already exists for this assignment' });
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { period: true }
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const bgHp10 = assignment.period.backgroundHp10 || 0;
        const bgHp007 = assignment.period.backgroundHp007 || 0;

        const rawHp10 = Number(hp10);
        const rawHp007 = Number(hp007);

        // Calculate net values (min 0 if negative, but we will handle display logic in frontend)
        // User requested to keep real negative values for traceability
        const netHp10 = rawHp10 - bgHp10;
        const netHp007 = rawHp007 - bgHp007;

        const result = await prisma.$transaction(async (tx) => {
            const reading = await tx.reading.create({
                data: {
                    assignmentId,
                    hp10: netHp10,
                    hp007: netHp007,
                    rawHp10: rawHp10,
                    rawHp007: rawHp007,
                    readDate: readDate ? new Date(readDate) : new Date(),
                    source: source || 'MANUAL'
                },
                include: {
                    assignment: {
                        include: { worker: true }
                    }
                }
            });

            // Update associated dosimeter to AVAILABLE
            const assignment = await tx.assignment.findUnique({
                where: { id: assignmentId },
                select: { dosimeterId: true }
            });

            if (assignment?.dosimeterId) {
                await tx.dosimeter.update({
                    where: { id: assignment.dosimeterId },
                    data: { status: 'AVAILABLE' }
                });
            }

            return reading;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating reading:', error);
        res.status(500).json({ message: 'Error creating reading' });
    }
};

// Batch create readings (for CSV Import)
export const createReadingsBatch = async (req: Request, res: Response) => {
    try {
        const { readings } = req.body; // Array of { assignmentId, hp10, hp007, readDate, source }

        if (!Array.isArray(readings) || readings.length === 0) {
            return res.status(400).json({ message: 'Invalid readings array' });
        }

        const results = [];
        const errors: any[] = [];
        let skipped = 0;

        await prisma.$transaction(async (tx) => {
            for (const r of readings) {
                try {
                    // Check if reading exists
                    const existing = await tx.reading.findUnique({ where: { assignmentId: r.assignmentId } });

                    if (existing) {
                        skipped++;
                        continue; // Skip if already exists as per user request
                    }

                    // Get assignment with period to find background
                    const assignmentInfo = await tx.assignment.findUnique({
                        where: { id: r.assignmentId },
                        include: { period: true }
                    });

                    if (!assignmentInfo) {
                        errors.push({ assignmentId: r.assignmentId, error: "Assignment not found" });
                        continue;
                    }

                    const bgHp10 = assignmentInfo.period.backgroundHp10 || 0;
                    const bgHp007 = assignmentInfo.period.backgroundHp007 || 0;

                    const rawHp10 = Number(r.hp10);
                    const rawHp007 = Number(r.hp007);

                    const netHp10 = rawHp10 - bgHp10;
                    const netHp007 = rawHp007 - bgHp007;

                    // Create new reading
                    const readingRecord = await tx.reading.create({
                        data: {
                            assignmentId: r.assignmentId,
                            hp10: netHp10,
                            hp007: netHp007,
                            rawHp10: rawHp10,
                            rawHp007: rawHp007,
                            readDate: r.readDate ? new Date(r.readDate) : new Date(),
                            source: r.source || 'CSV'
                        }
                    });
                    results.push(readingRecord);

                    // Release Dosimeter to AVAILABLE
                    const assignment = await tx.assignment.findUnique({
                        where: { id: r.assignmentId },
                        select: { dosimeterId: true }
                    });

                    if (assignment?.dosimeterId) {
                        await tx.dosimeter.update({
                            where: { id: assignment.dosimeterId },
                            data: { status: 'AVAILABLE' }
                        });
                    }

                } catch (e: any) {
                    errors.push({ assignmentId: r.assignmentId, error: e.message });
                }
            }
        });

        res.json({ message: 'Batch processing complete', processed: results.length, skipped, errors });

    } catch (error) {
        console.error('Error batch creating readings:', error);
        res.status(500).json({ message: 'Error batch processing readings' });
    }
}

export const deleteReading = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.reading.delete({ where: { id: String(id) } });
        res.json({ message: 'Reading deleted successfully' });
    } catch (error) {
        console.error('Error deleting reading:', error);
        res.status(500).json({ message: 'Error deleting reading' });
    }
};
