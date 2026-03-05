
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { createReadingsBatch } from "@/api/readings"
import type { Assignment } from "@/api/assignments"

interface CsvUploadProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    assignments: Assignment[]
}

export default function CsvUpload({ open, onOpenChange, onSuccess, assignments }: CsvUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<{ processed: number, skipped: number, errors: any[] } | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            // Give a small timeout to allow animation to finish if needed, or just reset immediately.
            // Immediate reset is fine for controlled/uncontrolled hybrid.
            setFile(null)
            setStats(null)
            setLoading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }, [open])

    const handleReset = () => {
        setFile(null)
        setStats(null)
        setLoading(false)
        if (inputRef.current) inputRef.current.value = ""
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setStats(null)
        }
    }

    const parseCSV = (text: string) => {
        const lines = text.split('\n')
        const data = []

        // Headers: Timestamp,Dosimeter,Magazine,Position,...
        // Expect: 
        // Col 0: Timestamp (DD/MM/YYYY HH:mm:ss)
        // Col 1: Dosimeter (Code)
        // Col 5: Hp(10) dose
        // Col 7: Hp(0.07) dose

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line || i === 0) continue; // Skip header

            const parts = line.split(',')
            if (parts.length < 8) continue; // Basic validation

            // Parse Date
            // 24/10/2022 15:29:30 -> ISO
            let date = new Date().toISOString()
            const dateStr = parts[0].trim() // "24/10/2022"
            if (dateStr) {
                const [d, m, yAndTime] = dateStr.split('/')
                if (d && m && yAndTime) {
                    const [y, time] = yAndTime.split(' ')
                    // Format: YYYY-MM-DDTHH:mm:ss
                    date = `${y}-${m}-${d}T${time || '00:00:00'}`
                }
            }

            const dosimeterCode = parts[1].trim()
            const hp10 = parseFloat(parts[5].trim())
            const hp007 = parseFloat(parts[7].trim())

            if (!dosimeterCode || isNaN(hp10) || isNaN(hp007)) continue;

            data.push({ dosimeterCode, hp10, hp007, date })
        }
        return data
    }

    const handleUpload = async () => {
        if (!file) return
        setLoading(true)

        const reader = new FileReader()
        reader.onload = async (e) => {
            const text = e.target?.result as string
            const parsedRows = parseCSV(text)

            // Match with Assignments by Dosimeter Code
            const readingsPayload = []
            const localErrors = []

            for (const row of parsedRows) {
                const assignment = assignments.find(a => a.dosimeter?.code === row.dosimeterCode)
                if (assignment) {
                    readingsPayload.push({
                        assignmentId: assignment.id,
                        hp10: row.hp10,
                        hp007: row.hp007,
                        readDate: row.date,
                        source: 'CSV'
                    })
                } else {
                    localErrors.push({ dosimeter: row.dosimeterCode, error: 'Dosímetro no asignado en este periodo' })
                }
            }

            if (readingsPayload.length === 0) {
                setLoading(false)
                setStats({ processed: 0, skipped: 0, errors: localErrors.concat([{ dosimeter: 'GENERAL', error: 'No se encontraron registros válidos para importar' }]) })
                return
            }

            try {
                const result = await createReadingsBatch(readingsPayload)
                setStats({
                    processed: result.processed,
                    skipped: result.skipped || 0,
                    errors: [...localErrors, ...result.errors]
                })
                if (result.processed > 0) {
                    onSuccess()
                }
            } catch (error) {
                console.error("Batch upload failed", error)
                alert("Error al procesar el archivo")
            } finally {
                setLoading(false)
            }
        }
        reader.readAsText(file)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Importar Lecturas (CSV)</DialogTitle>
                    <DialogDescription>
                        El sistema espera el formato estándar del lector (Timestamp, Dosimeter, ...).
                        <br />Col 1: <b>Timestamp</b>, Col 2: <b>Dosimeter</b>, Col 6: <b>Hp(10)</b>, Col 8: <b>Hp(0.07)</b>
                    </DialogDescription>
                </DialogHeader>

                {!stats ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="csvFile">Archivo CSV</Label>
                            <Input
                                id="csvFile"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                ref={inputRef}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-green-600">check_circle</span>
                            <span className="font-semibold">{stats.processed} lecturas procesadas exitosamente.</span>
                        </div>
                        {stats.skipped > 0 && (
                            <div className="flex items-center gap-2 mb-2 text-yellow-600">
                                <span className="material-symbols-outlined">warning</span>
                                <span>{stats.skipped} lecturas omitidas (ya existían).</span>
                            </div>
                        )}
                        {stats.errors.length > 0 && (
                            <div className="border rounded-md p-4 bg-red-50 max-h-[200px] overflow-y-auto">
                                <p className="text-red-700 font-semibold mb-2">{stats.errors.length} errores encontrados:</p>
                                <ul className="text-sm text-red-600 space-y-1">
                                    {stats.errors.map((err, idx) => (
                                        <li key={idx}>
                                            {err.dosimeter ? `Dosímetro ${err.dosimeter}: ` : ''}
                                            {err.assignmentId ? `ID ${err.assignmentId}: ` : ''}
                                            {err.error || 'Error desconocido'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {!stats ? (
                        <Button onClick={handleUpload} disabled={!file || loading}>
                            {loading ? "Procesando..." : "Subir y Procesar"}
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleReset}>Subir otro archivo</Button>
                            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
