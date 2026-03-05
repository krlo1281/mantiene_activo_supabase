1. Introducción

El presente documento define los requerimientos funcionales y no funcionales de un Sistema de Gestión de Dosimetría Personal, destinado a una empresa que realiza el control dosimétrico de trabajadores ocupacionalmente expuestos a radiación ionizante.

El sistema está concebido para ejecutarse inicialmente de manera local en una PC, utilizando una base de datos PostgreSQL, con una arquitectura preparada para su migración futura a un entorno web en la nube, manteniendo la misma base de código tanto en backend como en frontend.

2. Objetivo del sistema

Centralizar la información dosimétrica
Gestionar usuarios, dosímetros y lecturas
Reducir errores administrativos
Garantizar trazabilidad completa
Generar reportes oficiales
Escalar a múltiples usuarios y acceso web sin rediseño

3. Alcance
3.1 Incluye
Gestión de empresas cliente
Gestión de trabajadores
Gestión de dosímetros físicos reutilizables
Control de periodos mensuales
Asignación de dosímetros por periodo
Registro de lecturas Hp(10) y Hp(0.07)
Importación de lecturas desde archivos CSV
Generación de reportes
Interfaces web modernas y profesionales

3.2 No incluye (fase inicial)

Facturación
Firma digital
Integración directa con lectores
Notificaciones automáticas

4. Enfoque de despliegue (LOCAL → NUBE)
4.1 Fase inicial – Ejecución local

Aplicación web ejecutándose en localhost
Un único usuario
Base de datos PostgreSQL local
No requiere conexión a internet
4.2 Fase futura – Ejecución en nube

Despliegue en servidor web
Acceso vía internet
Múltiples usuarios concurrentes
PostgreSQL como base de datos central
Mismo frontend y backend

📌 El sistema debe diseñarse bajo el principio
“local-first, cloud-ready”.

5. Actores del sistema

Administrador: control total del sistema
Operador: carga y validación de información

6. Definiciones clave

Periodo
Dosímetro
Asignación
Lectura
Fecha de lectura real
Lecturas Hp(10) y Hp(0.07)

7. Reglas de negocio

RN-01. Un trabajador puede tener más de un dosímetro por periodo.
RN-02. Un dosímetro no puede asignarse más de una vez en el mismo periodo.
RN-03. Un dosímetro no puede reasignarse sin lectura registrada.
RN-04. Cada asignación tiene una única lectura válida.
RN-05. La fecha de lectura puede diferir del periodo asignado.
RN-06. Un dosímetro puede existir sin haber sido asignado nunca.
RN-07. Los periodos cerrados no pueden modificarse.
RN-08. Las lecturas pueden cargarse manualmente o desde CSV.

8. Estructura de información (modelo lógico)

Empresas
Trabajadores
Dosímetros
Periodos
Asignaciones
Lecturas
Importaciones CSV
Lecturas crudas
Auditoría
Todas las estructuras deben ser compatibles con PostgreSQL.

9. Importación de lecturas CSV

Selección manual del periodo
La fecha del archivo no define el periodo
Validación de códigos de dosímetro
Prevención de duplicados
Vista previa antes de confirmar

10. Interfaces de usuario (Frontend)
10.1 Tipo de aplicación
Aplicación web
Ejecutable localmente y en nube
Acceso mediante navegador web moderno
10.2 Tecnologías de frontend
El sistema utilizará las siguientes tecnologías para el frontend:
🧩 Framework principal

React como framework de interfaz
Vite como entorno de desarrollo y empaquetado
Motivos:

Alto rendimiento
Escalabilidad
Separación clara entre frontend y backend
Compatibilidad local y web

🎨 Estilos y diseño visual

Tailwind CSS como sistema de estilos
Enfoque minimalista, profesional y moderno
Diseño claro y adecuado para entornos médicos y técnicos

🧱 Componentes de interfaz

shadcn/ui como base de componentes reutilizables
Componentes accesibles y personalizables
Uso de:

Tablas
Formularios
Diálogos modales
Alertas
Notificaciones
Selectores de fecha

10.3 Principios de diseño UI/UX

Diseño desktop-first
Interfaces limpias y sin saturación visual
Navegación lateral (sidebar)
Jerarquía visual clara
Colores neutros
Estados visuales claros:
Periodo abierto / cerrado
Lectura pendiente / registrada
Dosímetro disponible / asignado

11. Pantallas del sistema

Cantidad estimada: 13 a 18 pantallas
Incluye:
Login
Dashboard
Empresas
Trabajadores
Dosímetros
Periodos
Asignaciones
Lecturas
Importar CSV
Reportes
Auditoría
Configuración básica

12. Mapa de navegación
Login
 └── Dashboard
     ├── Empresas
     ├── Trabajadores
     ├── Dosímetros
     ├── Periodos
     ├── Asignaciones
     ├── Lecturas
     ├── Importar CSV
     ├── Reportes
     └── Auditoría

13. Reportes

Reporte mensual por empresa
Reporte individual por trabajador
Historial por dosímetro
Exportación PDF
Exportación CSV/Excel (opcional)

14. Requerimientos no funcionales

Aplicación web portable
Ejecución local sin internet
Base de datos PostgreSQL
Frontend desacoplado del backend
Escalable a múltiples usuarios
Seguridad por roles
Arquitectura mantenible

15. Flujo operativo mensual

Crear periodo
Asignar dosímetros
Recepción
Lectura
Importar CSV
Validar
Reportar
Cerrar periodo