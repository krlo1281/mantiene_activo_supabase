
import { Outlet, Link, useLocation } from "react-router-dom"

export default function Layout() {
    const location = useLocation();
    const sidebarOpen = true; // TODO: Implement mobile toggle state

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display text-[#0d141b] dark:text-white overflow-x-hidden">
            {/* Sidebar */}
            <aside className={`w-64 flex-col justify-between bg-white dark:bg-[#1a2632] border-r border-[#e7edf3] dark:border-[#2a3a4a] ${sidebarOpen ? 'hidden md:flex' : 'hidden'} sticky top-0 h-screen`}>
                <div className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col items-center justify-center gap-2 mb-6 mt-4">
                        <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                        <p className="text-[#4c739a] dark:text-[#94a3b8] text-sm font-medium leading-normal text-center">Consola Admin</p>
                    </div>
                    <nav className="flex flex-col gap-2">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-[#e7edf3] dark:hover:bg-[#2a3a4a]'}`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isActive('/dashboard') ? 'text-primary' : 'text-[#4c739a] dark:text-[#94a3b8]'}`}>dashboard</span>
                            <p className={`${isActive('/dashboard') ? 'text-primary' : 'text-[#0d141b] dark:text-[#e2e8f0]'} font-medium text-sm leading-normal`}>Panel Principal</p>
                        </Link>
                        <Link
                            to="/companies"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/companies') ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-[#e7edf3] dark:hover:bg-[#2a3a4a]'}`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isActive('/companies') ? 'text-primary' : 'text-[#4c739a] dark:text-[#94a3b8]'}`}>business</span>
                            <p className={`${isActive('/companies') ? 'text-primary' : 'text-[#0d141b] dark:text-[#e2e8f0]'} font-medium text-sm leading-normal`}>Empresas</p>
                        </Link>
                        <Link
                            to="/workers"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/workers') ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-[#e7edf3] dark:hover:bg-[#2a3a4a]'}`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isActive('/workers') ? 'text-primary' : 'text-[#4c739a] dark:text-[#94a3b8]'}`}>group</span>
                            <p className={`${isActive('/workers') ? 'text-primary' : 'text-[#0d141b] dark:text-[#e2e8f0]'} font-medium text-sm leading-normal`}>Usuarios</p>
                        </Link>
                        <Link
                            to="/dosimeters"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/dosimeters') ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-[#e7edf3] dark:hover:bg-[#2a3a4a]'}`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isActive('/dosimeters') ? 'text-primary' : 'text-[#4c739a] dark:text-[#94a3b8]'}`}>developer_board</span>
                            <p className={`${isActive('/dosimeters') ? 'text-primary' : 'text-[#0d141b] dark:text-[#e2e8f0]'} font-medium text-sm leading-normal`}>Dosímetros</p>
                        </Link>

                        <Link
                            to="/assignments"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/assignments') ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-[#e7edf3] dark:hover:bg-[#2a3a4a]'}`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isActive('/assignments') ? 'text-primary' : 'text-[#4c739a] dark:text-[#94a3b8]'}`}>assignment_ind</span>
                            <p className={`${isActive('/assignments') ? 'text-primary' : 'text-[#0d141b] dark:text-[#e2e8f0]'} font-medium text-sm leading-normal`}>Asignaciones</p>
                        </Link>
                        <Link
                            to="/readings"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/readings') ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-[#e7edf3] dark:hover:bg-[#2a3a4a]'}`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isActive('/readings') ? 'text-primary' : 'text-[#4c739a] dark:text-[#94a3b8]'}`}>sensor_occupied</span>
                            <p className={`${isActive('/readings') ? 'text-primary' : 'text-[#0d141b] dark:text-[#e2e8f0]'} font-medium text-sm leading-normal`}>Lecturas</p>
                        </Link>
                        <Link
                            to="/reports"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/reports') ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-[#e7edf3] dark:hover:bg-[#2a3a4a]'}`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isActive('/reports') ? 'text-primary' : 'text-[#4c739a] dark:text-[#94a3b8]'}`}>description</span>
                            <p className={`${isActive('/reports') ? 'text-primary' : 'text-[#0d141b] dark:text-[#e2e8f0]'} font-medium text-sm leading-normal`}>Reportes</p>
                        </Link>
                        <Link
                            to="/settings"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/settings') ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-[#e7edf3] dark:hover:bg-[#2a3a4a]'}`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isActive('/settings') ? 'text-primary' : 'text-[#4c739a] dark:text-[#94a3b8]'}`}>settings</span>
                            <p className={`${isActive('/settings') ? 'text-primary' : 'text-[#0d141b] dark:text-[#e2e8f0]'} font-medium text-sm leading-normal`}>Configuración</p>
                        </Link>
                    </nav>
                </div>
                <div className="p-4 border-t border-[#e7edf3] dark:border-[#2a3a4a]">
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#e7edf3] dark:hover:bg-[#2a3a4a] transition-colors" href="/login">
                        <span className="material-symbols-outlined text-[#4c739a] dark:text-[#94a3b8] text-[24px]">logout</span>
                        <p className="text-[#0d141b] dark:text-[#e2e8f0] text-sm font-medium leading-normal">Cerrar Sesión</p>
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark">
                <div className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
