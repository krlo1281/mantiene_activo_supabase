
import axios from "axios";

const API_URL = '/api/reports';

export interface MonthlyReportItem {
    id: string;
    workerName: string;
    dni: string;
    company: string;
    dosimeterCode: string;
    hp10: number;
    hp007: number;
    accumulatedHp10: number;
    accumulatedHp007: number;
    accumulatedMonths: number;
    status: 'READ' | 'PENDING';
}

export interface AssignmentHistoryItem {
    id: string;
    period: string;
    workerName: string;
    dni: string;
    company: string;
    dosimeterCode: string;
    status: string;
    readingValue: string;
}

export const getMonthlyReport = async (periodId: string, companyIds?: string[]): Promise<MonthlyReportItem[]> => {
    const params: any = { periodId };
    if (companyIds && companyIds.length > 0) {
        params.companyIds = companyIds.join(",");
    }

    const response = await axios.get(`${API_URL}/monthly`, { params });
    return response.data;
};

export const getAssignmentHistory = async (companyId?: string, dosimeterId?: string): Promise<AssignmentHistoryItem[]> => {
    const params: any = {};
    if (companyId && companyId !== "ALL") params.companyId = companyId;
    if (dosimeterId && dosimeterId !== "ALL") params.dosimeterId = dosimeterId;

    const response = await axios.get(`${API_URL}/history`, { params });
    return response.data;
};
