import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getWorkerHistory, type WorkerHistoryResponse } from "@/api/workers"
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from "recharts"

export default function WorkerDetails() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [data, setData] = useState<WorkerHistoryResponse | null>(null)
    const [loading, setLoading] = useState(true)

    // State for chart visibility
    const [visibleSeries, setVisibleSeries] = useState({ hp10: true, hp007: true })

    useEffect(() => {
        if (id) {
            getWorkerHistory(id)
                .then(setData)
                .catch(err => console.error("Error fetching worker history:", err))
                .finally(() => setLoading(false))
        }
    }, [id])

    if (loading) return <div className="p-8 text-center">Cargando perfil...</div>
    if (!data) return <div className="p-8 text-center">Usuario no encontrado</div>

    const { worker, stats, history = [], assignments = [] } = data

    // Sate checks
    if (!worker || !stats) return <div className="p-8 text-center text-red-500">Error: Datos incompletos del trabajador</div>


    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-6rem)] overflow-y-auto pr-4 pb-10">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <Button variant="ghost" onClick={() => navigate("/workers")} className="mb-2 pl-0 hover:bg-transparent hover:text-primary">
                        ← Volver a Usuarios
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0d141b] dark:text-white">
                        {worker.firstName} {worker.lastName}
                    </h1>
                    <div className="flex gap-2 text-muted-foreground mt-1">
                        <span>DNI: {worker.dni}</span>
                        <span>•</span>
                        <span>{worker.companies?.map(c => c.name).join(", ") || 'Sin Empresa'}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <span className="material-symbols-outlined text-sm mr-2">print</span>
                        Imprimir Reporte
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">Dosis Acumulada (12 Meses)</CardTitle>
                        <span className="material-symbols-outlined text-muted-foreground text-sm">monitor_heart</span>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold text-red-600">{(stats.ytdHp10 || 0).toFixed(3)} mSv</div>
                        <p className="text-xs text-muted-foreground">Últimos 12 meses registrados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">Último Mes</CardTitle>
                        <span className="material-symbols-outlined text-muted-foreground text-sm">calendar_today</span>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold">{(stats.lastMonthDose || 0).toFixed(3)} mSv</div>
                        <p className="text-xs text-muted-foreground">{stats.lastReadingDate || 'N/A'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">Lecturas Registradas</CardTitle>
                        <span className="material-symbols-outlined text-muted-foreground text-sm">history</span>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold">{stats.totalReadings || 0}</div>
                        <p className="text-xs text-muted-foreground">Mediciones históricas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Historial de Dosis Hp(10)</CardTitle>
                    <CardDescription>Tendencia de los últimos periodos registrados.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorHp10" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorHp007" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="period"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value} mSv`}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: number | undefined, name: string | undefined) => [
                                        `${Number(value || 0).toFixed(3)} mSv`,
                                        name === 'hp10' ? 'Dosis Hp(10)' : 'Dosis Hp(0.07)'
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="hp10"
                                    stroke="#ef4444"
                                    fillOpacity={1}
                                    fill="url(#colorHp10)"
                                    strokeWidth={2}
                                    name="hp10"
                                    hide={!visibleSeries.hp10}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="hp007"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorHp007)"
                                    strokeWidth={2}
                                    name="hp007"
                                    hide={!visibleSeries.hp007}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Custom Legend */}
                    <div className="flex justify-center gap-6 mt-4">
                        <div
                            className={`flex items-center gap-2 cursor-pointer transition-opacity ${visibleSeries.hp10 ? 'opacity-100' : 'opacity-50 grayscale'}`}
                            onClick={() => setVisibleSeries(prev => ({ ...prev, hp10: !prev.hp10 }))}
                        >
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            <span className="text-sm font-medium text-slate-700">Hp(10)</span>
                        </div>
                        <div
                            className={`flex items-center gap-2 cursor-pointer transition-opacity ${visibleSeries.hp007 ? 'opacity-100' : 'opacity-50 grayscale'}`}
                            onClick={() => setVisibleSeries(prev => ({ ...prev, hp007: !prev.hp007 }))}
                        >
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            <span className="text-sm font-medium text-slate-700">Hp(0.07)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assignments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Asignaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table wrapperClassName="rounded-md border max-h-[400px] overflow-y-auto relative">
                        <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10 shadow-sm">
                            <TableRow>
                                <TableHead>Periodo</TableHead>
                                <TableHead>Dosímetro</TableHead>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Hp(10)</TableHead>
                                <TableHead>Hp(0.07)</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.isArray(assignments) && assignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                    <TableCell className="font-medium">{assignment.period}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm text-slate-500">tag</span>
                                            {assignment.dosimeter}
                                        </div>
                                    </TableCell>
                                    <TableCell>{assignment.company}</TableCell>
                                    <TableCell>
                                        {assignment.hp10 !== undefined && assignment.hp10 !== null
                                            ? <span className="font-bold">{assignment.hp10.toFixed(4)}</span>
                                            : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        {assignment.hp007 !== undefined && assignment.hp007 !== null
                                            ? assignment.hp007.toFixed(4)
                                            : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${assignment.status === 'READ'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {assignment.status === 'READ' ? 'Leido' : 'Pendiente'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
