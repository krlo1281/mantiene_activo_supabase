
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
import { Input } from "@/components/ui/input"
import { getCompanies, deleteCompany } from "../api/companies"
import type { Company } from "../api/companies"
import CompanyForm from "@/components/companies/CompanyForm"

export default function Companies() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")

    const fetchCompanies = async () => {
        setLoading(true)
        try {
            const data = await getCompanies(searchTerm)
            setCompanies(data)
        } catch (error) {
            console.error("Failed to fetch companies:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCompanies()
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const handleCreate = () => {
        setEditingCompany(null)
        setIsFormOpen(true)
    }

    const handleEdit = (company: Company) => {
        setEditingCompany(company)
        setIsFormOpen(true)
    }

    const handleFormSuccess = () => {
        fetchCompanies()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta empresa?")) return;
        try {
            await deleteCompany(id)
            fetchCompanies() // Refresh list
        } catch (error) {
            console.error("Failed to delete company:", error)
        }
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Empresas</h2>
                    <p className="text-muted-foreground">Gestiona las empresas clientes del sistema.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="w-[300px]">
                        <Input
                            placeholder="Buscar por RUC o Nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCreate} className="gap-2">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Nueva Empresa
                    </Button>
                </div>
            </div>

            <CompanyForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                companyToEdit={editingCompany}
                onSuccess={handleFormSuccess}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Empresas</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-4">Cargando...</p>
                    ) : companies.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">business_off</span>
                            <p className="text-muted-foreground">No hay empresas registradas.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table wrapperClassName="max-h-[600px]">
                                <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead>RUC</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Dirección</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Teléfono</TableHead>
                                        <TableHead className="text-right">Usuarios</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies.map((company) => (
                                        <TableRow key={company.id}>
                                            <TableCell className="font-medium">{company.ruc}</TableCell>
                                            <TableCell>{company.name}</TableCell>
                                            <TableCell>{company.address || '-'}</TableCell>
                                            <TableCell>{company.email || '-'}</TableCell>
                                            <TableCell>{company.phone || '-'}</TableCell>
                                            <TableCell className="text-right">{company._count?.workers || 0}</TableCell>
                                            <TableCell className="text-right hover:text-clip">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                                                        <span className="material-symbols-outlined text-sm">edit</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(company.id)}>
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
