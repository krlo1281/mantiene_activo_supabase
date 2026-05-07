
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
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
import { createWorker, updateWorker } from "@/api/workers"
import type { Worker, WorkerInput } from "@/api/workers"
import { getCompanies } from "@/api/companies"
import type { Company } from "@/api/companies"

interface WorkerFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workerToEdit?: Worker | null
    onSuccess: () => void
}

export default function WorkerForm({ open, onOpenChange, workerToEdit, onSuccess }: WorkerFormProps) {
    const [formData, setFormData] = useState<WorkerInput>({
        documentType: "DNI",
        documentNumber: "",
        firstName: "",
        lastName: "",
        companyId: "",
    })
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Fetch companies for dropdown
        getCompanies().then(setCompanies).catch(console.error)
    }, [])

    useEffect(() => {
        if (workerToEdit) {
            setFormData({
                documentType: workerToEdit.documentType || "DNI",
                documentNumber: workerToEdit.documentNumber,
                firstName: workerToEdit.firstName,
                lastName: workerToEdit.lastName,
                companyId: workerToEdit.companies?.[0]?.id || "",
            })
        } else {
            setFormData({ documentType: "DNI", documentNumber: "", firstName: "", lastName: "", companyId: "" })
        }
    }, [workerToEdit, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (workerToEdit) {
                await updateWorker(workerToEdit.id, formData)
            } else {
                await createWorker(formData)
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Error saving worker:", error)
            alert("Error al guardar usuario. Verifique que el documento de identidad no esté duplicado.")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleCompanyChange = (value: string) => {
        setFormData({ ...formData, companyId: value })
    }

    const handleDocumentTypeChange = (value: string) => {
        setFormData({ ...formData, documentType: value })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{workerToEdit ? "Editar Usuario" : "Nuevo Usuario"}</SheetTitle>
                    <SheetDescription>
                        {workerToEdit ? "Modifica los datos del usuario." : "Registra un nuevo usuario asignado a una empresa."}
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="companyId">Empresa *</Label>
                        <Select onValueChange={handleCompanyChange} value={formData.companyId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione una empresa" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="documentType">Tipo de Documento *</Label>
                        <Select onValueChange={handleDocumentTypeChange} value={formData.documentType} disabled={!!workerToEdit}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DNI">DNI</SelectItem>
                                <SelectItem value="CE">CE</SelectItem>
                                <SelectItem value="RUC">RUC</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="documentNumber">Número de Documento *</Label>
                        <Input id="documentNumber" name="documentNumber" value={formData.documentNumber} onChange={handleChange} required disabled={!!workerToEdit} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">Nombres *</Label>
                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Apellidos *</Label>
                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                    <SheetFooter>
                        <SheetClose asChild>
                            <Button variant="outline" type="button">Cancelar</Button>
                        </SheetClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
