
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getCompanies = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        const whereClause: any = {};

        if (search) {
            const searchStr = String(search);
            whereClause.OR = [
                { name: { contains: searchStr, mode: 'insensitive' } },
                { ruc: { contains: searchStr } }
            ];
        }

        const companies = await prisma.company.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { workers: true } } }
        });
        res.json(companies);
    } catch (error) {
        console.error('Error getting companies:', error);
        res.status(500).json({ message: 'Error retrieving companies' });
    }
};

export const createCompany = async (req: Request, res: Response) => {
    try {
        const { ruc, name, address, phone, email } = req.body;

        // Basic validation
        if (!ruc || !name) {
            return res.status(400).json({ message: 'RUC and Name are required' });
        }

        const existingCompany = await prisma.company.findUnique({ where: { ruc } });
        if (existingCompany) {
            return res.status(400).json({ message: 'Company with this RUC already exists' });
        }

        const company = await prisma.company.create({
            data: { ruc, name, address, phone, email }
        });

        res.status(201).json(company);
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ message: 'Error creating company' });
    }
};

export const updateCompany = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { ruc, name, address, phone, email } = req.body;

        const company = await prisma.company.update({
            where: { id },
            data: { ruc, name, address, phone, email }
        });

        res.json(company);
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ message: 'Error updating company' });
    }
};

export const deleteCompany = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.company.delete({ where: { id } });
        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ message: 'Error deleting company' });
    }
};
