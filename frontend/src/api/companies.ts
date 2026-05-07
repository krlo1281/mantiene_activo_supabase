
import axios from '../lib/axios';

const API_URL = '/api/companies';

export interface Company {
    id: string;
    ruc: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    portalStatus?: "ACTIVO" | "SUSPENDIDO" | "INACTIVO" | string;
    createdAt?: string;
    _count?: {
        workers: number;
    }
}

export type CompanyInput = Omit<Company, 'id' | 'createdAt' | '_count'>;

export const getCompanies = async (search?: string): Promise<Company[]> => {
    const params: any = {};
    if (search) params.search = search;
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const createCompany = async (company: CompanyInput): Promise<Company> => {
    const response = await axios.post(API_URL, company);
    return response.data;
};

export const updateCompany = async (id: string, company: CompanyInput): Promise<Company> => {
    const response = await axios.put(`${API_URL}/${id}`, company);
    return response.data;
};

export const deleteCompany = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};

export const listCompanyAccesses = async (companyId: string): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/${companyId}/users`);
    return response.data;
};

export const createCompanyAccess = async (companyId: string, payload: { email: string, password: string }): Promise<any> => {
    const response = await axios.post(`${API_URL}/${companyId}/users`, payload);
    return response.data;
};

export const resetCompanyAccessPassword = async (companyId: string, userId: string, payload: { newPassword: string }): Promise<any> => {
    const response = await axios.put(`${API_URL}/${companyId}/users/${userId}/password`, payload);
    return response.data;
};
