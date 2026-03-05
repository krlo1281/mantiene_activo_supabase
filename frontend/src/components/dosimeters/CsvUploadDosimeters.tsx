
import { useState } from "react"
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
import { createDosimetersBatch } from "@/api/dosimeters"

interface CsvUploadDosimetersProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export default function CsvUploadDosimeters({ open, onOpenChange, onSuccess }: CsvUploadDosimetersProps) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<{ processed: number, errors: any[] } | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setStats(null)
        }
    }

    const parseCSV = (text: string) => {
        const lines = text.split('\n')
        const data = []

        // Simple format: Code,Type(Optional),Status(Optional)
        // Default Type=OSL, Status=AVAILABLE

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line || (i === 0 && line.toLowerCase().includes('code'))) continue; // Skip header

            const parts = line.split(',')
            if (parts.length < 1) continue;

            const code = parts[0].trim()
            const typeRaw = parts[1]?.trim().toUpperCase()
            const statusRaw = parts[2]?.trim().toUpperCase()

            if (!code) continue;

            let type: 'FILM' | 'TLD' | 'OSL' = 'OSL'
            if (typeRaw === 'FILM') type = 'FILM'
            else if (typeRaw === 'TLD') type = 'TLD'
            else if (typeRaw === 'OSL') type = 'OSL'

            let status: 'AVAILABLE' | 'ASSIGNED' | 'RETIRED' = 'AVAILABLE'
            if (statusRaw === 'ASSIGNED') status = 'ASSIGNED'
            else if (statusRaw === 'RETIRED') status = 'RETIRED'

            data.push({ code, type, status })
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

            if (parsedRows.length === 0) {
                setLoading(false)
                setStats({ processed: 0, errors: [{ code: 'GENERAL', error: 'No se encontraron registros válidos' }] })
                return
            }

            try {
                const result = await createDosimetersBatch(parsedRows)
                setStats({
                    processed: result.processed,
                    errors: result.errors
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Importar Dosímetros (CSV)</DialogTitle>
                    <DialogDescription>
                        Formato: <code>CODIGO, [TIPO], [ESTADO]</code>
                        <br />Ejemplo: <code>DOS-001, OSL, AVAILABLE</code>
                        <br />Tipo y Estado son opcionales (Defecto: OSL, AVAILABLE)
                    </DialogDescription>
                </DialogHeader>

                {!stats ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="csvFile">Archivo CSV</Label>
                            <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} />
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-green-600">check_circle</span>
                            <span className="font-semibold">{stats.processed} dosímetros creados.</span>
                        </div>
                        {stats.errors.length > 0 && (
                            <div className="border rounded-md p-4 bg-red-50 max-h-[200px] overflow-y-auto">
                                <p className="text-red-700 font-semibold mb-2">{stats.errors.length} errores:</p>
                                <ul className="text-sm text-red-600 space-y-1">
                                    {stats.errors.map((err, idx) => (
                                        <li key={idx}>
                                            {err.code ? `Código ${err.code}: ` : ''}
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
                        <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
