
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { getAssignments, deleteAssignment } from "@/api/assignments"
import type { Assignment } from "@/api/assignments"
import { getPeriods } from "@/api/periods"
import type { Period } from "@/api/periods"
import { getCompanies } from "@/api/companies"
import type { Company } from "@/api/companies"
import { Input } from "@/components/ui/input"
import AssignmentForm from "@/components/assignments/AssignmentForm"

import ExcelJS from 'exceljs';
import QRCode from 'qrcode';

export default function Assignments() {
    const [periods, setPeriods] = useState<Period[]>([])
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>("")
    const [companies, setCompanies] = useState<Company[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)

    // Load periods and companies on mount
    useEffect(() => {
        Promise.all([getPeriods(), getCompanies()]).then(([periodsData, companiesData]) => {
            setPeriods(periodsData)
            setCompanies(companiesData)
            if (periodsData.length > 0) {
                // Default to most recent period
                setSelectedPeriodId(periodsData[0].id)
            } else {
                setLoading(false)
            }
        }).catch((err) => {
            console.error(err)
            setLoading(false)
        })
    }, [])

    const fetchAssignments = async () => {
        setLoading(true)
        try {
            const data = await getAssignments(selectedPeriodId, undefined, selectedCompanyId, searchTerm)
            setAssignments(data)
        } catch (error) {
            console.error("Failed to fetch assignments:", error)
        } finally {
            setLoading(false)
        }
    }

    // Load assignments when filters change
    useEffect(() => {
        if (selectedPeriodId) {
            setLoading(true)
            const timer = setTimeout(() => {
                fetchAssignments()
            }, 300)
            return () => clearTimeout(timer)
        } else {
            setAssignments([])
        }
    }, [selectedPeriodId, selectedCompanyId, searchTerm])

    const handleFormSuccess = () => {
        // Refresh periods list in case a new one was created
        getPeriods().then(setPeriods).catch(console.error)
        // Refresh assignments
        fetchAssignments()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta asignación? El dosímetro quedará DISPONIBLE.")) return;
        try {
            await deleteAssignment(id)
            fetchAssignments()
        } catch (error) {
            console.error("Failed to delete assignment:", error)
        }
    }

    const selectedPeriod = periods.find(p => p.id === selectedPeriodId) || null

    const getMonthName = (month: number) => {
        const date = new Date();
        date.setMonth(month - 1);
        return date.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    }

    const handleGenerateQR = async () => {
        if (!selectedPeriod || assignments.length === 0) return;
        setGenerating(true);

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('QRs Assignments');

            worksheet.columns = [
                { header: 'INFORMACIÓN QR', key: 'info', width: 40 },
                { header: 'IMAGEN', key: 'image', width: 20 },
                { header: 'PERSONA', key: 'name', width: 30 },
                { header: 'DOSÍMETRO', key: 'code', width: 15 },
            ];

            // Style header
            worksheet.getRow(1).font = { bold: true };

            const periodName = `${getMonthName(selectedPeriod.month)} ${selectedPeriod.year}`;

            for (let i = 0; i < assignments.length; i++) {
                const assignment = assignments[i];
                const workerName = `${assignment.worker?.firstName} ${assignment.worker?.lastName}`;
                const dosimeterCode = assignment.dosimeter?.code || 'N/A';

                // Format: NAME|PERIOD|CODE
                const qrText = `${workerName}|${periodName}|${dosimeterCode}`;

                const row = worksheet.addRow({
                    info: qrText,
                    name: workerName,
                    code: dosimeterCode
                });

                // Generate QR Image (as Data URL)
                const qrDataUrl = await QRCode.toDataURL(qrText, {
                    margin: 1,
                    width: 200,
                    errorCorrectionLevel: 'L'
                });

                // Add image to workbook
                const imageId = workbook.addImage({
                    base64: qrDataUrl,
                    extension: 'png',
                });

                // Add image to "B" column (index 1) of the current row
                worksheet.addImage(imageId, {
                    tl: { col: 1, row: row.number - 1 },
                    ext: { width: 100, height: 100 }
                });

                row.height = 80; // height in points
                // Center text vertically
                row.alignment = { vertical: 'middle', wrapText: true };
            }

            // Write buffer
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Download
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `QR_ASIGNACIONES_${periodName.replace(/ /g, '_')}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error generating Excel:", error);
            alert("Hubo un error al generar el archivo Excel.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Asignaciones</h2>
                    <p className="text-muted-foreground">Gestiona la entrega de dosímetros por periodo.</p>
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

                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Todas las Empresas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas las Empresas</SelectItem>
                            {companies.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="w-[200px]">
                        <Input
                            placeholder="Buscar usuario o dosímetro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleGenerateQR}
                        disabled={generating || !selectedPeriodId || assignments.length === 0}
                        className="gap-2"
                    >
                        {generating ? (
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-sm">qr_code</span>
                        )}
                        {generating ? "Generando..." : "Generar QR"}
                    </Button>

                    <Button onClick={() => setIsFormOpen(true)} disabled={!selectedPeriodId} className="gap-2">
                        <span className="material-symbols-outlined text-sm">assignment_add</span>
                        Nueva Asignación
                    </Button>
                </div>
            </div>

            <AssignmentForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSuccess={handleFormSuccess}
                selectedPeriod={null}
            />

            <Card>
                <CardHeader>
                    <CardTitle>
                        Listado de Asignaciones
                        {selectedPeriod && <span className="ml-2 text-sm font-normal text-muted-foreground">({assignments.length} registros)</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-4">Cargando...</p>
                    ) : !selectedPeriodId ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">Selecciona un periodo para ver las asignaciones.</p>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">assignment</span>
                            <p className="text-muted-foreground">No hay asignaciones en este periodo.</p>
                        </div>
                    ) : (
                        <Table wrapperClassName="rounded-md border max-h-[600px] overflow-y-auto relative">
                            <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>DNI</TableHead>
                                    <TableHead>Dosímetro</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.map((assignment) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell className="font-medium">{assignment.worker?.firstName} {assignment.worker?.lastName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{assignment.company?.name || '-'}</TableCell>
                                        <TableCell>{assignment.worker?.dni}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">
                                                {assignment.dosimeter?.code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{assignment.dosimeter?.type}</TableCell>
                                        <TableCell className="text-right hover:text-clip">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(assignment.id)}>
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    )
}
