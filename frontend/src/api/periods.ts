
import axios from 'axios';

const API_URL = '/api/periods';

export interface Period {
    id: string;
    month: number;
    year: number;
    status: 'OPEN' | 'CLOSED';
    backgroundDosimeterCode?: string;
    backgroundHp10?: number;
    backgroundHp007?: number;
    createdAt?: string;
}

export type PeriodInput = {
    month: number;
    year: number;
};

export const getPeriods = async (): Promise<Period[]> => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createPeriod = async (period: PeriodInput): Promise<Period> => {
    const response = await axios.post(API_URL, period);
    return response.data;
};

export const updatePeriod = async (id: string, data: Partial<Period>): Promise<Period> => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deletePeriod = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};
