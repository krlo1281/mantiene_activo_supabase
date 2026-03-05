
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createAssignment } from "@/api/assignments"
import { getWorkers } from "@/api/workers"
import type { Worker } from "@/api/workers"
import { getDosimeters } from "@/api/dosimeters"
import type { Dosimeter } from "@/api/dosimeters"
import { getCompanies } from "@/api/companies"
import type { Company } from "@/api/companies"
import type { Period } from "@/api/periods"

interface AssignmentFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    selectedPeriod: Period | null
}

export default function AssignmentForm({ open, onOpenChange, onSuccess, selectedPeriod }: AssignmentFormProps) {
    const [workers, setWorkers] = useState<Worker[]>([])
    const [dosimeters, setDosimeters] = useState<Dosimeter[]>([])
    const [companies, setCompanies] = useState<Company[]>([])

    const [workerId, setWorkerId] = useState<string>("")
    const [dosimeterId, setDosimeterId] = useState<string>("")
    const [companyId, setCompanyId] = useState<string>("")

    // Date selection state
    const [monthName, setMonthName] = useState<string>("")
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())

    const [loading, setLoading] = useState(false)

    const MONTHS = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
        if (open) {
            // Load data when form opens
            const loadData = async () => {
                try {
                    const [workersData, dosimetersData, companiesData] = await Promise.all([
                        getWorkers(),
                        getDosimeters(),
                        getCompanies()
                    ])
                    setWorkers(workersData)
                    setDosimeters(dosimetersData.filter(d => d.status === 'AVAILABLE'))
                    setCompanies(companiesData)
                } catch (error) {
                    console.error("Error loading form data", error)
                }
            }
            loadData()

            // Pre-fill date if selectedPeriod exists
            if (selectedPeriod) {
                const date = new Date();
                date.setMonth(selectedPeriod.month - 1);
                const name = date.toLocaleString('es-ES', { month: 'long' });
                // Capitalize
                setMonthName(name.charAt(0).toUpperCase() + name.slice(1));
                setYear(selectedPeriod.year.toString())
            } else {
                // Default to current date
                const now = new Date();
                const name = now.toLocaleString('es-ES', { month: 'long' });
                setMonthName(name.charAt(0).toUpperCase() + name.slice(1));
                setYear(now.getFullYear().toString());
            }
        }
    }, [open, selectedPeriod])

    const handleWorkerChange = (value: string) => {
        setWorkerId(value);
        // Auto-select company if worker has only one
        const selectedWorker = workers.find(w => w.id === value);
        if (selectedWorker && selectedWorker.companies && selectedWorker.companies.length === 1) {
            setCompanyId(selectedWorker.companies[0].id);
        } else {
            setCompanyId(""); // Reset if multiple or none, force manual select
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)
        try {
            const payload: any = {
                workerId,
                dosimeterId,
                companyId
            }

            if (selectedPeriod) {
                payload.periodId = selectedPeriod.id;
            } else {
                payload.monthName = monthName;
                payload.year = year;
            }

            await createAssignment(payload)
            onSuccess()
            onOpenChange(false)
            // Reset form
            setWorkerId("")
            setDosimeterId("")
            setCompanyId("")
        } catch (error: any) {
            console.error("Error creating assignment:", error)
            alert(error.response?.data?.message || "Error al asignar dosímetro")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Asignar Dosímetro</SheetTitle>
                    <SheetDescription>
                        {selectedPeriod
                            ? `Asignando para periodo: ${selectedPeriod.month}/${selectedPeriod.year}`
                            : "Seleccione el periodo para la asignación (se creará si no existe)."}
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                    {/* Period Selection (Always visible if no pre-selected period) */}
                    {!selectedPeriod && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="month">Mes</Label>
                                <Select onValueChange={setMonthName} value={monthName}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione mes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="year">Año</Label>
                                <Select onValueChange={setYear} value={year}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Año" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(() => {
                                            const min = parseInt(localStorage.getItem("system_min_year") || "2022");
                                            const max = parseInt(localStorage.getItem("system_max_year") || "2030");
                                            const length = max - min + 1;
                                            return Array.from({ length }, (_, i) => min + i).map((y) => (
                                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                            ));
                                        })()}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="worker">Usuario</Label>
                        <Select onValueChange={handleWorkerChange} value={workerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione usuario" />
                            </SelectTrigger>
                            <SelectContent>
                                {workers.map((w) => (
                                    <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName} ({w.dni})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Select onValueChange={setCompanyId} value={companyId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione empresa" />
                            </SelectTrigger>
                            <SelectContent>
                                {(() => {
                                    // Filter companies valid for the selected worker?
                                    // Or show all?
                                    // Robust approach: Show all, but maybe highlight?
                                    // User vibe: simpler. If worker selected, show THEIR companies.
                                    const selectedWorker = workers.find(w => w.id === workerId);
                                    const validCompanies = selectedWorker && selectedWorker.companies?.length > 0
                                        ? selectedWorker.companies
                                        : companies;

                                    // If no worker selected, validCompanies = all companies.
                                    return validCompanies.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ));
                                })()}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="dosimeter">Dosímetro (Disponibles)</Label>
                        <Select onValueChange={setDosimeterId} value={dosimeterId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione dosímetro" />
                            </SelectTrigger>
                            <SelectContent>
                                {dosimeters.length === 0 ? (
                                    <SelectItem value="none" disabled>No hay dosímetros disponibles</SelectItem>
                                ) : (
                                    dosimeters.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>{d.code} ({d.type})</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !workerId || !dosimeterId || !companyId || (!selectedPeriod && (!monthName || !year))}>
                            {loading ? "Asignando..." : "Asignar"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}
