# BITÁCORA DEL PROYECTO — SERVITECA

**Proyecto:** Sistema de Gestión Serviteca JM (PRODISJM)
**Equipo responsable:** EQUIPO-PRODISJM
**Metodología:** Ciclo de vida del software en 7 fases

---

## FASE 1: PLANIFICACIÓN / SEGUIMIENTO

| N° | Fecha | Hora | Actividad / Tarea Realizada | Avances / Resultados Obtenidos | Observaciones e Ideas Nuevas | Obstáculos / Problemas Detectados | Próximas Acciones o Recomendaciones |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | 2026-04-09 | 08:00:00 | Definición inicial del alcance del proyecto y armado del cronograma de trabajo. | Cronograma general aprobado por el equipo con 5 fases o sprints bien definidos. | Conviene dar prioridad alta al módulo de inventario de repuestos y aceites desde el inicio. | Tiempo limitado del administrador del taller para atendernos durante el horario laboral. | Programar las sesiones de levantamiento de información temprano en la mañana antes del flujo fuerte de clientes. |
| 2 | 2026-04-09 | 10:00:00 | Reunión para definir roles de cada integrante y configurar el repositorio de código. | Repositorio en GitHub creado y estructurado con ramas principales para desarrollo ordenado. | Establecer como regla obligatoria revisar el código entre compañeros antes de unir cambios. | Un integrante del equipo tenía poca práctica con el flujo de trabajo en Git. | Realizar una sesión corta de práctica de Git para unificar la forma de trabajar. |

---

## FASE 2: ANÁLISIS DE REQUISITOS

| N° | Fecha | Hora | Actividad / Tarea Realizada | Avances / Resultados Obtenidos | Observaciones e Ideas Nuevas | Obstáculos / Problemas Detectados | Próximas Acciones o Recomendaciones |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 3 | 2025-06-20 | 18:00:00 | Levantamiento detallado de lo que debe hacer el sistema para gestionar las órdenes de servicio del taller. | Documento de requisitos listo con 12 casos de uso que cubren desde el ingreso del vehículo hasta el cobro. | Sería muy útil enviar mensajes automáticos al cliente para recordarle su próximo cambio de aceite. | Dudas sobre la forma exacta en que se deben desglosar el IVA y la mano de obra en el recibo. | Agendar una llamada rápida con el contador de la serviteca para aclarar las reglas tributarias. |
| 4 | 2025-06-20 | 18:00:00 | Definición de requisitos de seguridad y niveles de acceso según el tipo de trabajador. | Matriz de permisos aprobada para 3 perfiles principales: Administrador (`ADMIN`), Técnico (`TECNICO`) y Cliente (`CLIENTE`), tal como quedaron implementados en el sistema. | Asegurar el cifrado de contraseñas y datos sensibles de los propietarios de los vehículos. | Falta de claridad inicial sobre la política de manejo de datos personales de clientes. | Incluir un texto simple de autorización de datos (Habeas Data) al registrar un cliente nuevo. |

---

## FASE 3: DISEÑO

| N° | Fecha | Hora | Actividad / Tarea Realizada | Avances / Resultados Obtenidos | Observaciones e Ideas Nuevas | Obstáculos / Problemas Detectados | Próximas Acciones o Recomendaciones |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 5 | 2026-02-26 | 07:00:00 | Diseño del modelo de la base de datos relacional para organizar toda la información de la serviteca. | Diagrama con tablas conectadas para Clientes, Vehículos, Órdenes, Repuestos y Facturación. | Estructurar las tablas pensando en que un mismo cliente puede registrar varios vehículos a su nombre. | Dificultad para relacionar de forma limpia una orden de servicio con múltiples repuestos utilizados. | Implementar una tabla intermedia llamada Detalle_Orden para asociar cantidades y precios. |
| 6 | 2026-02-26 | 07:00:00 | Elaboración de las pantallas visuales (prototipos) para la recepción de vehículos y cobro en caja. | Prototipo navegable en Figma validado para ver cómo se navegará en la aplicación. | Diseñar las pantallas con botones amplios para que los mecánicos puedan usarlas cómodamente en tablets. | No contábamos con el logotipo oficial ni la paleta de colores definitiva del negocio. | Presentar tres combinaciones de colores sencillas al cliente para que elija la principal. |

---

## FASE 4: DESARROLLO

| N° | Fecha | Hora | Actividad / Tarea Realizada | Avances / Resultados Obtenidos | Observaciones e Ideas Nuevas | Obstáculos / Problemas Detectados | Próximas Acciones o Recomendaciones |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 7 | 2025-07-26 | 18:00:00 | Programación del módulo de registro de clientes y vinculación de sus vehículos por placa. | Módulo funcional que permite crear, buscar y actualizar datos del cliente y sus automóviles. Se implementó la restricción de unicidad sobre la placa en la base de datos, por lo que un mismo vehículo no puede quedar registrado dos veces. | Poner validaciones automáticas para que las placas se conviertan a mayúsculas sin guiones. | Riesgo de registrar dos veces la misma placa si se escribe diferente. | Completar la normalización automática de las placas en mayúsculas y sin guiones en todos los formularios del sistema (hasta ahora solo está aplicada en el registro de nueva cita). |
| 8 | 2025-07-26 | 18:00:00 | Programación del módulo de órdenes de trabajo y descuento automático de repuestos del inventario. | Código listo que descuenta del stock las piezas utilizadas al cerrar una reparación. | Generar un aviso visual en pantalla cuando un repuesto (ej. filtro de aceite) se esté agotando. | Errores cuando dos personas intentaban actualizar el stock al mismo tiempo. | Aplicar transacciones seguras en la base de datos para evitar diferencias en el inventario. |

---

## FASE 5: PRUEBAS E INTEGRACIÓN

| N° | Fecha | Hora | Actividad / Tarea Realizada | Avances / Resultados Obtenidos | Observaciones e Ideas Nuevas | Obstáculos / Problemas Detectados | Próximas Acciones o Recomendaciones |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 9 | 2026-08-10 | 09:00:00 | Ejecución de pruebas de verificación sobre el módulo de cobros para comprobar que el cálculo de totales y facturas no falle. | Se verificó el correcto funcionamiento de los cálculos de totales y facturas del módulo de cobros mediante pruebas de verificación puntuales. | Dejar creadas pruebas automáticas que se ejecuten cada vez que modifiquemos algo en el futuro. | Un pequeño error de redondeo en los centavos al aplicar descuentos especiales a clientes habituales. | Ajustar la función de redondeo a dos decimales exactos en los cálculos de cobro. |
| 10 | 2026-08-10 | 11:00:00 | Pruebas reales de uso con el personal del taller operando el software directamente. | Lista de observaciones del equipo de trabajo centradas en la agilidad de uso en el taller. | Habilitar un buscador rápido por placa en la pantalla principal para no perder tiempo al atender. | A los mecánicos con menos experiencia digital se les dificultaba leer textos muy pequeños. | Aumentar el tamaño de la letra y resaltar los botones de las acciones principales. |

---

## FASE 6: IMPLEMENTACIÓN / DESPLIEGUE

| N° | Fecha | Hora | Actividad / Tarea Realizada | Avances / Resultados Obtenidos | Observaciones e Ideas Nuevas | Obstáculos / Problemas Detectados | Próximas Acciones o Recomendaciones |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 11 | 2026-10-19 | 18:00:00 | Instalación y configuración del sistema en el equipo principal de la serviteca. | Sistema instalado, conectado a la base de datos local y listo para uso diario. | Dejar programada una copia de respaldo automática del sistema todas las noches a las 11 PM. | La señal de Wi-Fi del taller fluctuaba un poco cerca del área de elevadores. | Conectar el computador principal por cable de red directo para asegurar conexión estable. |
| 12 | 2026-10-19 | 14:00:00 | Capacitación práctica con los mecánicos, asesores de servicio y la persona encargada de caja. | Todo el equipo capacitado y entrega de una guía rápida ilustrada de uso diario. | Grabar 3 videos cortos de un minuto mostrando cómo crear una orden, buscar un repuesto y cobrar. | Confusión sobre a quién pedir autorización cuando hay que hacer un descuento extraordinario. | Dejar claro en el sistema qué pantalla requiere clave de administrador para autorizar. |

---

## FASE 7: MANTENIMIENTO / MEJORA

| N° | Fecha | Hora | Actividad / Tarea Realizada | Avances / Resultados Obtenidos | Observaciones e Ideas Nuevas | Obstáculos / Problemas Detectados | Próximas Acciones o Recomendaciones |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 13 | 2026-04-10 | 09:00:00 | Seguimiento durante los primeros días de uso y solución de detalles reportados por los usuarios. | Se solucionaron 4 detalles menores relacionados con el formato de impresión de la tirilla de caja. | Optimizar el reporte mensual para que calcule las ganancias netas de manera instantánea. | La pantalla de historial tardaba en cargar al consultar periodos con más de 1.000 servicios. | Dividir los resultados de las búsquedas en páginas (paginación) para que cargue velozmente. |
| 14 | 2026-04-10 | 15:00:00 | Reunión de cierre de fase y recopilación de ideas para la versión 2.0 del software. | Documento con propuestas futuras como la reserva de citas en línea por parte de los clientes. | Explorar la integración directa con WhatsApp Web para enviar avisos de entrega del vehículo. | Evaluar los costos de licencias o herramientas de terceros para envío masivo de mensajes. | Cotizar opciones de mensajería para incluir esa función en el siguiente ciclo de desarrollo. |

---

## CRONOLOGÍA DE LAS FASES

| Fase | Fecha registrada | Orden cronológico real |
| :--- | :---: | :---: |
| 1. Planificación / Seguimiento | 2026-04-09 | 3.º |
| 2. Análisis de Requisitos | 2025-06-20 | 1.º |
| 3. Diseño | 2026-02-26 | 2.º |
| 4. Desarrollo | 2025-07-26 | 5.º |
| 5. Pruebas e Integración | 2026-08-10 | 6.º |
| 6. Implementación / Despliegue | 2026-10-19 | 7.º |
| 7. Mantenimiento / Mejora | 2026-04-10 | 4.º |

*Nota: el orden cronológico de las fechas registradas no coincide con el orden secuencial de las fases del ciclo de vida. Ver observaciones entregadas junto con este documento.*
