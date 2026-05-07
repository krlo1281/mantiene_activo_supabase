
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
import CompanyBranches from "@/components/companies/CompanyBranches"
import CompanyAccess from "@/components/companies/CompanyAccess"
import { Badge } from "@/components/ui/badge"
import { triggerPartialSync } from "@/api/sync"

export default function Companies() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isBranchesOpen, setIsBranchesOpen] = useState(false)
    const [isAccessOpen, setIsAccessOpen] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)
    const [selectedCompanyForBranches, setSelectedCompanyForBranches] = useState<Company | null>(null)
    const [selectedCompanyForAccess, setSelectedCompanyForAccess] = useState<Company | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [partialSyncLoading, setPartialSyncLoading] = useState(false)
    const [partialSyncMsg, setPartialSyncMsg] = useState("")

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
        if (!confirm("Â¿Estás seguro de eliminar esta empresa?")) return;
        try {
            await deleteCompany(id)
            fetchCompanies() // Refresh list
        } catch (error) {
            console.error("Failed to delete company:", error)
        }
    }

    const handleManageBranches = (company: Company) => {
        setSelectedCompanyForBranches(company)
        setIsBranchesOpen(true)
    }

    const handleManageAccess = (company: Company) => {
        setSelectedCompanyForAccess(company)
        setIsAccessOpen(true)
    }

    const handlePartialSync = async () => {
        setPartialSyncLoading(true)
        setPartialSyncMsg("")
        try {
            const res = await triggerPartialSync()
            setPartialSyncMsg(res.message || "Â¡Sincronización rápida iniciada!")
            setTimeout(() => setPartialSyncMsg(""), 3000)
        } catch (error: any) {
            console.error("Error triggering partial sync:", error)
            setPartialSyncMsg("Error al iniciar sincronización")
            setTimeout(() => setPartialSyncMsg(""), 3000)
        } finally {
            setPartialSyncLoading(false)
        }
    }

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Empresas</h2>
                    <p className="text-sm md:text-base text-muted-foreground">Gestiona las empresas clientes del sistema.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full md:w-auto">
                    <div className="w-full sm:w-[300px]">
                        <Input
                            placeholder="Buscar por RUC o Nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {partialSyncMsg && <span className="text-blue-600 text-sm font-medium animate-pulse whitespace-nowrap text-center sm:hidden md:block py-1">{partialSyncMsg}</span>}
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Button variant="outline" onClick={handlePartialSync} disabled={partialSyncLoading} className="flex-1 sm:flex-none gap-2" title="Sincronizar información de empresas y sedes">
                            <span className="material-symbols-outlined text-sm">cloud_sync</span>
                            <span className="hidden sm:inline">{partialSyncLoading ? "Iniciando..." : "Sync"}</span>
                        </Button>
                        <Button onClick={handleCreate} className="flex-1 sm:flex-none gap-2">
                            <span className="material-symbols-outlined text-sm">add</span>
                            Nuevo
                        </Button>
                    </div>
                </div>
            </div>

            <CompanyForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                companyToEdit={editingCompany}
                onSuccess={handleFormSuccess}
            />

            <CompanyBranches
                open={isBranchesOpen}
                onOpenChange={setIsBranchesOpen}
                company={selectedCompanyForBranches}
            />

            <CompanyAccess
                open={isAccessOpen}
                onOpenChange={setIsAccessOpen}
                company={selectedCompanyForAccess}
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
                        <div className="rounded-md border overflow-x-auto w-full">
                            <div className="min-w-[800px]">
                                <Table wrapperClassName="max-h-[600px]">
                                    <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                                        <TableRow>
                                            <TableHead>RUC</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Dirección</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Teléfono</TableHead>
                                            <TableHead>Portal</TableHead>
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
                                                <TableCell>
                                                    {company.portalStatus === 'ACTIVO' && <Badge className="bg-green-100 text-green-800 border-none">Activo</Badge>}
                                                    {company.portalStatus === 'SUSPENDIDO' && <Badge variant="destructive">Suspendido</Badge>}
                                                    {(!company.portalStatus || company.portalStatus === 'INACTIVO') && <Badge variant="secondary">Inactivo</Badge>}
                                                </TableCell>
                                                <TableCell className="text-right">{company._count?.workers || 0}</TableCell>
                                                <TableCell className="text-right hover:text-clip">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => handleManageAccess(company)} title="Accesos al Portal">
                                                            <span className="material-symbols-outlined text-sm">key</span>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleManageBranches(company)} title="Gestionar Sedes">
                                                            <span className="material-symbols-outlined text-sm">apartment</span>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(company)} title="Editar Empresa">
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(company.id)} title="Eliminar Empresa">
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    )
}
