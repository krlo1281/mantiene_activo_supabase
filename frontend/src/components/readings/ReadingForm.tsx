
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
import { createReading } from "@/api/readings"
import type { Assignment } from "@/api/assignments"

interface ReadingFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    assignments: Assignment[]
    preSelectedAssignmentId?: string | null
}

export default function ReadingForm({ open, onOpenChange, onSuccess, assignments, preSelectedAssignmentId }: ReadingFormProps) {
    const [assignmentId, setAssignmentId] = useState<string>("")
    const [hp10, setHp10] = useState<string>("")
    const [hp007, setHp007] = useState<string>("")
    const [readDate, setReadDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)

    // Sincronizar campo select cuando se proporciona un ID y el form se abre
    useEffect(() => {
        if (open) {
            setAssignmentId(preSelectedAssignmentId || "")
            setHp10("")
            setHp007("")
        }
    }, [open, preSelectedAssignmentId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await createReading({
                assignmentId,
                hp10: Number(hp10),
                hp007: Number(hp007),
                readDate,
                source: "MANUAL"
            })
            onSuccess()
            onOpenChange(false)
            // Reset
            setAssignmentId("")
            setHp10("")
            setHp007("")
        } catch (error: any) {
            console.error("Error creating reading:", error)
            alert(error.response?.data?.message || "Error al registrar lectura")
        } finally {
            setLoading(false)
        }
    }

    // Filter assignments that don't have readings yet? 
    // Ideally yes, but backend checks uniqueness too.
    // For now, list all. 

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Registrar Lectura Manual</SheetTitle>
                    <SheetDescription>
                        Ingresa los valores de dosis para un usuario asignado.
                        (Total disponibles: {assignments.length})
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="assignment">Usuario / Dosímetro</Label>
                        {preSelectedAssignmentId ? (
                            <div className="p-3 bg-muted rounded-md text-sm border border-input font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-muted-foreground">lock</span>
                                {(() => {
                                    const a = assignments.find(x => x.id === preSelectedAssignmentId)
                                    return a ? `${a.worker?.firstName} ${a.worker?.lastName} - ${a.dosimeter?.code}` : 'Asignación no encontrada'
                                })()}
                            </div>
                        ) : (
                            <Select onValueChange={setAssignmentId} value={assignmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione asignación" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignments.length === 0 ? (
                                        <SelectItem value="none" disabled>No hay asignaciones pendientes en este periodo</SelectItem>
                                    ) : (
                                        assignments.map((a) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                {a.worker?.firstName} {a.worker?.lastName} - {a.dosimeter?.code}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="hp10">Hp(10) mSv</Label>
                            <Input
                                id="hp10"
                                type="number"
                                step="0.0001"
                                value={hp10}
                                onChange={(e) => setHp10(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="hp007">Hp(0.07) mSv</Label>
                            <Input
                                id="hp007"
                                type="number"
                                step="0.0001"
                                value={hp007}
                                onChange={(e) => setHp007(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="readDate">Fecha de Lectura</Label>
                        <Input
                            id="readDate"
                            type="date"
                            value={readDate}
                            onChange={(e) => setReadDate(e.target.value)}
                            required
                        />
                    </div>
                    <SheetFooter>
                        <SheetClose asChild>
                            <Button variant="outline" type="button">Cancelar</Button>
                        </SheetClose>
                        <Button type="submit" disabled={loading || !assignmentId}>
                            {loading ? "Guardando..." : "Guardar Lectura"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
