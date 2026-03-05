
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
import { createCompany, updateCompany } from "@/api/companies"
import type { Company, CompanyInput } from "@/api/companies"

interface CompanyFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    companyToEdit?: Company | null
    onSuccess: () => void
}

export default function CompanyForm({ open, onOpenChange, companyToEdit, onSuccess }: CompanyFormProps) {
    const [formData, setFormData] = useState<CompanyInput>({
        ruc: "",
        name: "",
        address: "",
        phone: "",
        email: "",
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (companyToEdit) {
            setFormData({
                ruc: companyToEdit.ruc,
                name: companyToEdit.name,
                address: companyToEdit.address || "",
                phone: companyToEdit.phone || "",
                email: companyToEdit.email || "",
            })
        } else {
            setFormData({ ruc: "", name: "", address: "", phone: "", email: "" })
        }
    }, [companyToEdit, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (companyToEdit) {
                await updateCompany(companyToEdit.id, formData)
            } else {
                await createCompany(formData)
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Error saving company:", error)
            alert("Error al guardar la empresa. Revisa la consola.")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{companyToEdit ? "Editar Empresa" : "Nueva Empresa"}</SheetTitle>
                    <SheetDescription>
                        {companyToEdit ? "Modifica los datos de la empresa." : "Ingresa los datos para registrar un nuevo cliente."}
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="ruc">RUC</Label>
                        <Input id="ruc" name="ruc" value={formData.ruc} onChange={handleChange} disabled={!!companyToEdit} placeholder="Opcional" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Razón Social *</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email de Contacto</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
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
