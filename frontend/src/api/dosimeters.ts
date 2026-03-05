
import axios from 'axios';

const API_URL = '/api/dosimeters';

export interface Dosimeter {
    id: string;
    code: string;
    type: 'FILM' | 'TLD' | 'OSL';
    status: 'AVAILABLE' | 'ASSIGNED' | 'RETIRED';
    createdAt?: string;
}

export type DosimeterInput = Omit<Dosimeter, 'id' | 'createdAt'>;

export const getDosimeters = async (status?: string, search?: string): Promise<Dosimeter[]> => {
    const params: any = {};
    if (status && status !== 'ALL') params.status = status;
    if (search) params.search = search;
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const createDosimeter = async (dosimeter: DosimeterInput): Promise<Dosimeter> => {
    const response = await axios.post(API_URL, dosimeter);
    return response.data;
};

export const updateDosimeter = async (id: string, dosimeter: DosimeterInput): Promise<Dosimeter> => {
    const response = await axios.put(`${API_URL}/${id}`, dosimeter);
    return response.data;
};

export const createDosimetersBatch = async (dosimeters: DosimeterInput[]): Promise<{ message: string, processed: number, errors: any[] }> => {
    const response = await axios.post(`${API_URL}/batch`, { dosimeters });
    return response.data;
};

export const deleteDosimeter = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};
