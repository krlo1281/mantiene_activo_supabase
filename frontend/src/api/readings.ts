
import axios from 'axios';
import type { Assignment } from './assignments';

const API_URL = '/api/readings';

export interface Reading {
    id: string;
    assignmentId: string;
    hp10: number;
    hp007: number;
    readDate: string;
    source: string;
    createdAt?: string;
    assignment?: Assignment;
}

export type ReadingInput = {
    assignmentId: string;
    hp10: number;
    hp007: number;
    readDate: string;
    source?: string;
};

export const getReadings = async (periodId?: string): Promise<Reading[]> => {
    const params: any = {};
    if (periodId) params.periodId = periodId;
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const createReading = async (reading: ReadingInput): Promise<Reading> => {
    const response = await axios.post(API_URL, reading);
    return response.data;
};

export const createReadingsBatch = async (readings: ReadingInput[]): Promise<{ message: string, processed: number, skipped?: number, errors: any[] }> => {
    const response = await axios.post(`${API_URL}/batch`, { readings });
    return response.data;
};

export const deleteReading = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};
