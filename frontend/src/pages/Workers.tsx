
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
import { getWorkers, deleteWorker } from "@/api/workers"
import type { Worker } from "@/api/workers"
import { getCompanies } from "@/api/companies"
import type { Company } from "@/api/companies"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import WorkerForm from "@/components/workers/WorkerForm"

export default function Workers() {
    const navigate = useNavigate()
    const [workers, setWorkers] = useState<Worker[]>([])
    const [loading, setLoading] = useState(true)
    const [companies, setCompanies] = useState<Company[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null)

    const fetchWorkers = async () => {
        setLoading(true)
        try {
            const data = await getWorkers(selectedCompanyId, searchTerm)
            setWorkers(data)
        } catch (error) {
            console.error("Failed to fetch workers:", error)
        } finally {
            setLoading(false)
        }
    }

    // Load initial data (solamente catálogos, el debounce se encarga de la tabla)
    useEffect(() => {
        getCompanies().then(setCompanies).catch(console.error)
    }, [])

    // Debounce search/filter
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWorkers()
        }, 300)
        return () => clearTimeout(timer)
    }, [selectedCompanyId, searchTerm])

    const handleCreate = () => {
        setEditingWorker(null)
        setIsFormOpen(true)
    }

    const handleEdit = (worker: Worker) => {
        setEditingWorker(worker)
        setIsFormOpen(true)
    }

    const handleFormSuccess = () => {
        fetchWorkers()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
        try {
            await deleteWorker(id)
            fetchWorkers() // Refresh list
        } catch (error) {
            console.error("Failed to delete worker:", error)
        }
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Usuarios</h2>
                    <p className="text-muted-foreground">Gestión de personal asignado a dosimetría.</p>
                </div>

                <div className="flex gap-4 items-center">
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
                            placeholder="Buscar por DNI o Nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button onClick={handleCreate} className="gap-2">
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Nuevo Usuario
                    </Button>
                </div>
            </div>

            <WorkerForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                workerToEdit={editingWorker}
                onSuccess={handleFormSuccess}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-4">Cargando...</p>
                    ) : workers.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">person_off</span>
                            <p className="text-muted-foreground">No hay usuarios registrados.</p>
                        </div>
                    ) : (
                        <Table wrapperClassName="rounded-md border max-h-[600px] overflow-y-auto relative">
                            <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead>DNI</TableHead>
                                    <TableHead>Nombre Completo</TableHead>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workers.map((worker) => (
                                    <TableRow key={worker.id}>
                                        <TableCell className="font-medium">{worker.dni}</TableCell>
                                        <TableCell>{worker.firstName} {worker.lastName}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {worker.companies?.length > 0 ? (
                                                    worker.companies.map(comp => (
                                                        <div key={comp.id} className="flex flex-col">
                                                            <span className="font-medium">{comp.name}</span>
                                                            <span className="text-xs text-muted-foreground">RUC: {comp.ruc}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground italic">Sin empresa</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right hover:text-clip">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/workers/${worker.id}`)} title="Ver Historial">
                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(worker)}>
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(worker.id)}>
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
