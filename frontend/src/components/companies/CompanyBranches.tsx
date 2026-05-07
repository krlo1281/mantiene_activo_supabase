import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { getBranches, createBranch, deleteBranch } from "@/api/branches"
import type { Branch } from "@/api/branches"
import type { Company } from "@/api/companies"

interface CompanyBranchesProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company | null;
}

export default function CompanyBranches({ open, onOpenChange, company }: CompanyBranchesProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [newBranchName, setNewBranchName] = useState("");
    const [newBranchAddress, setNewBranchAddress] = useState("");

    const fetchBranches = async () => {
        if (!company) return;
        setLoading(true);
        try {
            const data = await getBranches(company.id);
            setBranches(data);
        } catch (error) {
            console.error("Failed to fetch branches:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (open && company) {
            fetchBranches();
            setNewBranchName("");
            setNewBranchAddress("");
        }
    }, [open, company])

    const handleAddBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company || !newBranchName.trim()) return;

        try {
            await createBranch(company.id, {
                name: newBranchName,
                address: newBranchAddress
            });
            setNewBranchName("");
            setNewBranchAddress("");
            fetchBranches();
        } catch (error) {
            console.error("Failed to create branch:", error);
            alert("Error al crear sede");
        }
    }

    const handleDeleteBranch = async (id: string) => {
        if (!company || !confirm("Â¿Estás seguro de eliminar esta sede? Las asignaciones vinculadas perderán la referencia a la sede.")) return;
        try {
            await deleteBranch(company.id, id);
            fetchBranches();
        } catch (error) {
            console.error("Failed to delete branch:", error);
        }
    }

    if (!company) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Sedes de {company.name}</DialogTitle>
                    <DialogDescription>
                        Administra las sedes físicas o divisiones de esta empresa.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add Branch Form */}
                    <form onSubmit={handleAddBranch} className="flex gap-4 items-end bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                        <div className="grid gap-2 flex-1">
                            <label className="text-sm font-medium">Nombre de la Sede</label>
                            <Input
                                placeholder="Ej: Sede Norte"
                                value={newBranchName}
                                onChange={e => setNewBranchName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2 flex-1">
                            <label className="text-sm font-medium">Dirección (Opcional)</label>
                            <Input
                                placeholder="Dirección de la sede"
                                value={newBranchAddress}
                                onChange={e => setNewBranchAddress(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={!newBranchName.trim()}>
                            Agregar
                        </Button>
                    </form>

                    {/* Branches List */}
                    <div className="rounded-md border max-h-[300px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10">
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Dirección</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4">Cargando sedes...</TableCell>
                                    </TableRow>
                                ) : branches.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                            No hay sedes registradas para esta empresa.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    branches.map((branch) => (
                                        <TableRow key={branch.id}>
                                            <TableCell className="font-medium">{branch.name}</TableCell>
                                            <TableCell>{branch.address || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteBranch(branch.id)}
                                                    title="Eliminar sede"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
