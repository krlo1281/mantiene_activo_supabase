import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDataRefresh } from "@/context/DataRefreshContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { validateReadingsImport, executeReadingsImport } from "@/api/readings";
import type { ReadingImportRow } from "@/api/readings";

interface CsvUploadProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function CsvUpload({ open, onOpenChange, onSuccess }: CsvUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [validationRows, setValidationRows] = useState<ReadingImportRow[] | null>(null);
    const [stats, setStats] = useState<{ processed: number } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { triggerRefresh } = useDataRefresh();

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            handleReset();
        }
    }, [open]);

    const handleReset = () => {
        setFile(null);
        setValidationRows(null);
        setStats(null);
        setLoading(false);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setValidationRows(null);
            setStats(null);
        }
    };

    const parseCSV = (text: string): ReadingImportRow[] => {
        const lines = text.split('\n');
        const data: ReadingImportRow[] = [];

        // Detect separator from first header line
        const header = lines[0] || '';
        const separator = header.includes('\t') ? '\t' : ',';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || i === 0) continue; // Skip empty lines and header

            const parts = line.split(separator);
            if (parts.length < 13) continue; // Basic length check for needed columns

            const dosimeterCode = parts[2]?.trim(); // Index 2

            // Stop reading if sentinels are found
            if (!dosimeterCode || dosimeterCode === '99999' || dosimeterCode.includes('**')) {
                break;
            }

            // Parse Date
            let date = new Date().toISOString();
            const dateStr = parts[0]?.trim(); // "4/05/2026 11:29" or "4/05/2026"
            if (dateStr) {
                const [d, m, yAndTime] = dateStr.split('/');
                if (d && m && yAndTime) {
                    const [y, time] = yAndTime.split(' ');
                    // Format: YYYY-MM-DDTHH:mm:ss (ISO 8601)
                    const paddedD = d.padStart(2, '0');
                    const paddedM = m.padStart(2, '0');
                    // If time has no seconds, add :00
                    const paddedTime = time
                        ? (time.split(':').length === 2 ? `${time}:00` : time)
                        : '00:00:00';
                    date = `${y}-${paddedM}-${paddedD}T${paddedTime}`;
                }
            }

            const rawHp10 = parseFloat(parts[8]?.trim()); // Index 8
            const rawHp007 = parseFloat(parts[12]?.trim()); // Index 12

            if (isNaN(rawHp10) || isNaN(rawHp007)) continue;

            data.push({ readDate: date, dosimeterCode, rawHp10, rawHp007 });
        }
        return data;
    };

    const handleValidate = async () => {
        if (!file) return;
        setLoading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const parsedRows = parseCSV(text);

                if (parsedRows.length === 0) {
                    alert("No se encontraron registros válidos para importar en este archivo.");
                    setLoading(false);
                    return;
                }

                const result = await validateReadingsImport(parsedRows);
                setValidationRows(result.validatedRows);
            } catch (error) {
                console.error("Validation failed", error);
                alert("Error al validar el archivo. Verifica el formato.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleExecute = async () => {
        if (!validationRows) return;

        // Filter only valid rows
        const validRows = validationRows.filter(row => row.statuses && row.statuses.includes('OK'));

        if (validRows.length === 0) {
            alert("No hay filas válidas para ejecutar.");
            return;
        }

        setLoading(true);
        try {
            const result = await executeReadingsImport(validRows);
            setStats({ processed: result.processed });
            triggerRefresh();
            onSuccess();
        } catch (error: any) {
            console.error("Execution failed", error);
            alert(error.response?.data?.message || "Error al guardar las lecturas en la base de datos.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (statuses: string[] = []) => {
        if (statuses.includes('OK')) {
            return <Badge className="bg-green-100 text-green-800 border-green-300">OK</Badge>;
        }
        return (
            <div className="flex flex-col gap-1">
                {statuses.map((s, idx) => (
                    <Badge key={idx} variant="destructive" className="text-[10px] leading-tight max-w-[200px] text-wrap">{s}</Badge>
                ))}
            </div>
        );
    };

    const validCount = validationRows?.filter(r => r.statuses?.includes('OK')).length || 0;
    const errorCount = (validationRows?.length || 0) - validCount;

    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setValidationRows(null);
            setStats(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Importación Masiva de Lecturas (CSV / Excel)</DialogTitle>
                    <DialogDescription>
                        Sube el archivo de salida del lector. El sistema identificará automáticamente las asignaciones correspondientes.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-2">
                    {!validationRows && !stats && (
                        <div 
                            className={`grid gap-4 py-8 px-4 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-50'} cursor-pointer text-center group`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-slate-200'} group-hover:bg-blue-100 transition-colors`}>
                                    <span className={`material-symbols-outlined text-4xl ${isDragging ? 'text-blue-600' : 'text-slate-500'} group-hover:text-blue-600`}>upload_file</span>
                                </div>
                                <h3 className="font-medium text-lg mt-2">Arrastra y suelta tu archivo aquí</h3>
                                <p className="text-sm text-muted-foreground">o haz clic para seleccionar un archivo CSV o TXT</p>
                                
                                <Input
                                    id="csvFile"
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileChange}
                                    ref={inputRef}
                                    className="hidden"
                                />
                                <span className="text-xs text-muted-foreground mt-4 block">
                                    Soporta separación por comas o tabulaciones. Ignorará filas de calibración (99999, ***).
                                </span>
                            </div>
                        </div>
                    )}

                    {validationRows && !stats && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-sm font-medium">
                                <div className="text-green-600 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    {validCount} válidas
                                </div>
                                {errorCount > 0 && (
                                    <div className="text-red-600 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[18px]">error</span>
                                        {errorCount} con error
                                    </div>
                                )}
                            </div>

                            <div className="border rounded-md overflow-auto max-h-[50vh]">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-3 py-2">Estado</th>
                                            <th className="px-3 py-2">Dosímetro</th>
                                            <th className="px-3 py-2">Hp(10) bruto</th>
                                            <th className="px-3 py-2">Hp(0.07) bruto</th>
                                            <th className="px-3 py-2">Periodo Asignado</th>
                                            <th className="px-3 py-2">Trabajador</th>
                                            <th className="px-3 py-2">Empresa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {validationRows.map((row, idx) => (
                                            <tr key={idx} className={row.statuses?.includes('OK') ? 'hover:bg-slate-50' : 'bg-red-50/50 hover:bg-red-50'}>
                                                <td className="px-3 py-2 align-top">{getStatusBadge(row.statuses)}</td>
                                                <td className="px-3 py-2 align-top font-mono font-medium">{row.dosimeterCode}</td>
                                                <td className="px-3 py-2 align-top">{row.rawHp10.toFixed(4)}</td>
                                                <td className="px-3 py-2 align-top">{row.rawHp007.toFixed(4)}</td>
                                                <td className="px-3 py-2 align-top">{row.periodName || <span className="text-muted-foreground italic">N/A</span>}</td>
                                                <td className="px-3 py-2 align-top">
                                                    {row.workerName ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-xs">{row.workerName}</span>
                                                            <span className="text-[10px] text-muted-foreground">DNI: {row.workerDni}</span>
                                                        </div>
                                                    ) : <span className="text-muted-foreground italic">N/A</span>}
                                                </td>
                                                <td className="px-3 py-2 align-top text-xs truncate max-w-[150px]">{row.companyName || <span className="text-muted-foreground italic">N/A</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {stats && (
                        <div className="py-8 text-center space-y-4">
                            <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
                            <h3 className="text-2xl font-semibold">¡Importación Exitosa!</h3>
                            <p className="text-muted-foreground">Se guardaron {stats.processed} lecturas correctamente.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 pt-4 border-t">
                    {!validationRows && !stats && (
                        <Button onClick={handleValidate} disabled={!file || loading}>
                            {loading ? "Validando..." : "Validar Archivo"}
                        </Button>
                    )}
                    {validationRows && !stats && (
                        <>
                            <Button variant="outline" onClick={handleReset} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button onClick={handleExecute} disabled={validCount === 0 || loading} className="bg-blue-600 hover:bg-blue-700">
                                {loading ? "Guardando..." : `Importar ${validCount} Lecturas Válidas`}
                            </Button>
                        </>
                    )}
                    {stats && (
                        <Button onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
