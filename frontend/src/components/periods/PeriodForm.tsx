
import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { createPeriod } from "@/api/periods"

interface PeriodFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export default function PeriodForm({ open, onOpenChange, onSuccess }: PeriodFormProps) {
    const currentYear = new Date().getFullYear()
    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1))
    const [year, setYear] = useState<string>(String(currentYear))
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await createPeriod({ month: Number(month), year: Number(year) })
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error creating period:", error)
            alert(error.response?.data?.message || "Error al crear periodo")
        } finally {
            setLoading(false)
        }
    }

    const months = [
        { value: "1", label: "Enero" },
        { value: "2", label: "Febrero" },
        { value: "3", label: "Marzo" },
        { value: "4", label: "Abril" },
        { value: "5", label: "Mayo" },
        { value: "6", label: "Junio" },
        { value: "7", label: "Julio" },
        { value: "8", label: "Agosto" },
        { value: "9", label: "Septiembre" },
        { value: "10", label: "Octubre" },
        { value: "11", label: "Noviembre" },
        { value: "12", label: "Diciembre" },
    ]

    const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i)) // 2 years back, 2 years forward

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Nuevo Periodo</SheetTitle>
                    <SheetDescription>
                        Abre un nuevo periodo de monitoreo mensual.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="month">Mes</Label>
                        <Select onValueChange={setMonth} value={month}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="year">Año</Label>
                        <Select onValueChange={setYear} value={year}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione año" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <SheetFooter>
                        <SheetClose asChild>
                            <Button variant="outline" type="button">Cancelar</Button>
                        </SheetClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear Periodo"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
