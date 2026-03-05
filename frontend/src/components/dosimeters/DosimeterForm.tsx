
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
import { createDosimeter, updateDosimeter } from "@/api/dosimeters"
import type { Dosimeter, DosimeterInput } from "@/api/dosimeters"

interface DosimeterFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    dosimeterToEdit?: Dosimeter | null
    onSuccess: () => void
}

export default function DosimeterForm({ open, onOpenChange, dosimeterToEdit, onSuccess }: DosimeterFormProps) {
    const [formData, setFormData] = useState<DosimeterInput>({
        code: "",
        type: "OSL",
        status: "AVAILABLE",
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (dosimeterToEdit) {
            setFormData({
                code: dosimeterToEdit.code,
                type: dosimeterToEdit.type,
                status: dosimeterToEdit.status,
            })
        } else {
            setFormData({ code: "", type: "OSL", status: "AVAILABLE" })
        }
    }, [dosimeterToEdit, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (dosimeterToEdit) {
                await updateDosimeter(dosimeterToEdit.id, formData)
            } else {
                await createDosimeter(formData)
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Error saving dosimeter:", error)
            alert("Error al guardar dosímetro. Verifique que el código no esté duplicado.")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{dosimeterToEdit ? "Editar Dosímetro" : "Nuevo Dosímetro"}</SheetTitle>
                    <SheetDescription>
                        {dosimeterToEdit ? "Modifica los datos del dosímetro." : "Registra un nuevo dosímetro en el inventario."}
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="code">Código *</Label>
                        <Input id="code" name="code" value={formData.code} onChange={handleChange} required disabled={!!dosimeterToEdit} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select onValueChange={(v) => handleSelectChange("type", v)} value={formData.type}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FILM">Película (FILM)</SelectItem>
                                <SelectItem value="TLD">Termoluminiscente (TLD)</SelectItem>
                                <SelectItem value="OSL">Estimulación Óptica (OSL)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select onValueChange={(v) => handleSelectChange("status", v)} value={formData.status}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                                <SelectItem value="ASSIGNED">Asignado</SelectItem>
                                <SelectItem value="RETIRED">Retirado</SelectItem>
                            </SelectContent>
                        </Select>
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
