
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useDataRefresh } from "@/context/DataRefreshContext"
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
    const { triggerRefresh } = useDataRefresh()

    // UI State
    const [loading, setLoading] = useState(true)
    const [isManualFormOpen, setIsManualFormOpen] = useState(false)
    const [manualEntryAssignmentId, setManualEntryAssignmentId] = useState<string | null>(null)
    const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [showOnlyPending, setShowOnlyPending] = useState(false)

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
        if (!confirm("Â¿Eliminar esta lectura?")) return;
        try {
            await deleteReading(id)
            triggerRefresh()
            loadData()
        } catch (error) {
            console.error("Failed to delete reading:", error)
        }
    }

    const getMonthName = (month: number) => {
        const date = new Date(2000, month - 1, 1);
        return date.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    }

    const currentPeriod = periods.find(p => p.id === selectedPeriodId);
    const bgHp10 = Number(currentPeriod?.backgroundHp10 || 0);
    const bgHp007 = Number(currentPeriod?.backgroundHp007 || 0);

    const formatRawDose = (value: number | string) => {
        const num = Number(value);
        if (isNaN(num)) return "0.0000";
        return num.toFixed(4);
    }



    const filteredReadings = assignments.map(a => {
        const reading = readings.find(r => r.assignmentId === a.id);
        return {
            assignment: a,
            reading: reading || null
        };
    }).filter(row => {
        // Filter by text search
        const workerName = `${row.assignment.worker?.firstName} ${row.assignment.worker?.lastName}`.toLowerCase()
        const docNumber = row.assignment.worker?.documentNumber || ''
        const search = searchTerm.toLowerCase()
        const matchesSearch = workerName.includes(search) || docNumber.includes(search)

        // Filter by pending status
        const matchesPending = showOnlyPending ? row.reading === null : true;

        return matchesSearch && matchesPending;
    })

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Lecturas</h2>
                    <p className="text-sm md:text-base text-muted-foreground">Gestión de dosis y cálculo de fondo.</p>
                </div>
                <div className="flex gap-4 items-center">
                    {currentPeriod && (
                        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-xs font-semibold text-slate-500 uppercase">Fondo del Periodo:</div>
                            <Badge variant="secondary" className="font-mono">Hp10: {bgHp10.toFixed(4)}</Badge>
                            <Badge variant="secondary" className="font-mono">Hp007: {bgHp007.toFixed(4)}</Badge>
                        </div>
                    )}
                    <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                        <SelectTrigger className="w-full sm:w-[200px]">
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

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-muted-foreground text-sm">search</span>
                    <Input
                        placeholder="Buscar por nombre o DNI..."
                        className="pl-9 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 items-center justify-between sm:justify-start">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                            checked={showOnlyPending}
                            onChange={(e) => setShowOnlyPending(e.target.checked)}
                        />
                        Solo pendientes
                    </label>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setIsCsvUploadOpen(true)} disabled={!selectedPeriodId} className="gap-2 flex-1 sm:flex-none">
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        <span>Importar Excel</span>
                    </Button>
                    <Button onClick={() => {
                        setManualEntryAssignmentId(null);
                        setIsManualFormOpen(true);
                    }} disabled={!selectedPeriodId} className="gap-2 flex-1 sm:flex-none">
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        <span>Registro Manual</span>
                    </Button>
                </div>
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
                        <div className="rounded-md border w-full overflow-hidden bg-white">
                            <Table wrapperClassName="max-h-[calc(100vh-280px)] min-h-[400px]">
                                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
                                    <TableRow>
                                        <TableHead className="w-[250px] bg-slate-50">Usuario / Sede</TableHead>
                                        <TableHead className="bg-slate-50">DNI</TableHead>
                                        <TableHead className="bg-slate-50">Dosímetro</TableHead>
                                        <TableHead className="bg-blue-50/90 text-blue-900 font-bold">Hp(10) (mSv)</TableHead>
                                        <TableHead className="bg-blue-50/90 text-blue-900 font-bold">Hp(0.07) (mSv)</TableHead>
                                        <TableHead className="text-right bg-slate-50">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                        {filteredReadings.map((row) => {
                                            const reading = row.reading;
                                            const assignment = row.assignment;

                                            return (
                                                <TableRow key={assignment.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell>
                                                        <div className="font-semibold text-slate-800">
                                                            {assignment.worker?.firstName} {assignment.worker?.lastName}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 uppercase font-medium">
                                                            {assignment.branch?.name ? assignment.branch.name : ""} {assignment.useArea ? `| ${assignment.useArea}` : ""}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-slate-600">{assignment.worker?.documentNumber}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono text-[10px]">
                                                            {assignment.dosimeter?.code}
                                                        </Badge>
                                                    </TableCell>
                                                    
                                                    {/* Hp10 Column */}
                                                    <TableCell 
                                                        className="font-mono text-blue-700 bg-blue-50/10 cursor-help text-sm font-bold"
                                                        title={reading ? `Valor Neto Guardado: ${formatRawDose(reading.hp10)}` : undefined}
                                                    >
                                                        {reading ? formatRawDose(reading.rawHp10 ?? reading.hp10) : <span className={`text-sm font-normal ${assignment.readingDeleted ? 'text-red-400 font-medium' : 'text-slate-400 italic'}`}>{assignment.readingDeleted ? 'Eliminada' : 'Pendiente'}</span>}
                                                    </TableCell>

                                                    {/* Hp0.07 Column */}
                                                    <TableCell 
                                                        className="font-mono text-blue-700 bg-blue-50/10 cursor-help text-sm font-bold"
                                                        title={reading ? `Valor Neto Guardado: ${formatRawDose(reading.hp007)}` : undefined}
                                                    >
                                                        {reading ? formatRawDose(reading.rawHp007 ?? reading.hp007) : <span className={`text-sm font-normal ${assignment.readingDeleted ? 'text-red-400 font-medium' : 'text-slate-400 italic'}`}>{assignment.readingDeleted ? 'Eliminada' : 'Pendiente'}</span>}
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        {reading ? (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(reading.id)}>
                                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                            </Button>
                                                        ) : (
                                                            <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:bg-emerald-50" onClick={() => {
                                                                setManualEntryAssignmentId(assignment.id);
                                                                setIsManualFormOpen(true);
                                                            }}>
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
            <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p><strong>Nota:</strong> Los valores mostrados son brutos (originales del lector). Pasa el mouse sobre el valor para ver el cálculo neto (Bruto - Fondo) que aparecerá en el reporte.</p>
            </div>
        </>
    )
}
