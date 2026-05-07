import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getDashboardStats } from "@/api/dashboard"
import type { DashboardStats } from "@/api/dashboard"
import { useDataRefresh } from "@/context/DataRefreshContext"
import axios from "@/lib/axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"


export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const { refreshTrigger } = useDataRefresh()

    // Sync Modal State
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
    const [syncLogs, setSyncLogs] = useState<string[]>([])
    const [syncFinished, setSyncFinished] = useState(false)
    const logsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsData = await getDashboardStats()
                setStats(statsData)
            } catch (error) {
                console.error("Failed to fetch dashboard data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [refreshTrigger])

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [syncLogs])

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncLogs([]);
        setSyncFinished(false);
        setIsSyncModalOpen(true);

        try {
            // 1. Primero disparar la sync (esta responde 202 inmediatamente)
            await axios.post('/api/sync/manual');

            // 2. Recién ahora, abrir el EventSource para escuchar los logs en tiempo real
            const token = localStorage.getItem('token');
            const eventSource = new EventSource(`/api/sync/stream?token=${token}`);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'log') {
                        setSyncLogs(prev => [...prev, data.message]);
                    } else if (data.type === 'done') {
                        setSyncFinished(true);
                        eventSource.close();
                        setIsSyncing(false);
                        // Cierra automáticamente el modal después de 3 segundos
                        setTimeout(() => {
                            setIsSyncModalOpen(false);
                        }, 3000);
                    }
                } catch (e) {
                    console.error("Error parsing SSE data", e);
                }
            };

            // El SSE se cierra naturalmente al finalizar la sync (res.end())
            // El onerror puede ocurrir por cierre limpio del servidor, no es un error crítico
            eventSource.onerror = () => {
                eventSource.close();
                if (!syncFinished) {
                    setSyncFinished(true);
                    setIsSyncing(false);
                }
            };

        } catch (error) {
            console.error('Error invocando el endpoint de sincronización:', error);
            setSyncLogs(prev => [...prev, "âŒ Error: No se pudo conectar con el servidor. Â¿Está el backend corriendo?"]);
            setSyncFinished(true);
            setIsSyncing(false);
        }
    }

    return (
        <>
            {/* Page Heading */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div className="flex flex-col gap-1 w-full md:w-auto">
                    <h2 className="text-[#0d141b] dark:text-white text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em]">Panel Principal</h2>
                </div>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <Button
                        variant="outline"
                        className={`bg-white dark:bg-[#1a2632] border-[#cfdbe7] dark:border-[#2a3a4a] flex-1 sm:flex-none justify-center gap-2 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleSync}
                        disabled={isSyncing}
                    >
                        <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>
                            {isSyncing ? 'sync' : 'cloud_upload'}
                        </span>
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Nube'}
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none justify-center gap-2 shadow-sm">
                        <span className="material-symbols-outlined text-sm">download</span>
                        Exportar Reporte
                    </Button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Stat Card 1 - Users */}
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1a2632] border border-[#cfdbe7] dark:border-[#2a3a4a] shadow-sm">
                    <div className="flex justify-between items-start">
                        <p className="text-[#4c739a] dark:text-[#94a3b8] text-sm font-medium leading-normal">Total Usuarios</p>
                        <span className="material-symbols-outlined text-[#4c739a] dark:text-[#94a3b8]" style={{ fontSize: '20px' }}>group</span>
                    </div>
                    <p className="text-[#0d141b] dark:text-white tracking-light text-2xl font-bold leading-tight">
                        {loading ? "..." : stats?.workers.total}
                    </p>
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[#078838] text-sm">trending_up</span>
                        <p className="text-[#078838] text-xs font-medium leading-normal">+{stats?.workers.growth}% vs mes anterior</p>
                    </div>
                </div>

                {/* Stat Card 2 - Dosimeters Breakdown */}
                <div className="flex flex-col gap-2 rounded-xl p-4 sm:p-6 bg-white dark:bg-[#1a2632] border border-[#cfdbe7] dark:border-[#2a3a4a] shadow-sm col-span-1 sm:col-span-2">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[#4c739a] dark:text-[#94a3b8] text-sm font-medium leading-normal">Estado de Dosímetros</p>
                        <span className="material-symbols-outlined text-[#4c739a] dark:text-[#94a3b8]" style={{ fontSize: '20px' }}>developer_board</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-2 sm:p-3 rounded-lg">
                            <span className="text-muted-foreground text-[10px] sm:text-xs uppercase font-semibold">Total</span>
                            <span className="text-xl sm:text-2xl font-bold text-[#0d141b] dark:text-white">
                                {loading ? "..." : stats?.dosimeters.total}
                            </span>
                        </div>
                        <div className="flex flex-col bg-blue-50/50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg">
                            <span className="text-muted-foreground text-[10px] sm:text-xs uppercase font-semibold">Asignados</span>
                            <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {loading ? "..." : stats?.dosimeters.assigned}
                            </span>
                        </div>
                        <div className="flex flex-col bg-green-50/50 dark:bg-green-900/20 p-2 sm:p-3 rounded-lg">
                            <span className="text-muted-foreground text-[10px] sm:text-xs uppercase font-semibold">Disponibles</span>
                            <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                                {loading ? "..." : stats?.dosimeters.available}
                            </span>
                        </div>
                        <div className="flex flex-col bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
                            <span className="text-muted-foreground text-[10px] sm:text-xs uppercase font-semibold">Retirados</span>
                            <span className="text-xl sm:text-2xl font-bold text-gray-500 dark:text-gray-400">
                                {loading ? "..." : stats?.dosimeters.retired}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts Section - Modern & Compact */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-[#0d141b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">Dosimetría Pendiente</h3>
                        {stats?.pendingReadingsByPeriod && stats.pendingReadingsByPeriod.length > 0 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-xs font-bold">
                                {stats.pendingReadingsByPeriod.length}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <p>Cargando...</p>
                            </div>
                        </div>
                    ) : stats?.pendingReadingsByPeriod && stats.pendingReadingsByPeriod.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2">
                            {stats.pendingReadingsByPeriod.map((period, idx) => {
                                const monthName = new Date(2000, period.month - 1).toLocaleString('es-ES', { month: 'short' }).toUpperCase();
                                const isUrgent = period.pendingCount >= 10;
                                return (
                                    <div
                                        key={idx}
                                        className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-md ${
                                            isUrgent
                                                ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800/50'
                                                : 'bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border border-orange-200 dark:border-orange-800/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`p-2 rounded-lg ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                                                    <span className={`material-symbols-outlined ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} style={{ fontSize: '20px' }}>
                                                        {isUrgent ? 'priority_high' : 'warning'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[#0d141b] dark:text-white font-semibold text-sm">{monthName} {period.year}</p>
                                                    <p className="text-xs text-muted-foreground">Lecturas sin registrar</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-2xl font-black ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                    {period.pendingCount}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-medium">dosimetría</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/50 flex flex-col items-center justify-center text-center">
                            <span className="material-symbols-outlined text-4xl mb-3 text-green-600 dark:text-green-400">verified</span>
                            <p className="text-[#0d141b] dark:text-white font-semibold">¡Todo al día!</p>
                            <p className="text-xs text-muted-foreground mt-1">No hay lecturas pendientes por registrar.</p>
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-[#0d141b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] mb-4">Progreso de Lecturas</h3>
                    {/* Chart placeholder */}
                    <Card className="h-64 flex items-center justify-center bg-white dark:bg-[#1a2632] border-[#cfdbe7] dark:border-[#2a3a4a]">
                        <p className="text-muted-foreground">Gráfico Donut (Próximamente)</p>
                    </Card>
                </div>
            </div>

            {/* Sync Progress Modal */}
            <Dialog open={isSyncModalOpen} onOpenChange={(open) => {
                if (!isSyncing || syncFinished) {
                    setIsSyncModalOpen(open);
                }
            }}>
                <DialogContent className="sm:max-w-2xl bg-[#0d141b] text-white border-[#2a3a4a] shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-emerald-400 font-mono flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">terminal</span>
                            Terminal de Sincronización
                        </DialogTitle>
                        <DialogDescription className="text-[#94a3b8]">
                            Monitoreo en tiempo real de la transmisión de datos hacia Supabase.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-black rounded-md p-4 h-[350px] overflow-y-auto font-mono text-xs sm:text-sm shadow-inner mt-2 border border-[#2a3a4a]">
                        {syncLogs.length === 0 ? (
                            <p className="text-gray-500 italic">Estableciendo conexión segura...</p>
                        ) : (
                            <div className="flex flex-col gap-1.5 break-words">
                                {syncLogs.map((log, i) => (
                                    <div key={i} className={`${log.includes('âŒ') ? 'text-red-400' : log.includes('âœ…') ? 'text-green-400' : 'text-gray-300'}`}>
                                        <span className="text-gray-600 mr-2 font-bold">{'>'}</span>{log}
                                    </div>
                                ))}
                                {isSyncing && !syncFinished && (
                                    <div className="text-gray-400 animate-pulse mt-1"><span className="text-gray-600 mr-2 font-bold">{'>'}</span>_</div>
                                )}
                                <div ref={logsEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${isSyncing && !syncFinished ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
                            {isSyncing && !syncFinished ? 'Conexión activa' : 'Conexión cerrada'}
                        </div>
                        <Button
                            variant="default"
                            className={`${syncFinished ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 cursor-not-allowed'}`}
                            onClick={() => setIsSyncModalOpen(false)}
                            disabled={!syncFinished}
                        >
                            {syncFinished ? 'Cerrar Terminal' : 'Operación en curso...'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
