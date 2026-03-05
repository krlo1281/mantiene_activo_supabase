
import axios from 'axios';
import type { Worker } from './workers';
import type { Dosimeter } from './dosimeters';
import type { Period } from './periods';

const API_URL = '/api/assignments';

export interface Assignment {
    id: string;
    periodId: string;
    workerId: string;
    dosimeterId: string;
    companyId: string;
    worker?: Worker;
    dosimeter?: Dosimeter;
    period?: Period;
    company?: {
        id: string;
        name: string;
        ruc: string | null;
    };
    createdAt?: string;
}

export type AssignmentInput = {
    periodId?: string; // Optional if monthName/year provided
    workerId: string;
    dosimeterId: string;
    companyId: string;
    monthName?: string;
    year?: string;
};

export const getAssignments = async (periodId?: string, workerId?: string, companyId?: string, search?: string): Promise<Assignment[]> => {
    const params: any = {};
    if (periodId) params.periodId = periodId;
    if (workerId) params.workerId = workerId;
    if (companyId && companyId !== 'ALL') params.companyId = companyId;
    if (search) params.search = search;

    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const createAssignment = async (assignment: AssignmentInput): Promise<Assignment> => {
    const response = await axios.post(API_URL, assignment);
    return response.data;
};

export const deleteAssignment = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};
