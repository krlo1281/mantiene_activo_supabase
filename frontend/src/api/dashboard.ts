
import axios from "@/lib/axios";

const API_URL = '/api/dashboard';

export interface PendingReading {
    year: number;
    month: number;
    pendingCount: number;
}

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
    pendingReadingsByPeriod: PendingReading[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
};
