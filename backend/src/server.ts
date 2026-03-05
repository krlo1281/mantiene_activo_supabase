
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { prisma } from './lib/prisma.js';

import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import workerRoutes from './routes/worker.routes.js';
import dosimeterRoutes from './routes/dosimeter.routes.js';
import periodRoutes from './routes/period.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import readingRoutes from './routes/reading.routes.js';
import reportRoutes from './routes/report.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import syncRoutes from './routes/sync.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/dosimeters', dosimeterRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/health', async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        res.json({ status: 'ok', database: 'connected', users: userCount });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Database connection failed', error });
    }
});

// Basic API Routes (Placeholder)
app.get('/api', (req, res) => {
    res.json({ message: 'Dosimetry System API v1' });
});

// 404 Handler - Must be before error handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message || String(err),
        stack: err.stack
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});