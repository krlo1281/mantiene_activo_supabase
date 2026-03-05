import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { getDosimeters, deleteDosimeter } from "@/api/dosimeters"
import type { Dosimeter } from "@/api/dosimeters"
import DosimeterForm from "@/components/dosimeters/DosimeterForm"
import CsvUploadDosimeters from "@/components/dosimeters/CsvUploadDosimeters"

export default function Dosimeters() {
    const [dosimeters, setDosimeters] = useState<Dosimeter[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isCsvOpen, setIsCsvOpen] = useState(false)
    const [editingDosimeter, setEditingDosimeter] = useState<Dosimeter | null>(null)

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>("ALL")
    const [searchTerm, setSearchTerm] = useState<string>("")

    const fetchDosimeters = async () => {
        setLoading(true)
        try {
            const data = await getDosimeters(filterStatus, searchTerm)
            setDosimeters(data)
        } catch (error) {
            console.error("Failed to fetch dosimeters:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDosimeters()
        }, 300)
        return () => clearTimeout(timer)
    }, [filterStatus, searchTerm])

    const handleCreate = () => {
        setEditingDosimeter(null)
        setIsFormOpen(true)
    }

    const handleEdit = (dosimeter: Dosimeter) => {
        setEditingDosimeter(dosimeter)
        setIsFormOpen(true)
    }

    const handleFormSuccess = () => {
        fetchDosimeters()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este dosímetro?")) return;
        try {
            await deleteDosimeter(id)
            fetchDosimeters() // Refresh list
        } catch (error) {
            console.error("Failed to delete dosimeter:", error)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Disponible</Badge>;
            case 'ASSIGNED': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">Asignado</Badge>;
            case 'RETIRED': return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-none">Retirado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    }

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Dosímetros</h2>
                    <p className="text-muted-foreground">Inventario de dosímetros (Película/TLD).</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={() => setIsCsvOpen(true)} className="gap-2 flex-1 md:flex-none">
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        Importar CSV
                    </Button>
                    <Button onClick={handleCreate} className="gap-2 flex-1 md:flex-none">
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Nuevo Dosímetro
                    </Button>
                </div>
            </div>

            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Buscar por código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    <SelectItem value="AVAILABLE">Disponible</SelectItem>
                                    <SelectItem value="ASSIGNED">Asignado</SelectItem>
                                    <SelectItem value="RETIRED">Retirado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DosimeterForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                dosimeterToEdit={editingDosimeter}
                onSuccess={handleFormSuccess}
            />

            <CsvUploadDosimeters
                open={isCsvOpen}
                onOpenChange={setIsCsvOpen}
                onSuccess={() => { fetchDosimeters(); setIsFormOpen(false); }}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Dosímetros</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-4">Cargando...</p>
                    ) : dosimeters.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">inbox</span>
                            <p className="text-muted-foreground">No hay dosímetros registrados.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table wrapperClassName="max-h-[600px]">
                                <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dosimeters.map((dosimeter) => (
                                        <TableRow key={dosimeter.id}>
                                            <TableCell className="font-medium">{dosimeter.code}</TableCell>
                                            <TableCell>{dosimeter.type}</TableCell>
                                            <TableCell>{getStatusBadge(dosimeter.status)}</TableCell>
                                            <TableCell className="text-right hover:text-clip">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(dosimeter)}>
                                                        <span className="material-symbols-outlined text-sm">edit</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(dosimeter.id)}>
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
