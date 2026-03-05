---
name: creador_de_habilidades
description: Capacidad para crear nuevas habilidades (Skills) dentro del espacio de trabajo siguiendo las convenciones de Antigravity, documentadas íntegramente en español.
---

# Skill: Creador de Habilidades

Esta habilidad permite al asistente generar la estructura completa de una nueva habilidad. Una "skill" es un conjunto de instrucciones y recursos que extienden las capacidades del asistente para tareas especializadas.

## Estructura de una Habilidad

Cada habilidad debe residir en su propia carpeta dentro del directorio `skills/` en la raíz del espacio de trabajo:

```text
skills/
  nombre_de_la_habilidad/
    SKILL.md (Requerido: Instrucciones principales)
    scripts/ (Opcional: Scripts de apoyo)
    resources/ (Opcional: Archivos de referencia, plantillas)
    examples/ (Opcional: Ejemplos de uso)
```

## Instrucciones para Crear una Nueva Habilidad

Cuando el usuario solicite crear una nueva habilidad, sigue estos pasos:

1.  **Definición de Nombre**: El nombre de la carpeta debe estar en `snake_case` (ejemplo: `mi_nueva_habilidad`).
2.  **Creación de Carpeta**: Crea la carpeta en `skills/<nombre_de_la_habilidad>`.
3.  **Archivo SKILL.md**: Crea el archivo `SKILL.md` con el siguiente formato obligatorio:
    *   **YAML Frontmatter**: Debe incluir `name` y `description`.
    *   **Contenido**: Instrucciones claras y detalladas sobre cómo usar la habilidad, sus herramientas asociadas y dependencias.
4.  **Recursos Adicionales**: Si la habilidad requiere scripts o archivos de ejemplo, créalos en sus subcarpetas correspondientes.

## Guía de Estilo

*   Toda la documentación interna del `SKILL.md` debe estar en **español**.
*   Las instrucciones deben ser accionables y fáciles de seguir para el asistente.
*   Siempre verifica si existen habilidades similares para evitar duplicidad o sugerir mejoras en lugar de una creación desde cero.

---

*Nota: Esta habilidad es meta-circular; se utiliza para expandir el sistema de habilidades en el idioma nativo del usuario.*
