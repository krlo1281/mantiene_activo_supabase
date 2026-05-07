
import axios from '../lib/axios';
import type { Worker } from './workers';
import type { Dosimeter } from './dosimeters';
import type { Period } from './periods';
import type { Branch } from './branches';

const API_URL = '/api/assignments';

export interface Assignment {
    id: string;
    periodId: string;
    workerId: string;
    dosimeterId: string;
    companyId: string;
    branchId?: string | null;
    useArea?: string;
    readingDeleted?: boolean;
    worker?: Worker;
    dosimeter?: Dosimeter;
    period?: Period;
    branch?: Branch;
    company?: {
        id: string;
        name: string;
        ruc: string | null;
    };
    createdAt?: string;
}

export type AssignmentInput = {
    periodId?: string; // Opcional si se provee monthName/year
    workerId: string;
    dosimeterId: string;
    companyId: string;
    useArea?: string;
    monthName?: string;
    year?: string;
};

// --- Tipos para importación masiva ---
export type RowStatus =
    | 'READY'
    | 'WILL_CREATE_COMPANY'
    | 'WILL_CREATE_WORKER'
    | 'WILL_CREATE_PERIOD'
    | 'WARNING'
    | 'ERROR';

export interface ImportRowInput {
    RUC_EMPRESA: string;
    NOMBRE_EMPRESA: string;
    NOMBRE_SEDE?: string;
    TIPO_DOC: string;
    NUM_DOC: string;
    NOMBRES: string;
    APELLIDOS: string;
    AREA_USO?: string;
    MES_PERIODO: string;
    ANO_PERIODO: string;
}

export interface ValidatedRow extends ImportRowInput {
    rowIndex: number;
    statuses: RowStatus[];
    messages: string[];
    assignedDosimeterCode?: string;
    assignedDosimeterId?: string;
}

export interface ImportValidationResponse {
    validatedRows: ValidatedRow[];
    summary: {
        total: number;
        errors: number;
        ready: number;
        dosimetersAvailableRemaining: number;
    };
    availableDosimeters: { id: string; code: string }[];
}

export interface ImportExecuteResponse {
    message: string;
    stats: {
        empresasCreadas: number;
        empresasVinculadas: number;
        trabajadoresCreados: number;
        trabajadoresVinculados: number;
        periodosCreados: number;
        asignacionesCreadas: number;
        filasOmitidas: number;
    };
}

// --- Funciones de API ---
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

export const validateAssignmentsImport = async (rows: ImportRowInput[]): Promise<ImportValidationResponse> => {
    const response = await axios.post(`${API_URL}/import/validate`, { rows });
    return response.data;
};

export const executeAssignmentsImport = async (rows: ValidatedRow[]): Promise<ImportExecuteResponse> => {
    const response = await axios.post(`${API_URL}/import/execute`, { rows });
    return response.data;
};
