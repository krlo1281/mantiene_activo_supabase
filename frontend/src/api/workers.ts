
import axios from 'axios';

const API_URL = '/api/workers';

export interface Worker {
    id: string;
    dni: string;
    firstName: string;
    lastName: string;
    companies: {
        id: string;
        name: string;
        ruc: string | null;
    }[];
    createdAt?: string;
}

export type WorkerInput = {
    dni: string;
    firstName: string;
    lastName: string;
    companyId?: string; // For creation/linking
};

export const getWorkers = async (companyId?: string, search?: string): Promise<Worker[]> => {
    const params: any = {};
    if (companyId && companyId !== 'ALL') params.companyId = companyId;
    if (search) params.search = search;

    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const createWorker = async (worker: WorkerInput): Promise<Worker> => {
    const response = await axios.post(API_URL, worker);
    return response.data;
};

export const updateWorker = async (id: string, worker: WorkerInput): Promise<Worker> => {
    const response = await axios.put(`${API_URL}/${id}`, worker);
    return response.data;
};

export const deleteWorker = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};

export interface WorkerHistoryResponse {
    worker: Worker;
    stats: {
        ytdHp10: number;
        ytdHp007: number;
        totalHp10: number; // Added
        lastMonthDose: number;
        totalReadings: number;
        lastReadingDate: string;
    };
    history: {
        period: string;
        hp10: number;
        hp007: number;
        status: string;
    }[];
    assignments: {
        id: string;
        period: string;
        dosimeter: string;
        company: string;
        hp10?: number; // Optional as might be pending
        hp007?: number;
        status: string;
    }[];
}

export const getWorkerHistory = async (id: string): Promise<WorkerHistoryResponse> => {
    const response = await axios.get(`${API_URL}/${id}/dose-history`);
    return response.data;
};
