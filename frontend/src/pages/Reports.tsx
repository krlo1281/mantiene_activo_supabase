
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { getPeriods } from "@/api/periods"
import type { Period } from "@/api/periods"
import { getCompanies } from "@/api/companies"
import type { Company } from "@/api/companies"
import { getDosimeters } from "@/api/dosimeters"
import type { Dosimeter } from "@/api/dosimeters"
import { getMonthlyReport, getAssignmentHistory } from "@/api/reports"
import type { MonthlyReportItem, AssignmentHistoryItem } from "@/api/reports"
import { MultiSelect } from "@/components/ui/multi-select-custom"

export default function Reports() {
    const [periods, setPeriods] = useState<Period[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [dosimeters, setDosimeters] = useState<Dosimeter[]>([])

    // Filters
    const [selectedPeriod, setSelectedPeriod] = useState<string>("")
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
    const [selectedDosimeter, setSelectedDosimeter] = useState<string>("ALL")

    // Report Type State
    const [reportType, setReportType] = useState<'MONTHLY' | 'HISTORY'>('MONTHLY')

    // Data States
    const [monthlyData, setMonthlyData] = useState<MonthlyReportItem[]>([])
    const [historyData, setHistoryData] = useState<AssignmentHistoryItem[]>([])
    const [loading, setLoading] = useState(true)

    // Load initial data (Periods, Companies, Dosimeters)
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [periodsData, companiesData, dosimetersData] = await Promise.all([
                    getPeriods(),
                    getCompanies(),
                    getDosimeters()
                ])
                setPeriods(periodsData)
                setCompanies(companiesData)
                setDosimeters(dosimetersData.sort((a, b) => a.code.localeCompare(b.code)))

                if (periodsData.length > 0) {
                    setSelectedPeriod(periodsData[0].id)
                } else {
                    setTimeout(() => setLoading(false), 300)
                }
            } catch (error) {
                console.error("Failed to load metadata", error)
                setTimeout(() => setLoading(false), 300)
            }
        }
        loadMetadata()
    }, [])

    // Load Report Data when filters change
    useEffect(() => {
        if (reportType === 'MONTHLY' && !selectedPeriod) {
            return;
        }

        const fetchData = async () => {
            setLoading(true)
            try {
                if (reportType === 'MONTHLY') {
                    const data = await getMonthlyReport(selectedPeriod, selectedCompanies)
                    setMonthlyData(data)
                } else {
                    // HISTORY report
                    const companyIdParam = selectedCompanies.length > 0 ? selectedCompanies[0] : "ALL"
                    const data = await getAssignmentHistory(companyIdParam, selectedDosimeter)
                    setHistoryData(data)
                }
            } catch (error) {
                console.error("Failed to load report data", error)
            } finally {
                setTimeout(() => setLoading(false), 300)
            }
        }

        fetchData()
    }, [reportType, selectedPeriod, selectedCompanies, selectedDosimeter])


    const translateStatus = (status: string) => {
        switch (status) {
            case 'READ': return 'Leído';
            case 'PENDING': return 'Pendiente';
            case 'ASSIGNED': return 'Asignado';
            case 'RETURNED': return 'Devuelto';
            default: return status;
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

    const handleExport = () => {
        if (reportType === 'MONTHLY') {
            if (monthlyData.length === 0) return;
            const headers = ["Usuario", "DNI", "Empresa", "Dosimetro", "Hp(10)", "Hp(0.07)", "Estado"]
            const csvContent = [
                headers.join(","),
                ...monthlyData.map(row => [
                    `"${row.workerName}"`,
                    row.dni,
                    `"${row.company}"`,
                    row.dosimeterCode,
                    formatDose(row.hp10),
                    formatDose(row.hp007),
                    translateStatus(row.status)
                ].join(","))
            ].join("\n")
            downloadCSV(csvContent, `reporte_mensual_${new Date().toISOString().split('T')[0]}.csv`)
        } else {
            if (historyData.length === 0) return;
            const headers = ["Dosimetro", "Periodo", "Usuario", "DNI", "Empresa", "Estado", "Lectura"]
            const csvContent = [
                headers.join(","),
                ...historyData.map(row => [
                    row.dosimeterCode,
                    row.period,
                    `"${row.workerName}"`,
                    row.dni,
                    `"${row.company}"`,
                    translateStatus(row.status),
                    `"${row.readingValue}"`
                ].join(","))
            ].join("\n")
            downloadCSV(csvContent, `historial_asignaciones_${new Date().toISOString().split('T')[0]}.csv`)
        }
    }

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const getPeriodLabel = (id: string) => {
        const p = periods.find(p => p.id === id)
        if (!p) return id
        const mName = getMonthName(p.month)
        return `${mName.charAt(0).toUpperCase() + mName.slice(1)} ${p.year}`
    }

    const handleExportPDF = () => {
        if (!selectedPeriod) return;

        // Prepare data
        // For now, we only support Monthly Report export (which is what the user asked for)
        // If they want History export, we can add it later.

        // Filtered data is what we want to print
        const rows = monthlyData.map(item => ({
            workerName: item.workerName,
            dni: item.dni,
            dosimeterCode: item.dosimeterCode,
            hp10: formatDose(item.hp10),
            hp007: formatDose(item.hp007),
            accumulatedHp10: item.accumulatedHp10,
            accumulatedHp007: item.accumulatedHp007,
            accumulatedMonths: item.accumulatedMonths,
            notes: item.status === 'PENDING' ? 'Pendiente' : '' // Add logic for specific notes if needed
        }));

        // We need company name. In the Monthly Report view, we have a list of items which might belong to different companies 
        // IF the user selected "ALL". If they selected a specific company, we can use that name.
        // Let's find the company name from the first item if specific company is not available in state easily (we have selectedCompanyId but not name directly unless we search).
        let companyName = "Varias Empresas";
        if (selectedCompanies.length === 0) {
            companyName = "Todas las Empresas";
        } else if (selectedCompanies.length === 1) {
            companyName = companies.find(c => c.id === selectedCompanies[0])?.name || "Empresa Desconocida";
        } else {
            // Join all selected company names
            const names = selectedCompanies.map(id => companies.find(c => c.id === id)?.name).filter(Boolean);
            companyName = names.join(", ");
        }

        const periodObj = periods.find(p => p.id === selectedPeriod);
        if (!periodObj) {
            console.error("Selected period not found for PDF export.");
            return;
        }

        import("../utils/pdfGenerator").then(mod => {
            mod.generateMonthlyReportDict({
                period: `${getMonthName(periodObj.month)} ${periodObj.year}`,
                companyName: companyName,
                rows: rows
            });
        });
    };

    const handleStructurePreview = () => {
        import("../utils/pdfGenerator").then(mod => {
            mod.generateStructurePreview();
        });
    }

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Reportes</h2>
                    <p className="text-muted-foreground">Generación y exportación de datos del sistema.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                            onClick={() => setReportType('MONTHLY')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'MONTHLY'
                                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-50'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setReportType('HISTORY')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'HISTORY'
                                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-50'
                                }`}
                        >
                            Historial
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 items-center">
                {reportType === 'MONTHLY' && (
                    <div className="w-[300px]">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar Periodo" />
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map((period) => (
                                    <SelectItem key={period.id} value={period.id}>
                                        {getMonthName(period.month).charAt(0).toUpperCase() + getMonthName(period.month).slice(1)} {period.year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="w-[300px]">
                    {reportType === 'MONTHLY' ? (
                        <MultiSelect
                            options={companies.map(c => ({ label: c.name, value: c.id }))}
                            selected={selectedCompanies}
                            onChange={setSelectedCompanies}
                            placeholder="Todas las Empresas"
                        />
                    ) : (
                        <Select
                            value={selectedCompanies.length > 0 ? selectedCompanies[0] : "ALL"}
                            onValueChange={(val) => setSelectedCompanies(val === "ALL" ? [] : [val])}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas las Empresas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas las Empresas</SelectItem>
                                {companies.map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                        {company.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>


                {reportType === 'HISTORY' && (
                    <div className="w-[200px]">
                        <Select value={selectedDosimeter} onValueChange={setSelectedDosimeter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los Dosímetros" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los Dosímetros</SelectItem>
                                {dosimeters.map((dosimeter) => (
                                    <SelectItem key={dosimeter.id} value={dosimeter.id}>
                                        {dosimeter.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="ml-auto flex gap-2">
                    <Button
                        onClick={handleStructurePreview}
                        variant="ghost"
                        className="gap-2 text-muted-foreground"
                    >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Ver Estructura
                    </Button>
                    {reportType === 'MONTHLY' && (
                        <Button
                            onClick={handleExportPDF}
                            disabled={monthlyData.length === 0}
                            variant="outline"
                            className="gap-2 mr-2"
                        >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            Exportar PDF
                        </Button>
                    )}
                    <Button
                        onClick={handleExport}
                        disabled={(reportType === 'MONTHLY' && monthlyData.length === 0) || (reportType === 'HISTORY' && historyData.length === 0)}
                        variant="outline"
                        className="gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Exportar CSV
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {reportType === 'MONTHLY'
                            ? `Reporte de Dosis: ${getPeriodLabel(selectedPeriod)}`
                            : "Historial de Asignaciones"
                        }
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-4">Cargando datos...</p>
                    ) : (
                        <>
                            {reportType === 'MONTHLY' ? (
                                monthlyData.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground">No hay datos para mostrar en este criterio.</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table wrapperClassName="max-h-[600px]">
                                            <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead>Usuario</TableHead>
                                                    <TableHead>DNI</TableHead>
                                                    <TableHead>Empresa</TableHead>
                                                    <TableHead>Dosímetro</TableHead>
                                                    <TableHead>Hp(10)</TableHead>
                                                    <TableHead>Hp(0.07)</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {monthlyData.map((row) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="font-medium">{row.workerName}</TableCell>
                                                        <TableCell>{row.dni}</TableCell>
                                                        <TableCell>{row.company}</TableCell>
                                                        <TableCell>{row.dosimeterCode}</TableCell>
                                                        <TableCell>{formatDose(row.hp10)}</TableCell>
                                                        <TableCell>{formatDose(row.hp007)}</TableCell>
                                                        <TableCell>
                                                            {row.status === 'READ'
                                                                ? <Badge className="bg-green-100 text-green-800 border-none">{translateStatus('READ')}</Badge>
                                                                : <Badge variant="secondary">{translateStatus('PENDING')}</Badge>
                                                            }
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )
                            ) : (
                                // HISTORY TABLE
                                historyData.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground">No hay historial de asignaciones.</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table wrapperClassName="max-h-[600px]">
                                            <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead>Dosímetro</TableHead>
                                                    <TableHead>Periodo</TableHead>
                                                    <TableHead>Asignado a (Usuario)</TableHead>
                                                    <TableHead>DNI</TableHead>
                                                    <TableHead>Empresa</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead>Lectura</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {historyData.map((row) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell>{row.dosimeterCode}</TableCell>
                                                        <TableCell>
                                                            {(() => {
                                                                const [m, y] = row.period.split('/');
                                                                const mName = getMonthName(parseInt(m));
                                                                return `${mName.charAt(0).toUpperCase() + mName.slice(1)} ${y}`;
                                                            })()}
                                                        </TableCell>
                                                        <TableCell className="font-medium">{row.workerName}</TableCell>
                                                        <TableCell>{row.dni}</TableCell>
                                                        <TableCell>{row.company}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{translateStatus(row.status)}</Badge>
                                                        </TableCell>
                                                        <TableCell>{row.readingValue}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </>
    )
}
