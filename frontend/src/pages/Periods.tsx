
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
import { Badge } from "@/components/ui/badge"
import { getPeriods, updatePeriod, deletePeriod } from "@/api/periods"
import type { Period } from "@/api/periods"
import PeriodForm from "@/components/periods/PeriodForm"

export default function Periods() {
    const [periods, setPeriods] = useState<Period[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const fetchPeriods = async () => {
        setLoading(true)
        try {
            const data = await getPeriods()
            setPeriods(data)
        } catch (error) {
            console.error("Failed to fetch periods:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPeriods()
    }, [])

    const handleCreate = () => {
        setIsFormOpen(true)
    }

    const handleFormSuccess = () => {
        fetchPeriods()
    }

    const handleToggleStatus = async (period: Period) => {
        const newStatus = period.status === 'OPEN' ? 'CLOSED' : 'OPEN'
        try {
            await updatePeriod(period.id, { status: newStatus })
            fetchPeriods()
        } catch (error) {
            console.error("Failed to update status", error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este periodo? Esto eliminará todas las asignaciones asociadas.")) return;
        try {
            await deletePeriod(id)
            fetchPeriods()
        } catch (error) {
            console.error("Failed to delete period:", error)
        }
    }

    const getMonthName = (month: number) => {
        const date = new Date();
        date.setMonth(month - 1);
        return date.toLocaleString('es-ES', { month: 'long' });
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Periodos</h2>
                    <p className="text-muted-foreground">Gestión de periodos mensuales de monitoreo.</p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Nuevo Periodo
                </Button>
            </div>

            <PeriodForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSuccess={handleFormSuccess}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Periodos</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-4">Cargando...</p>
                    ) : periods.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">date_range</span>
                            <p className="text-muted-foreground">No hay periodos registrados.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table wrapperClassName="max-h-[600px]">
                                <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead>Periodo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {periods.map((period) => (
                                        <TableRow key={period.id}>
                                            <TableCell className="font-medium capitalize text-base">
                                                {getMonthName(period.month)} {period.year}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={period.status === 'OPEN' ? 'default' : 'secondary'} className={period.status === 'OPEN' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                    {period.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right hover:text-clip">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(period)}
                                                    >
                                                        {period.status === 'OPEN' ? 'Cerrar' : 'Reabrir'}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(period.id)}>
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    )
}
