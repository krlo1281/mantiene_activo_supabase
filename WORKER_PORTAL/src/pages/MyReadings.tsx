import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, Download, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type ReadingRow = {
    id: string
    periodMonth: number
    periodYear: number
    dosimeterCode: string
    hp10: number | null
    hp007: number | null
    readDate: string | null
}

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export default function MyReadings() {
    const [readings, setReadings] = useState<ReadingRow[]>([])
    const [loading, setLoading] = useState(true)
    const [workerName, setWorkerName] = useState("")
    const [workerIdText, setWorkerIdText] = useState("")
    const navigate = useNavigate()

    useEffect(() => {
        const workerId = localStorage.getItem("workerId")
        const workerNameStr = localStorage.getItem("workerName")

        if (!workerId) {
            navigate("/login")
            return
        }

        setWorkerName(workerNameStr || "Trabajador")

        // Asignaremos un número de identificación de prueba extraído del DNI al hacer login.
        // Como no lo guardamos en el login, podríamos mostrar un placeholder o consultar el trabajador de nuevo.
        setWorkerIdText("")

        const fetchReadings = async () => {
            try {
                // Obtenemos el trabajador de nuevo para mostrar su DNI en el panel
                const { data: workerData } = await supabase
                    .from('Worker')
                    .select('dni, firstName, lastName')
                    .eq('id', workerId)
                    .single()

                if (workerData) {
                    setWorkerIdText(workerData.dni)
                    setWorkerName(`${workerData.firstName} ${workerData.lastName}`)
                }

                const { data, error } = await supabase
                    .from('Assignment')
                    .select(`
            id,
            Period ( month, year ),
            Dosimeter ( code ),
            Reading ( hp10, hp007, readDate )
          `)
                    .eq('workerId', workerId)

                if (error) throw error

                if (data) {
                    const formatted: ReadingRow[] = data
                        .filter((a: any) => a.Period && a.Dosimeter) // Asegurar relaciones válidas
                        .map((a: any) => ({
                            id: a.id,
                            periodMonth: a.Period.month,
                            periodYear: a.Period.year,
                            dosimeterCode: a.Dosimeter.code,
                            hp10: a.Reading && a.Reading.length > 0 ? a.Reading[0].hp10 : null,
                            hp007: a.Reading && a.Reading.length > 0 ? a.Reading[0].hp007 : null,
                            readDate: a.Reading && a.Reading.length > 0 ? a.Reading[0].readDate : null,
                        }))

                    // Ordenar por año (desc) y mes (desc)
                    formatted.sort((a, b) => {
                        if (a.periodYear !== b.periodYear) return b.periodYear - a.periodYear
                        return b.periodMonth - a.periodMonth
                    })

                    // 1. Encontrar la última lectura cronológica que sí tenga valores numéricos
                    const firstValidIndex = formatted.findIndex(r => r.hp10 !== null || r.hp007 !== null)

                    if (firstValidIndex !== -1) {
                        // 2. Tomar 12 periodos consecutivos desde ese punto
                        const twelveConsecutive = formatted.slice(firstValidIndex, firstValidIndex + 12)
                        // 3. Mostrar solo las lecturas que tengan valores numéricos
                        const onlyNumerics = twelveConsecutive.filter(r => r.hp10 !== null || r.hp007 !== null)

                        setReadings(onlyNumerics)
                    } else {
                        // Si no hay lecturas con valores
                        setReadings([])
                    }
                }
            } catch (error) {
                console.error("Error fetching readings:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchReadings()
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem("workerId")
        localStorage.removeItem("workerName")
        navigate("/login")
    }

    const handleDownload = () => {
        if (readings.length === 0) {
            alert("No hay lecturas disponibles para descargar.")
            return
        }

        try {
            const doc = new jsPDF()

            // Titulo
            doc.setFontSize(18)
            doc.setFont("helvetica", "bold")
            doc.text("REPORTE DE DOSIMETRÍA", 14, 22)

            // Info de Usuario
            doc.setFontSize(11)
            doc.setFont("helvetica", "normal")
            doc.text(`Usuario: ${workerName}`, 14, 34)

            const fechaEmision = new Date().toLocaleDateString("en-US", { month: 'numeric', day: 'numeric', year: 'numeric' })
            doc.text(`Fecha de Emisión: ${fechaEmision}`, 14, 41)

            // Calculamos el periodo reportado (Rango de meses/años)
            // readings está ordenado descendente (el primero es el más reciente)
            const latest = readings[0];
            const earliest = readings[readings.length - 1];
            const periodText = `${MONTHS[earliest.periodMonth - 1]} ${earliest.periodYear} - ${MONTHS[latest.periodMonth - 1]} ${latest.periodYear}`;
            doc.text(`Periodo Reportado: ${periodText}`, 14, 48)

            // Tabla
            const tableColumn = ["PERIODO", "DOSÍMETRO", "Hp(10)", "Hp(0.07)", "FECHA"]
            const tableRows: any[] = []

            // Rellenar datos
            readings.forEach(reading => {
                const readingData = [
                    `${MONTHS[reading.periodMonth - 1]} ${reading.periodYear}`,
                    reading.dosimeterCode,
                    reading.hp10 !== null ? reading.hp10.toFixed(2) : "-",
                    reading.hp007 !== null ? reading.hp007.toFixed(2) : "-",
                    reading.readDate ? new Date(reading.readDate).toLocaleDateString("en-US", { month: 'numeric', day: 'numeric', year: 'numeric' }) : ""
                ]
                tableRows.push(readingData)
            })

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 56,
                theme: 'plain',
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    lineWidth: 0,
                    cellPadding: { top: 3, bottom: 3 },
                },
                bodyStyles: {
                    textColor: [0, 0, 0],
                    cellPadding: { top: 3, bottom: 3 },
                },
                didParseCell: function (data) {
                    // Agregar borde superior grueso solo al header
                    if (data.section === 'head' && data.row.index === 0) {
                        data.cell.styles.lineWidth = { top: 0.5, bottom: 0.5, left: 0, right: 0 }
                        data.cell.styles.lineColor = [0, 0, 0]
                    }
                }
            })

            console.log("Tabla renderizada. Generando footer...");
            // Footer - warning text at the bottom of the table
            const finalY = (doc as any).lastAutoTable.finalY + 15

            // Linea inferior de cierre de tabla
            doc.setLineWidth(0.5)
            doc.line(14, (doc as any).lastAutoTable.finalY, doc.internal.pageSize.width - 14, (doc as any).lastAutoTable.finalY)

            doc.setFont("helvetica", "bold")
            doc.setFontSize(14)
            doc.setTextColor(204, 0, 0) // Red
            doc.text("ADVERTENCIA: ESTE REPORTE NO ES OFICIAL", 14, finalY)

            doc.setFont("helvetica", "normal")
            doc.setFontSize(10)
            doc.setTextColor(153, 0, 0) // Darker Red
            doc.text("Este documento es solo para fines informativos y no reemplaza el reporte oficial certificado.", 14, finalY + 7)

            // --- ESTRATEGIA DE DESCARGA DEFINITIVA (CHROME/BRAVE/EDGE) ---
            const pdfBlob = doc.output('blob');
            const url = window.URL.createObjectURL(pdfBlob);

            const link = document.createElement('a');
            link.href = url;

            // Limpieza extra del nombre para evitar caracteres invisibles
            const safeDni = (workerIdText || '71067485').toString().trim();
            const finalFileName = `Reporte_Dosimetria_${safeDni}.pdf`;

            link.download = finalFileName;
            link.setAttribute('download', finalFileName);
            link.style.display = 'none';
            link.rel = 'noopener';

            document.body.appendChild(link);

            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });

            link.dispatchEvent(clickEvent);

            // Dejamos el enlace en el DOM por 10 segundos para asegurar que el navegador
            // capture el nombre del archivo antes de limpiar la memoria.
            setTimeout(() => {
                if (document.body.contains(link)) document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 10000);

        } catch (error) {
            console.error("Error crítico al generar el PDF:", error)
            alert("Hubo un error al generar el reporte PDF. Por favor, revisa la consola para más detalles.")
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
            {/* Background elements to match the "clean/medical" vibe of the login */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[100px] opacity-60 z-0 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[100px] opacity-60 z-0 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header Panel Usuario */}
                <header className="flex justify-between items-center p-5 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                    <div className="flex flex-col items-start gap-0.5 ml-2">
                        <img src="/logo2.png" alt="Calidose Logo" className="h-[42px] w-auto object-contain" />
                        <span className="text-[11px] text-slate-500 uppercase tracking-[0.15em] font-bold pl-[48px] -mt-1">Panel de Usuario</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-800">{workerName}</p>
                            <p className="text-xs text-slate-500">{workerIdText}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-6xl w-full mx-auto p-8 space-y-6 flex-1">

                    {/* Titular Seccion */}
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Historial de Lecturas</h2>
                        <p className="text-slate-500 text-sm">
                            A continuación se detallan sus lecturas dosimétricas de los últimos 12 meses.
                        </p>
                    </div>

                    {/* Tabla */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-xs font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">PERIODO</th>
                                        <th className="px-6 py-4">DOSÍMETRO</th>
                                        <th className="px-6 py-4 text-center">HP(10) mSv</th>
                                        <th className="px-6 py-4 text-center">HP(0.07) mSv</th>
                                        <th className="px-6 py-4">FECHA LECTURA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                Cargando historial de lecturas...
                                            </td>
                                        </tr>
                                    ) : readings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                No hay lecturas registradas para su cuenta en el último año.
                                            </td>
                                        </tr>
                                    ) : (
                                        readings.map((reading) => (
                                            <tr key={reading.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                                        <Calendar className="w-4 h-4 text-emerald-500" />
                                                        {MONTHS[reading.periodMonth - 1]} {reading.periodYear}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 uppercase font-mono text-xs tracking-wider">
                                                    {reading.dosimeterCode}
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-emerald-600">
                                                    {reading.hp10 !== null ? reading.hp10.toFixed(2) : <span className="text-slate-300">-</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center font-semibold text-slate-700">
                                                    {reading.hp007 !== null ? reading.hp007.toFixed(2) : <span className="text-slate-300">-</span>}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">
                                                    {reading.readDate ? new Date(reading.readDate).toLocaleDateString("es-ES") : "B/D"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                        <Button
                            onClick={handleDownload}
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex gap-2 items-center justify-center transition-all duration-300 shadow-[0_4px_14px_0_rgba(16,185,129,0.25)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)] active:scale-[0.99] border-none"
                        >
                            <Download className="w-5 h-5" />
                            Descargar Reporte Anual
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    )
}
