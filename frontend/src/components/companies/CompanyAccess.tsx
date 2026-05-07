import React, { useState, useEffect } from 'react';
import { listCompanyAccesses, createCompanyAccess, resetCompanyAccessPassword } from '@/api/companies';
import type { Company } from '@/api/companies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, User, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompanyAccessProps {
    company: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CompanyAccess({ company, open, onOpenChange }: CompanyAccessProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form Creation State
    const [showForm, setShowForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [creating, setCreating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Reset Password State
    const [resettingUser, setResettingUser] = useState<any | null>(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        if (open && company) {
            fetchUsers();
            setShowForm(false);
            setResettingUser(null);
            resetForm();
        } else {
            setUsers([]);
        }
    }, [open, company]);

    const fetchUsers = async () => {
        if (!company) return;
        setLoading(true);
        try {
            const data = await listCompanyAccesses(company.id);
            setUsers(data || []);
        } catch (error) {
            console.error("Failed to load company accesses", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setErrorMsg('');
        setSuccessMsg('');
        setShowPassword(false);
        setResetPassword('');
    };

    const handleCreateAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!email || password.length < 6) {
            setErrorMsg('Por favor ingrese un correo válido y una contraseña de al menos 6 caracteres.');
            return;
        }

        if (!company) return;

        setCreating(true);
        try {
            await createCompanyAccess(company.id, { email, password });
            setSuccessMsg('Â¡Acceso representativo creado y autorizado existosamente!');
            setTimeout(() => {
                setShowForm(false);
                resetForm();
                fetchUsers();
            }, 2000);
        } catch (error: any) {
            console.error("Error creating access", error);
            const msg = error.response?.data?.message || error.message || "Error desconocido al crear acceso.";
            setErrorMsg(msg);
        } finally {
            setCreating(false);
        }
    };
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!resettingUser || !resetPassword || resetPassword.length < 6) {
            setErrorMsg('Por favor ingrese una contraseña de al menos 6 caracteres.');
            return;
        }

        if (!company) return;

        setResetting(true);
        try {
            await resetCompanyAccessPassword(company.id, resettingUser.id, { newPassword: resetPassword });
            setSuccessMsg('Â¡Contraseña reseteada exitosamente!');
            setTimeout(() => {
                setResettingUser(null);
                resetForm();
            }, 2000);
        } catch (error: any) {
            console.error("Error resetting password", error);
            const msg = error.response?.data?.message || error.message || "Error desconocido al resetear contraseña.";
            setErrorMsg(msg);
        } finally {
            setResetting(false);
        }
    };

    if (!company) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl p-0 overflow-hidden rounded-xl">
                <div className="bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                        <Key className="w-5 h-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-white m-0">
                            Accesos al Portal
                        </DialogTitle>
                        <p className="text-sm font-medium text-slate-400 m-0">
                            {company.name}
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 min-h-[300px]">
                    {showForm ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
                            {/* Form Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-500" />
                                Nuevo Acceso Representativo
                            </h3>

                            {errorMsg && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex gap-2 items-start border border-red-100">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {successMsg && (
                                <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm flex gap-2 items-center border border-emerald-100">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleCreateAccess} className="space-y-4 relative z-10">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">CORREO ELECTRÓNICO (USUARIO)</label>
                                    <Input
                                        type="email"
                                        placeholder="representante@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-slate-50 border-slate-200 text-slate-800 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all h-11"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">Este correo será usado como nombre de usuario en el portal.</p>
                                </div>
                                <div className="relative">
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">CONTRASEÑA TEMPORAL</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-slate-800 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all h-11 pr-10"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">Mínimo 6 caracteres. Entregue estas credenciales de forma segura a su cliente.</p>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => { setShowForm(false); resetForm(); }}
                                        className="h-10 px-5 text-slate-600 border-slate-300 hover:bg-slate-100"
                                        disabled={creating || !!successMsg}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                                        disabled={creating || !!successMsg}
                                    >
                                        {creating ? "Registrando en Supabase..." : "Crear Acceso"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : resettingUser ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <Key className="w-5 h-5 text-amber-500" />
                                Resetear Contraseña
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">Usuario: <strong className="text-slate-700">{resettingUser.email}</strong></p>

                            {errorMsg && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex gap-2 items-start border border-red-100">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {successMsg && (
                                <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm flex gap-2 items-center border border-emerald-100">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleResetPassword} className="space-y-4 relative z-10">
                                <div className="relative">
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">NUEVA CONTRASEÑA</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-slate-800 focus-visible:ring-amber-500 focus-visible:border-amber-500 transition-all h-11 pr-10"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => { setResettingUser(null); resetForm(); }}
                                        className="h-10 px-5 text-slate-600 border-slate-300 hover:bg-slate-100"
                                        disabled={resetting || !!successMsg}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="h-10 px-6 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20"
                                        disabled={resetting || !!successMsg}
                                    >
                                        {resetting ? "Actualizando..." : "Guardar Contraseña"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Cuentas Registradas</h3>
                                <Button
                                    size="sm"
                                    onClick={() => setShowForm(true)}
                                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800 border-0 h-8 gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Nuevo Acceso
                                </Button>
                            </div>

                            {loading ? (
                                <div className="py-12 flex justify-center text-slate-400">
                                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> Buscando en Supabase...</span>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-white">
                                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-slate-700 font-medium mb-1">Sin accesos configurados</h4>
                                    <p className="text-sm text-slate-500">Aún no hay usuarios de esta empresa autorizados a entrar al portal.</p>
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Usuario / Correo</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600">Creado en</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Última Conexión</th>
                                                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {users.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-800">{u.email}</td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                                        {u.created_at ? format(new Date(u.created_at), "d MMM yyyy, HH:mm", { locale: es }) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                                                        {u.last_sign_in_at ? format(new Date(u.last_sign_in_at), "d MMM yyyy, HH:mm", { locale: es }) : 'Nunca'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2"
                                                            title="Resetear Contraseña"
                                                            onClick={() => setResettingUser(u)}
                                                        >
                                                            <Key className="w-3.5 h-3.5 mr-1.5" />
                                                            <span className="text-xs">Reset</span>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="bg-white border-t border-slate-100 px-6 py-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="text-slate-600 h-10 w-full sm:w-auto">
                        Cerrar Panel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
