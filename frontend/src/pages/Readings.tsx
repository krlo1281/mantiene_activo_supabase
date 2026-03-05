
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getReadings, deleteReading } from "@/api/readings"
import type { Reading } from "@/api/readings"
import { getPeriods } from "@/api/periods"
import type { Period } from "@/api/periods"
import { getAssignments } from "@/api/assignments"
import type { Assignment } from "@/api/assignments"
import ReadingForm from "@/components/readings/ReadingForm"
import CsvUpload from "@/components/readings/CsvUpload"

export default function Readings() {
    const [periods, setPeriods] = useState<Period[]>([])
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>("")
    const [readings, setReadings] = useState<Reading[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])

    // UI State
    const [loading, setLoading] = useState(true)
    const [isManualFormOpen, setIsManualFormOpen] = useState(false)
    const [manualEntryAssignmentId, setManualEntryAssignmentId] = useState<string | null>(null)
    const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Load periods
    useEffect(() => {
        getPeriods().then(data => {
            setPeriods(data)
            if (data.length > 0) {
                setSelectedPeriodId(data[0].id)
            } else {
                setTimeout(() => setLoading(false), 300)
            }
        }).catch((err) => {
            console.error(err)
            setTimeout(() => setLoading(false), 300)
        })
    }, [])

    // Load data when period changes
    useEffect(() => {
        if (selectedPeriodId) {
            loadData()
        } else {
            setReadings([])
            setAssignments([])
        }
    }, [selectedPeriodId])

    const loadData = async () => {
        setLoading(true)
        try {
            const [readingsData, assignmentsData] = await Promise.all([
                getReadings(selectedPeriodId),
                getAssignments(selectedPeriodId)
            ])
            setReadings(readingsData)
            setAssignments(assignmentsData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setTimeout(() => setLoading(false), 300)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta lectura?")) return;
        try {
            await deleteReading(id)
            loadData()
        } catch (error) {
            console.error("Failed to delete reading:", error)
        }
    }

    const getMonthName = (month: number) => {
        const date = new Date();
        date.setMonth(month - 1);
        return date.toLocaleString('es-ES', { month: 'long' });
    }

    const formatDose = (value: number) => {
        if (value < 0) return "M";
        return value.toFixed(4);
    }

    const filteredReadings = assignments.map(a => {
        const reading = readings.find(r => r.assignmentId === a.id);
        return {
            assignment: a,
            reading: reading || null
        };
    }).filter(row => {
        const workerName = `${row.assignment.worker?.firstName} ${row.assignment.worker?.lastName}`.toLowerCase()
        const dni = row.assignment.worker?.dni || ''
        const search = searchTerm.toLowerCase()
        return workerName.includes(search) || dni.includes(search)
    })



    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Lecturas</h2>
                    <p className="text-muted-foreground">Registro de dosis por periodo.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Seleccionar Periodo" />
                        </SelectTrigger>
                        <SelectContent>
                            {periods.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{getMonthName(p.month)} {p.year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-muted-foreground text-sm">search</span>
                    <Input
                        placeholder="Buscar por nombre o DNI..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={() => setIsCsvUploadOpen(true)} disabled={!selectedPeriodId} className="gap-2">
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Importar CSV
                </Button>
                <Button onClick={() => {
                    setManualEntryAssignmentId(null);
                    setIsManualFormOpen(true);
                }} disabled={!selectedPeriodId} className="gap-2">
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                    Registro Manual
                </Button>
            </div>

            <ReadingForm
                open={isManualFormOpen}
                onOpenChange={setIsManualFormOpen}
                onSuccess={loadData}
                assignments={assignments}
                preSelectedAssignmentId={manualEntryAssignmentId}
            />

            <CsvUpload
                open={isCsvUploadOpen}
                onOpenChange={setIsCsvUploadOpen}
                onSuccess={loadData}
                assignments={assignments} // Pass assignments for DNI matching
            />

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <p className="text-center py-10">Cargando...</p>
                    ) : filteredReadings.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">sensor_occupied</span>
                            <p className="text-muted-foreground">No hay lecturas registradas en este periodo.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table wrapperClassName="max-h-[600px]">
                                <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>DNI</TableHead>
                                        <TableHead>Dosímetro</TableHead>
                                        <TableHead>Hp(10)</TableHead>
                                        <TableHead>Hp(0.07)</TableHead>
                                        <TableHead>Fuente</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReadings.map((row) => {
                                        const reading = row.reading;
                                        const assignment = row.assignment;

                                        return (
                                            <TableRow key={assignment.id}>
                                                <TableCell className="font-medium">
                                                    {assignment.worker?.firstName} {assignment.worker?.lastName}
                                                </TableCell>
                                                <TableCell>{assignment.worker?.dni}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {assignment.dosimeter?.code}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    {reading ? formatDose(reading.hp10) : <span className="text-muted-foreground text-xs italic">Pendiente</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {reading ? formatDose(reading.hp007) : <span className="text-muted-foreground text-xs italic">Pendiente</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {reading ? (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {reading.source}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] border-dashed">
                                                            –
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {reading ? (
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(reading.id)}>
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => {
                                                            setManualEntryAssignmentId(assignment.id);
                                                            setIsManualFormOpen(true);
                                                        }}>
                                                            <span className="material-symbols-outlined text-sm mr-1">edit_note</span>
                                                            Reg.
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <div className="mt-4 text-sm text-muted-foreground">
                <p><strong>Leyenda:</strong> M = Mínimo Detectable (Lectura por debajo del fondo)</p>
            </div>
        </>
    )
}
