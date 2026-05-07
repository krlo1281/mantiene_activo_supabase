import axios from '../lib/axios';

export interface Branch {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    companyId: string;
    createdAt?: string;
    updatedAt?: string;
}

export const getBranches = async (companyId: string) => {
    const response = await axios.get(`/api/companies/${companyId}/branches`);
    return response.data;
};

export const createBranch = async (companyId: string, branch: Partial<Branch>) => {
    const response = await axios.post(`/api/companies/${companyId}/branches`, branch);
    return response.data;
};

export const updateBranch = async (companyId: string, id: string, branch: Partial<Branch>) => {
    const response = await axios.put(`/api/companies/${companyId}/branches/${id}`, branch);
    return response.data;
};

export const deleteBranch = async (companyId: string, id: string) => {
    const response = await axios.delete(`/api/companies/${companyId}/branches/${id}`);
    return response.data;
};
