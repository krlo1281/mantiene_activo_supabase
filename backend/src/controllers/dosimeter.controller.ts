
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getDosimeters = async (req: Request, res: Response) => {
    try {
        const { search, status } = req.query;

        const whereClause: any = {};

        if (status && status !== 'ALL') {
            whereClause.status = String(status);
        }

        if (search) {
            const searchStr = String(search);
            whereClause.code = { contains: searchStr, mode: 'insensitive' };
        }

        const dosimeters = await prisma.dosimeter.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        res.json(dosimeters);
    } catch (error) {
        console.error('Error getting dosimeters:', error);
        res.status(500).json({ message: 'Error retrieving dosimeters' });
    }
};

export const createDosimeter = async (req: Request, res: Response) => {
    try {
        const { code, type, status } = req.body;

        // Basic validation
        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }

        const existingDosimeter = await prisma.dosimeter.findUnique({ where: { code } });
        if (existingDosimeter) {
            return res.status(400).json({ message: 'Dosimeter with this code already exists' });
        }

        const dosimeter = await prisma.dosimeter.create({
            data: {
                code,
                type: type || 'FILM',
                status: status || 'AVAILABLE'
            }
        });

        res.status(201).json(dosimeter);
    } catch (error) {
        console.error('Error creating dosimeter:', error);
        res.status(500).json({ message: 'Error creating dosimeter' });
    }
};

export const updateDosimeter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, type, status } = req.body;

        const dosimeter = await prisma.dosimeter.update({
            where: { id },
            data: { code, type, status }
        });

        res.json(dosimeter);
    } catch (error) {
        console.error('Error updating dosimeter:', error);
        res.status(500).json({ message: 'Error updating dosimeter' });
    }
};

export const createDosimetersBatch = async (req: Request, res: Response) => {
    try {
        const { dosimeters } = req.body; // Array of { code, type, status }

        if (!Array.isArray(dosimeters) || dosimeters.length === 0) {
            return res.status(400).json({ message: 'Invalid dosimeters array' });
        }

        const results = [];
        const errors = [];

        for (const d of dosimeters) {
            try {
                // Check if exists
                const existing = await prisma.dosimeter.findUnique({ where: { code: d.code } });
                if (existing) {
                    errors.push({ code: d.code, error: 'Ya existe un dosímetro con este código' });
                    continue;
                }

                const created = await prisma.dosimeter.create({
                    data: {
                        code: d.code,
                        type: d.type || 'OSL', // Default to OSL if missing
                        status: d.status || 'AVAILABLE'
                    }
                });
                results.push(created);
            } catch (e: any) {
                errors.push({ code: d.code, error: e.message });
            }
        }

        res.json({ message: 'Procesamiento masivo completado', processed: results.length, errors });

    } catch (error) {
        console.error('Error batch creating dosimeters:', error);
        res.status(500).json({ message: 'Error batch processing dosimeters' });
    }
};

export const deleteDosimeter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.dosimeter.delete({ where: { id } });
        res.json({ message: 'Dosimeter deleted successfully' });
    } catch (error) {
        console.error('Error deleting dosimeter:', error);
        res.status(500).json({ message: 'Error deleting dosimeter' });
    }
};
