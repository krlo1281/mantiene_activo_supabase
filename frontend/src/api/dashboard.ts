
import axios from "axios";

const API_URL = '/api/dashboard';

export interface DashboardStats {
    workers: {
        total: number;
        growth: number;
    };
    dosimeters: {
        total: number;
        assigned: number;
        available: number;
        retired: number;
    };
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
};
