
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getPeriods, updatePeriod } from "@/api/periods"
import type { Period } from "@/api/periods"
import { getSyncConfig, updateSyncConfig } from "@/api/sync"
import type { SyncConfig } from "@/api/sync"

export default function Settings() {
    const [minYear, setMinYear] = useState<string>("2022")
    const [maxYear, setMaxYear] = useState<string>("2030")
    const [saved, setSaved] = useState(false)

    // Background Readings State
    const [periods, setPeriods] = useState<Period[]>([])
    const [selectedBgPeriod, setSelectedBgPeriod] = useState<string>("")
    const [bgDosimeter, setBgDosimeter] = useState("")
    const [bgHp10, setBgHp10] = useState("")
    const [bgHp007, setBgHp007] = useState("")
    const [bgLoading, setBgLoading] = useState(false)
    const [bgSaved, setBgSaved] = useState(false)

    // Sync State
    const [syncEnabled, setSyncEnabled] = useState(false)
    const [syncTime, setSyncTime] = useState("02:00")
    const [syncLoading, setSyncLoading] = useState(false)
    const [syncSaved, setSyncSaved] = useState(false)

    useEffect(() => {
        const storedMin = localStorage.getItem("system_min_year")
        const storedMax = localStorage.getItem("system_max_year")
        if (storedMin) setMinYear(storedMin)
        if (storedMax) setMaxYear(storedMax)

        // Load periods
        getPeriods().then(setPeriods).catch(console.error)

        // Load sync config
        getSyncConfig().then(cfg => {
            setSyncEnabled(cfg.enabled)
            setSyncTime(cfg.time)
        }).catch(err => console.error("Error loading sync config", err))
    }, [])

    const handleSave = () => {
        localStorage.setItem("system_min_year", minYear)
        localStorage.setItem("system_max_year", maxYear)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleSaveBackground = async () => {
        if (!selectedBgPeriod) return;
        setBgLoading(true)
        try {
            await updatePeriod(selectedBgPeriod, {
                backgroundDosimeterCode: bgDosimeter,
                backgroundHp10: Number(bgHp10),
                backgroundHp007: Number(bgHp007)
            })
            setBgSaved(true)
            setTimeout(() => setBgSaved(false), 2000)

            // Refresh periods to keep local state in sync
            const updatedPeriods = await getPeriods()
            setPeriods(updatedPeriods)
        } catch (error: any) {
            console.error("Error saving background readings:", error)
            const errorData = error.response?.data;
            alert(`Error: ${errorData?.message}\nDetalles: ${errorData?.error || JSON.stringify(errorData)}`)
        } finally {
            setBgLoading(false)
        }
    }

    const handleSaveSync = async () => {
        setSyncLoading(true)
        try {
            await updateSyncConfig({ enabled: syncEnabled, time: syncTime })
            setSyncSaved(true)
            setTimeout(() => setSyncSaved(false), 2000)
        } catch (error: any) {
            console.error("Error saving sync config:", error)
        } finally {
            setSyncLoading(false)
        }
    }

    const getMonthName = (month: number) => {
        const date = new Date();
        date.setMonth(month - 1);
        return date.toLocaleString('es-ES', { month: 'long' });
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">Configuración del Sistema</h2>
                <p className="text-muted-foreground">Ajusta los parámetros generales de la aplicación.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rango de Años</CardTitle>
                    <CardDescription>
                        Define el rango de años disponible en los selectores de fecha (Asignaciones, Reportes, etc).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="min-year">Año Inicial</Label>
                            <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <input
                                    id="min-year"
                                    type="number"
                                    className="w-full bg-transparent outline-none"
                                    value={minYear}
                                    onChange={(e) => setMinYear(e.target.value)}
                                    min="2000"
                                    max="2100"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max-year">Año Final</Label>
                            <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <input
                                    id="max-year"
                                    type="number"
                                    className="w-full bg-transparent outline-none"
                                    value={maxYear}
                                    onChange={(e) => setMaxYear(e.target.value)}
                                    min="2000"
                                    max="2100"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={handleSave}>Guardar Cambios</Button>
                        {saved && <span className="text-green-600 text-sm font-medium animate-pulse">¡Guardado correctamente!</span>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lecturas de Fondo (Background)</CardTitle>
                    <CardDescription>
                        Configura los valores de radiación de fondo para cada periodo. Estos valores se restarán de las lecturas brutas si se requiere.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label>Seleccionar Periodo</Label>
                            <Select
                                value={selectedBgPeriod}
                                onValueChange={(val) => {
                                    setSelectedBgPeriod(val)
                                    const p = periods.find(per => per.id === val)
                                    if (p) {
                                        setBgDosimeter(p.backgroundDosimeterCode || "")
                                        setBgHp10(p.backgroundHp10?.toString() || "")
                                        setBgHp007(p.backgroundHp007?.toString() || "")
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un periodo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {getMonthName(p.month)} {p.year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bg-dosimeter">Código Dosímetro Fondo</Label>
                                <Input
                                    id="bg-dosimeter"
                                    value={bgDosimeter}
                                    onChange={(e) => setBgDosimeter(e.target.value)}
                                    placeholder="Ej: BG-2024-01"
                                    disabled={!selectedBgPeriod}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bg-hp10">Fondo Hp(10) mSv</Label>
                                <Input
                                    id="bg-hp10"
                                    type="number"
                                    step="0.0001"
                                    value={bgHp10}
                                    onChange={(e) => setBgHp10(e.target.value)}
                                    placeholder="0.0000"
                                    disabled={!selectedBgPeriod}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bg-hp007">Fondo Hp(0.07) mSv</Label>
                                <Input
                                    id="bg-hp007"
                                    type="number"
                                    step="0.0001"
                                    value={bgHp007}
                                    onChange={(e) => setBgHp007(e.target.value)}
                                    placeholder="0.0000"
                                    disabled={!selectedBgPeriod}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={handleSaveBackground} disabled={!selectedBgPeriod || bgLoading}>
                            {bgLoading ? "Guardando..." : "Guardar Fondo"}
                        </Button>
                        {bgSaved && <span className="text-green-600 text-sm font-medium animate-pulse">¡Fondo actualizado!</span>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sincronización Cloud (Supabase)</CardTitle>
                    <CardDescription>
                        Configura el trabajo automático nocturno para respaldar los datos a la Nube mediante Cron-Job.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label className="mb-1">Estado de Sincronización Automática</Label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={syncEnabled}
                                    onChange={(e) => setSyncEnabled(e.target.checked)}
                                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                                />
                                <span className="font-medium text-sm text-[#0d141b] dark:text-white">
                                    {syncEnabled ? 'Habilitado (Activo)' : 'Deshabilitado (Pausado)'}
                                </span>
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Si está desactivado, solo podrás realizar respaldos de forma manual.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sync-time">Hora Ejecución Diaria (Ej. 02:00, 23:30)</Label>
                            <Input
                                id="sync-time"
                                type="time"
                                value={syncTime}
                                onChange={(e) => setSyncTime(e.target.value)}
                                disabled={!syncEnabled}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <Button onClick={handleSaveSync} disabled={syncLoading}>
                            {syncLoading ? "Guardando Config..." : "Guardar Respaldos"}
                        </Button>
                        {syncSaved && <span className="text-emerald-600 text-sm font-medium animate-pulse">¡Automatización lista!</span>}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
