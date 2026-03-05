import axios from 'axios';

const API_URL = '/api/sync';

export interface SyncConfig {
    enabled: boolean;
    time: string;
}

export const getSyncConfig = async (): Promise<SyncConfig> => {
    const response = await axios.get(`${API_URL}/config`);
    return response.data;
};

export const updateSyncConfig = async (config: SyncConfig): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_URL}/config`, config);
    return response.data;
};

export const triggerManualSync = async (): Promise<{ success: boolean; message: string; duration?: string }> => {
    const response = await axios.post(`${API_URL}/manual`);
    return response.data;
};
