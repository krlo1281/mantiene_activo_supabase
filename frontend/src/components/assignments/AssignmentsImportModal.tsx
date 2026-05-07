import { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useDataRefresh } from '@/context/DataRefreshContext';
import {
    validateAssignmentsImport,
    executeAssignmentsImport,
} from '@/api/assignments';
import type {
    ImportRowInput,
    ValidatedRow,
    ImportValidationResponse,
    ImportExecuteResponse,
    RowStatus,
} from '@/api/assignments';

// ─── Utilidades de presentación ─────────────────────────────────────────────

const STATUS_CONFIG: Record<RowStatus, { label: string; className: string }> = {
    READY: { label: 'Listo', className: 'bg-green-100 text-green-800 border-green-300' },
    WILL_CREATE_COMPANY: { label: 'Nueva Empresa', className: 'bg-blue-100 text-blue-800 border-blue-300' },
    WILL_CREATE_WORKER: { label: 'Nuevo Trabajador', className: 'bg-blue-100 text-blue-800 border-blue-300' },
    WILL_CREATE_PERIOD: { label: 'Nuevo Periodo', className: 'bg-amber-100 text-amber-800 border-amber-300' },
    WARNING: { label: 'Advertencia', className: 'bg-amber-100 text-amber-800 border-amber-300' },
    ERROR: { label: 'Error', className: 'bg-red-100 text-red-800 border-red-300' },
};

const getRowBgClass = (statuses: RowStatus[]): string => {
    if (statuses.includes('ERROR')) return 'bg-red-50 dark:bg-red-950/20';
    if (statuses.some(s => s.startsWith('WILL_CREATE') || s === 'WARNING'))
        return 'bg-amber-50 dark:bg-amber-950/20';
    return 'bg-green-50 dark:bg-green-950/10';
};

// ─── Columnas requeridas del Excel ────────────────────────────────────────────
const REQUIRED_COLUMNS: (keyof ImportRowInput)[] = [
    'RUC_EMPRESA', 'NOMBRE_EMPRESA', 'TIPO_DOC', 'NUM_DOC',
    'NOMBRES', 'APELLIDOS', 'MES_PERIODO', 'ANO_PERIODO',
];

// ─── Tipos internos ───────────────────────────────────────────────────────────
type Phase = 'upload' | 'validating' | 'preview' | 'executing' | 'done';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AssignmentsImportModal({ open, onOpenChange, onSuccess }: Props) {
    const [phase, setPhase] = useState<Phase>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [validationResult, setValidationResult] = useState<ImportValidationResponse | null>(null);
    const [editableRows, setEditableRows] = useState<ValidatedRow[]>([]);
    const [executeResult, setExecuteResult] = useState<ImportExecuteResponse | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { triggerRefresh } = useDataRefresh();

    // ─── Parseo del Excel en el navegador ────────────────────────────────────
    const parseExcel = useCallback((file: File) => {
        setErrorMsg('');
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const XLSX = await import('xlsx');
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

                if (rawRows.length === 0) {
                    setErrorMsg('El archivo está vacío o no tiene datos en la primera hoja.');
                    return;
                }

                // Validar columnas requeridas
                const firstRow = rawRows[0];
                const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));
                if (missingColumns.length > 0) {
                    setErrorMsg(`Columnas faltantes en el Excel: ${missingColumns.join(', ')}`);
                    return;
                }

                // Normalizar: convertir todos los valores a string
                const rows: ImportRowInput[] = rawRows.map(r => ({
                    RUC_EMPRESA: String(r.RUC_EMPRESA ?? '').trim(),
                    NOMBRE_EMPRESA: String(r.NOMBRE_EMPRESA ?? '').trim(),
                    NOMBRE_SEDE: String(r.NOMBRE_SEDE ?? '').trim() || undefined,
                    TIPO_DOC: String(r.TIPO_DOC ?? '').trim(),
                    NUM_DOC: String(r.NUM_DOC ?? '').trim(),
                    NOMBRES: String(r.NOMBRES ?? '').trim(),
                    APELLIDOS: String(r.APELLIDOS ?? '').trim(),
                    AREA_USO: String(r.AREA_USO ?? '').trim() || undefined,
                    MES_PERIODO: String(r.MES_PERIODO ?? '').trim(),
                    ANO_PERIODO: String(r.ANO_PERIODO ?? '').trim(),
                }));

                setPhase('validating');
                const result = await validateAssignmentsImport(rows);
                setValidationResult(result);
                setEditableRows(result.validatedRows);
                setPhase('preview');
            } catch (err: any) {
                setErrorMsg(err?.response?.data?.message || 'Error al leer o validar el archivo.');
                setPhase('upload');
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    // ─── Drag & Drop ──────────────────────────────────────────────────────────
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) parseExcel(file);
    }, [parseExcel]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseExcel(file);
    };

    // ─── Cambio manual del dosímetro asignado ────────────────────────────────
    const handleDosimeterChange = (rowIndex: number, dosimeterId: string) => {
        const selectedDosimeter = validationResult?.availableDosimeters.find(d => d.id === dosimeterId);
        if (!selectedDosimeter) return;

        setEditableRows(prev => prev.map((r, i) =>
            i === rowIndex ? { ...r, assignedDosimeterId: selectedDosimeter.id, assignedDosimeterCode: selectedDosimeter.code } : r
        ));
    };

    // ─── Confirmar e importar ─────────────────────────────────────────────────
    const handleExecute = async () => {
        setPhase('executing');
        try {
            const result = await executeAssignmentsImport(editableRows);
            setExecuteResult(result);
            triggerRefresh();
            setPhase('done');
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.message || 'Error al ejecutar la importación.');
            setPhase('preview');
        }
    };

    // ─── Reinicio del modal ───────────────────────────────────────────────────
    const handleClose = () => {
        setPhase('upload');
        setFileName('');
        setErrorMsg('');
        setValidationResult(null);
        setEditableRows([]);
        setExecuteResult(null);
        if (phase === 'done') onSuccess();
        onOpenChange(false);
    };

    const hasErrors = editableRows.some(r => r.statuses.includes('ERROR'));

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        Importar Asignaciones desde Excel
                    </DialogTitle>
                    <DialogDescription>
                        Carga el archivo Excel con la lista de trabajadores. El sistema asignará
                        dosímetros disponibles automáticamente.
                    </DialogDescription>
                </DialogHeader>

                {/* ── Fase 1: Zona de carga ─────────────────────────────── */}
                {phase === 'upload' && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                                isDragging
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                            }`}
                        >
                            <span className="material-symbols-outlined text-5xl text-muted-foreground">
                                table_view
                            </span>
                            <p className="text-sm font-medium text-center">
                                Arrastra tu archivo <strong>.xlsx</strong> aquí, o haz clic para buscarlo
                            </p>
                            <p className="text-xs text-muted-foreground text-center">
                                Columnas requeridas: RUC_EMPRESA, NOMBRE_EMPRESA, TIPO_DOC, NUM_DOC,
                                NOMBRES, APELLIDOS, MES_PERIODO, AÑO_PERIODO
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                        {errorMsg && (
                            <div className="w-full rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 p-3 flex items-start gap-2">
                                <span className="material-symbols-outlined text-red-600 text-sm mt-0.5">error</span>
                                <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Fase 2: Validando ────────────────────────────────── */}
                {phase === 'validating' && (
                    <div className="flex flex-col items-center gap-4 py-12">
                        <span className="material-symbols-outlined text-5xl text-primary animate-spin">
                            progress_activity
                        </span>
                        <p className="text-sm text-muted-foreground">
                            Validando <strong>{fileName}</strong> con la base de datos...
                        </p>
                    </div>
                )}

                {/* ── Fase 3: Preview con tabla editable ───────────────── */}
                {phase === 'preview' && validationResult && (
                    <div className="flex flex-col gap-3 overflow-hidden flex-1 min-h-0">
                        {/* Resumen */}
                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                                Total: <strong>{validationResult.summary.total}</strong>
                            </span>
                            <span className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                Listos: <strong>{validationResult.summary.ready}</strong>
                            </span>
                            {validationResult.summary.errors > 0 && (
                                <span className="px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                    Errores: <strong>{validationResult.summary.errors}</strong>
                                </span>
                            )}
                            <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                Dosímetros disponibles restantes: <strong>{validationResult.summary.dosimetersAvailableRemaining}</strong>
                            </span>
                        </div>

                        {hasErrors && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 p-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-600 text-base">block</span>
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    Existen filas con errores. Corrija el archivo Excel y vuelva a subirlo para habilitar la importación.
                                </p>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                                <p className="text-sm text-red-700">{errorMsg}</p>
                            </div>
                        )}

                        {/* Tabla */}
                        <div className="overflow-auto flex-1 border rounded-lg">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                    <tr className="border-b">
                                        <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-8">#</th>
                                        <th className="px-2 py-2 text-left font-semibold">Estado</th>
                                        <th className="px-2 py-2 text-left font-semibold">RUC / Empresa</th>
                                        <th className="px-2 py-2 text-left font-semibold">Sede</th>
                                        <th className="px-2 py-2 text-left font-semibold">Tipo Doc.</th>
                                        <th className="px-2 py-2 text-left font-semibold">N° Documento</th>
                                        <th className="px-2 py-2 text-left font-semibold">Apellidos, Nombres</th>
                                        <th className="px-2 py-2 text-left font-semibold">Área</th>
                                        <th className="px-2 py-2 text-left font-semibold">Periodo</th>
                                        <th className="px-2 py-2 text-left font-semibold">Dosímetro Asignado</th>
                                        <th className="px-2 py-2 text-left font-semibold">Mensajes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editableRows.map((row, idx) => (
                                        <tr
                                            key={idx}
                                            className={`border-b last:border-0 ${getRowBgClass(row.statuses)}`}
                                        >
                                            <td className="px-2 py-2 text-muted-foreground">{row.rowIndex}</td>
                                            <td className="px-2 py-2">
                                                <div className="flex flex-col gap-1">
                                                    {row.statuses.map((s, si) => (
                                                        <Badge key={si} variant="outline" className={`text-[10px] ${STATUS_CONFIG[s].className}`}>
                                                            {STATUS_CONFIG[s].label}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="font-medium">{row.NOMBRE_EMPRESA}</div>
                                                <div className="text-muted-foreground">{row.RUC_EMPRESA}</div>
                                            </td>
                                            <td className="px-2 py-2 text-muted-foreground">{row.NOMBRE_SEDE || '-'}</td>
                                            <td className="px-2 py-2">{row.TIPO_DOC}</td>
                                            <td className="px-2 py-2 font-mono">{row.NUM_DOC}</td>
                                            <td className="px-2 py-2">
                                                <strong>{row.APELLIDOS}</strong>, {row.NOMBRES}
                                            </td>
                                            <td className="px-2 py-2 text-muted-foreground">{row.AREA_USO || '-'}</td>
                                            <td className="px-2 py-2 font-mono text-center">
                                                {row.MES_PERIODO}/{row.ANO_PERIODO}
                                            </td>
                                            <td className="px-2 py-2">
                                                {row.statuses.includes('ERROR') ? (
                                                    <span className="text-muted-foreground italic">N/A</span>
                                                ) : (
                                                    <Select
                                                        value={row.assignedDosimeterId || ''}
                                                        onValueChange={(val) => handleDosimeterChange(idx, val)}
                                                    >
                                                        <SelectTrigger className="h-7 px-2 text-xs w-[120px] font-mono">
                                                            <SelectValue placeholder="Seleccionar..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {validationResult?.availableDosimeters.map(d => (
                                                                <SelectItem key={d.id} value={d.id} className="font-mono text-xs">
                                                                    {d.code}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </td>
                                            <td className="px-2 py-2">
                                                <ul className="list-none space-y-0.5">
                                                    {row.messages.map((m, mi) => (
                                                        <li key={mi} className="text-[10px] text-muted-foreground leading-tight">{m}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Fase 4: Ejecutando ───────────────────────────────── */}
                {phase === 'executing' && (
                    <div className="flex flex-col items-center gap-4 py-12">
                        <span className="material-symbols-outlined text-5xl text-primary animate-spin">
                            progress_activity
                        </span>
                        <p className="text-sm text-muted-foreground">
                            Guardando registros en la base de datos...
                        </p>
                    </div>
                )}

                {/* ── Fase 5: Resultado final ──────────────────────────── */}
                {phase === 'done' && executeResult && (
                    <div className="flex flex-col items-center gap-6 py-8">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                            <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg mb-1">¡Importación Completada!</h3>
                            <p className="text-sm text-muted-foreground">{executeResult.message}</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
                            {[
                                { label: 'Asignaciones creadas', value: executeResult.stats.asignacionesCreadas, color: 'text-green-700' },
                                { label: 'Trabajadores nuevos', value: executeResult.stats.trabajadoresCreados, color: 'text-blue-700' },
                                { label: 'Trabajadores vinculados', value: executeResult.stats.trabajadoresVinculados, color: 'text-blue-500' },
                                { label: 'Empresas creadas', value: executeResult.stats.empresasCreadas, color: 'text-purple-700' },
                                { label: 'Periodos creados', value: executeResult.stats.periodosCreados, color: 'text-amber-700' },
                                { label: 'Filas omitidas', value: executeResult.stats.filasOmitidas, color: 'text-red-600' },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-lg border p-3 text-center">
                                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Footer con acciones ───────────────────────────────── */}
                <DialogFooter className="pt-2 border-t">
                    {phase === 'upload' && (
                        <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    )}
                    {phase === 'preview' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPhase('upload');
                                    setFileName('');
                                    setValidationResult(null);
                                    setEditableRows([]);
                                    setErrorMsg('');
                                }}
                            >
                                <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
                                Cargar otro archivo
                            </Button>
                            <Button
                                onClick={handleExecute}
                                disabled={hasErrors}
                                className="gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">save</span>
                                Confirmar e Importar
                                {!hasErrors && <span className="ml-1 opacity-70">({editableRows.filter(r => !r.statuses.includes('ERROR')).length} filas)</span>}
                            </Button>
                        </>
                    )}
                    {phase === 'done' && (
                        <Button onClick={handleClose} className="gap-2">
                            <span className="material-symbols-outlined text-sm">check</span>
                            Cerrar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
