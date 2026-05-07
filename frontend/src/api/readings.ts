import axios from '../lib/axios';
import type { Assignment } from './assignments';

const API_URL = '/api/readings';

export interface Reading {
    id: string;
    assignmentId: string;
    hp10: number;
    hp007: number;
    rawHp10?: number | null;
    rawHp007?: number | null;
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

export interface ReadingImportRow {
    readDate: string;
    dosimeterCode: string;
    rawHp10: number;
    rawHp007: number;
    // Returned by validation:
    assignmentId?: string;
    workerName?: string;
    workerDni?: string;
    companyName?: string;
    periodName?: string;
    statuses?: string[];
}

export interface ReadingValidationResult {
    validatedRows: ReadingImportRow[];
}

export const validateReadingsImport = async (rows: ReadingImportRow[]): Promise<ReadingValidationResult> => {
    const response = await axios.post(`${API_URL}/import/validate`, { rows });
    return response.data;
};

export const executeReadingsImport = async (rows: ReadingImportRow[]): Promise<{ message: string, processed: number }> => {
    const response = await axios.post(`${API_URL}/import/execute`, { rows });
    return response.data;
};

export const deleteReading = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};
