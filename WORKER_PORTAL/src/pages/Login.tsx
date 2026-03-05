import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import RadiationBackground from "@/components/ui/RadiationBackground"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

export default function Login() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!username || !password) {
            setError("Por favor, ingrese su DNI en ambos campos.")
            setLoading(false)
            return
        }

        if (username !== password) {
            setError("Para acceder, su usuario y contraseña deben ser su DNI.")
            setLoading(false)
            return
        }

        try {
            const { data, error: supaError } = await supabase
                .from('Worker')
                .select('*')
                .eq('dni', username)
                .single()

            if (supaError || !data) {
                console.error("Supabase Error:", supaError)
                throw new Error("Credenciales inválidas o trabajador no encontrado.")
            }

            localStorage.setItem("workerId", data.id)
            localStorage.setItem("workerName", `${data.firstName} ${data.lastName}`)
            navigate("/mis-lecturas")

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Ocurrió un error inesperado al conectar con el servidor.")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full font-display relative items-center justify-center p-4 overflow-hidden bg-white">

            <RadiationBackground />

            {/* Light Glassmorphism Card */}
            <div
                className="z-10 w-full max-w-[420px] rounded-2xl p-8"
                style={{
                    background: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.7)',
                    animation: 'slideUpGlass 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
                }}
            >
                <style>{`
                    @keyframes slideUpGlass {
                        from { opacity: 0; transform: translateY(32px) scale(0.96); }
                        to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes fadeDropIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                    .stagger-in { animation: fadeDropIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
                    .stagger-in:nth-child(1) { animation-delay: 0.1s; }
                    .stagger-in:nth-child(2) { animation-delay: 0.2s; }
                    .stagger-in:nth-child(3) { animation-delay: 0.3s; }
                    .stagger-in:nth-child(4) { animation-delay: 0.4s; }
                `}</style>

                <div className="flex flex-col items-center text-center space-y-6">

                    {/* Logo Vibrante */}
                    <div className="flex flex-col items-center justify-center gap-4 mb-2 stagger-in">
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '50%',
                            padding: '14px',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            boxShadow: '0 0 30px rgba(16, 185, 129, 0.2), inset 0 2px 6px rgba(255,255,255, 1)',
                        }}>
                            <img src="/logo2.png" alt="Logo" className="h-20 w-auto object-contain" style={{ filter: 'drop-shadow(0 4px 6px rgba(16,185,129,0.3))' }} />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-[#064e3b]">Portal de Consultas de Lecturas</h2>
                    </div>

                    <div className="space-y-1 w-full text-center stagger-in">


                        {/*<h1 className="text-3xl font-black tracking-tight text-[#022c22]">Bienvenido</h1>*/}
                        <p className="text-sm font-medium text-[#047857]">
                            Ingresa tus credenciales para acceder.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">

                        {/* Inputs limpios con focus glow sutil */}
                        <div className="space-y-2 stagger-in">
                            <Label htmlFor="username" className="text-sm font-bold text-[#064e3b]">Usuario</Label>
                            <Input
                                id="username"
                                placeholder="Ingresa tu usuario"
                                type="text"
                                required
                                className="h-12 border-0 transition-all duration-300 shadow-sm"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.85)',
                                    color: '#064e3b',
                                    outline: 'none',
                                }}
                                onFocus={e => {
                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.1), 0 0 20px rgba(16, 185, 129, 0.2)'
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                                }}
                                onBlur={e => {
                                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)'
                                }}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 stagger-in">
                            <Label htmlFor="password" className="text-sm font-bold text-[#064e3b]">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="h-12 border-0 transition-all duration-300 shadow-sm"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.85)',
                                    color: '#064e3b',
                                    outline: 'none',
                                }}
                                onFocus={e => {
                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.1), 0 0 20px rgba(16, 185, 129, 0.2)'
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                                }}
                                onBlur={e => {
                                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)'
                                }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="stagger-in p-3 text-sm rounded-lg border bg-white/90"
                                style={{ color: '#b91c1c', borderColor: '#fca5a5', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.1)' }}>
                                {error}
                            </div>
                        )}

                        {/* Botón CTA llamativo y premium */}
                        <div className="stagger-in pt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-bold transition-all duration-300 active:scale-[0.98]"
                                disabled={loading}
                                style={{
                                    background: loading
                                        ? 'rgba(16, 185, 129, 0.5)'
                                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(16, 185, 129, 0.5), inset 0 2px 0 rgba(255,255,255,0.2)',
                                }}
                                onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = '0 14px 28px -5px rgba(16, 185, 129, 0.6), inset 0 2px 0 rgba(255,255,255,0.2)')}
                                onMouseLeave={e => !loading && (e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(16, 185, 129, 0.5), inset 0 2px 0 rgba(255,255,255,0.2)')}
                            >
                                {loading ? "Ingresando..." : "Iniciar Sesión"}
                            </Button>
                        </div>
                    </form>

                    <div className="pt-2 text-xs font-semibold stagger-in" style={{ color: 'rgba(4, 120, 87, 0.6)' }}>
                        © 2026 Calidose. Todos los derechos reservados.
                    </div>
                </div>
            </div>
        </div>
    )
}
