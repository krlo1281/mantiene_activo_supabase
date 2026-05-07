
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
import { getBranches } from "@/api/branches"
import type { Branch } from "@/api/branches"

export default function Reports() {
    const [periods, setPeriods] = useState<Period[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [dosimeters, setDosimeters] = useState<Dosimeter[]>([])

    // Filters
    const [selectedPeriod, setSelectedPeriod] = useState<string>("")
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
    const [selectedBranch, setSelectedBranch] = useState<string>("ALL")
    const [selectedDosimeter, setSelectedDosimeter] = useState<string>("ALL")
    const [branches, setBranches] = useState<Branch[]>([])
    const [showOnlyPendingHistory, setShowOnlyPendingHistory] = useState(false)
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)

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

    // Load Branches when exactly one company is selected
    useEffect(() => {
        if (selectedCompanies.length === 1) {
            getBranches(selectedCompanies[0])
                .then(setBranches)
                .catch(console.error)
        } else {
            setBranches([])
            setSelectedBranch("ALL")
        }
    }, [selectedCompanies])

    // Load Report Data when filters change
    useEffect(() => {
        if (reportType === 'MONTHLY' && !selectedPeriod) {
            return;
        }

        const fetchData = async () => {
            setLoading(true)
            try {
                if (reportType === 'MONTHLY') {
                    const data = await getMonthlyReport(selectedPeriod, selectedCompanies, selectedBranch)
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
    }, [reportType, selectedPeriod, selectedCompanies, selectedDosimeter, selectedBranch])


    const translateStatus = (status: string) => {
        switch (status) {
            case 'READ': return 'Leído';
            case 'ASSIGNED': return 'Asignado';
            case 'RETURNED': return 'Devuelto';
            case 'PENDING': return 'Pendiente';
            default: return status;
        }
    }

    const getMonthName = (month: number) => {
        const date = new Date(2000, month - 1, 1);
        return date.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    }

    const formatDose = (value: number | string | null | undefined) => {
        if (value === null || value === undefined) return "Pendiente";
        const num = Number(value);
        if (isNaN(num)) return "0.0000";
        return num.toFixed(4);
    }

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedHistoryData = () => {
        let sortableItems = [...historyData].filter(row => showOnlyPendingHistory ? row.status !== 'READ' : true);
        if (sortConfig !== null) {
            sortableItems.sort((a: any, b: any) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Special case for period which is MM/YYYY string
                if (sortConfig.key === 'period') {
                    const [aM, aY] = aValue.split('/');
                    const [bM, bY] = bValue.split('/');
                    aValue = new Date(parseInt(aY), parseInt(aM) - 1).getTime();
                    bValue = new Date(parseInt(bY), parseInt(bM) - 1).getTime();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    };

    const sortedHistoryData = getSortedHistoryData();

    const getPeriodLabel = (id: string) => {
        const p = periods.find(p => p.id === id)
        if (!p) return id
        const mName = getMonthName(p.month)
        return `${mName.charAt(0).toUpperCase() + mName.slice(1)} ${p.year}`
    }

    const formatDoseForPDF = (value: number | string | null | undefined) => {
        if (value === null || value === undefined) return "Pendiente";
        const num = Number(value);
        if (isNaN(num)) return "0.0000";
        if (num < 0) return "0.0000"; // Regla de PDF: negativos se muestran como cero
        return num.toFixed(4);
    }

    const handleExportPDF = () => {
        if (!selectedPeriod) return;

        // Prepare data
        // For now, we only support Monthly Report export (which is what the user asked for)
        // If they want History export, we can add it later.

        // Filtered data is what we want to print
        const rows = monthlyData
            .filter(item => item.status === 'READ') // Filtrar solo los que tienen lecturas
            .map(item => ({
            workerName: item.workerName,
            documentType: item.documentType,
            documentNumber: item.documentNumber,
            dosimeterCode: item.dosimeterCode,
            branchName: item.branchName,
            hp10: formatDoseForPDF(item.hp10),
            hp007: formatDoseForPDF(item.hp007),
            accumulatedHp10: item.accumulatedHp10,
            accumulatedHp007: item.accumulatedHp007,
            accumulatedMonths: item.accumulatedMonths,
            notes: '' // Ya no habrá pendientes
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

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Reportes</h2>
                    <p className="text-sm md:text-base text-muted-foreground">Generación y exportación de datos del sistema.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full md:w-auto">
                        <button
                            onClick={() => setReportType('MONTHLY')}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'MONTHLY'
                                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-50'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setReportType('HISTORY')}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'HISTORY'
                                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-50'
                                }`}
                        >
                            Historial
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6 items-stretch sm:items-center">
                {reportType === 'MONTHLY' && (
                    <div className="flex-1 min-w-[200px] max-w-full sm:max-w-[300px]">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger className="w-full">
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

                <div className="flex-1 min-w-[250px] max-w-full sm:max-w-[400px]">
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

                {reportType === 'MONTHLY' && selectedCompanies.length === 1 && branches.length > 0 && (
                    <div className="flex-1 min-w-[200px] max-w-full sm:max-w-[300px]">
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Todas las Sedes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas las Sedes</SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}


                {reportType === 'HISTORY' && (
                    <>
                        <div className="flex-1 min-w-[200px] max-w-full sm:max-w-[300px]">
                            <Select value={selectedDosimeter} onValueChange={setSelectedDosimeter}>
                                <SelectTrigger className="w-full">
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
                        <div className="flex gap-2 w-full sm:w-auto items-center">
                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={showOnlyPendingHistory}
                                    onChange={(e) => setShowOnlyPendingHistory(e.target.checked)}
                                />
                                Solo pendientes
                            </label>
                        </div>
                    </>
                )}

                <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto">
                    {reportType === 'MONTHLY' && (
                        <Button
                            onClick={handleExportPDF}
                            disabled={monthlyData.length === 0}
                            variant="outline"
                            className="gap-2 flex-1 sm:flex-none"
                        >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            PDF
                        </Button>
                    )}
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
                                    <div className="rounded-md border overflow-x-auto w-full">
                                        <div className="min-w-[800px]">
                                            <Table wrapperClassName="max-h-[600px]">
                                                <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                                    <TableRow>
                                                        <TableHead>Usuario</TableHead>
                                                        <TableHead>Documento</TableHead>
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
                                                            <TableCell>{row.documentType}: {row.documentNumber}</TableCell>
                                                            <TableCell>{row.company}</TableCell>
                                                            <TableCell>{row.dosimeterCode}</TableCell>
                                                            <TableCell>{formatDose(row.hp10)}</TableCell>
                                                            <TableCell>{formatDose(row.hp007)}</TableCell>
                                                            <TableCell>
                                                                {row.status === 'READ'
                                                                    ? <Badge className="bg-green-100 text-green-800 border-none">{translateStatus('READ')}</Badge>
                                                                    : <Badge className="bg-blue-100 text-blue-800 border-none">{translateStatus('ASSIGNED')}</Badge>
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )
                            ) : (
                                // HISTORY TABLE
                                historyData.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground">No hay historial de asignaciones.</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border overflow-x-auto w-full">
                                        <div className="min-w-[900px]">
                                            <Table wrapperClassName="max-h-[600px]">
                                                <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                                    <TableRow>
                                                        <TableHead className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 select-none" onClick={() => requestSort('dosimeterCode')}>
                                                            Dosímetro {sortConfig?.key === 'dosimeterCode' ? (sortConfig.direction === 'asc' ? 'â†‘' : 'â†“') : ''}
                                                        </TableHead>
                                                        <TableHead className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 select-none" onClick={() => requestSort('period')}>
                                                            Periodo {sortConfig?.key === 'period' ? (sortConfig.direction === 'asc' ? 'â†‘' : 'â†“') : ''}
                                                        </TableHead>
                                                        <TableHead className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 select-none" onClick={() => requestSort('workerName')}>
                                                            Asignado a (Usuario) {sortConfig?.key === 'workerName' ? (sortConfig.direction === 'asc' ? 'â†‘' : 'â†“') : ''}
                                                        </TableHead>
                                                        <TableHead className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 select-none" onClick={() => requestSort('documentNumber')}>
                                                            Documento {sortConfig?.key === 'documentNumber' ? (sortConfig.direction === 'asc' ? 'â†‘' : 'â†“') : ''}
                                                        </TableHead>
                                                        <TableHead className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 select-none" onClick={() => requestSort('company')}>
                                                            Empresa {sortConfig?.key === 'company' ? (sortConfig.direction === 'asc' ? 'â†‘' : 'â†“') : ''}
                                                        </TableHead>
                                                        <TableHead className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 select-none" onClick={() => requestSort('status')}>
                                                            Estado {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? 'â†‘' : 'â†“') : ''}
                                                        </TableHead>
                                                        <TableHead className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 select-none" onClick={() => requestSort('readingValue')}>
                                                            Lectura {sortConfig?.key === 'readingValue' ? (sortConfig.direction === 'asc' ? 'â†‘' : 'â†“') : ''}
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {sortedHistoryData.map((row) => (
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
                                                            <TableCell>{row.documentType}: {row.documentNumber}</TableCell>
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
