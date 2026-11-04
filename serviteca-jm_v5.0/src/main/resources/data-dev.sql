-- ============================================================
-- DATOS DE PRUEBA · USUARIOS (SOLO PERFIL DEV)
-- ============================================================
-- Cargado por spring.sql.init (application-dev.properties).
-- NO forma parte de las migraciones de Flyway y no se ejecuta
-- en producción.
--
-- Idempotente: ON CONFLICT DO NOTHING evita duplicados tanto por
-- uk_usuario_correo como por uk_usuario_numero_doc.
--
-- Credenciales de prueba (no usar en un entorno real):
--     ADMIN   -> AdminServiteca2026*
--     CLIENTE -> ClienteServiteca2026*
--
-- Los correos usan el dominio reservado ".test" (RFC 2606) para
-- que no se envíen mensajes a buzones reales.
-- ============================================================

INSERT INTO usuario (
    nombre,
    numero_doc,
    tipo_documento,
    correo,
    contrasena,
    rol,
    estado,
    telefono,
    ciudad,
    direccion
)
VALUES
    (
        'Sebastian Vargas',
        '1052348796',
        'CC',
        'sebastian.vargas@serviteca.test',
        '$2a$10$wi6Ulu9jMgWTwspSGSqP3eJKQvwHyKbfEerAihF3k6jwjGnRyLOfO',
        'ADMIN',
        'ACTIVO',
        '3105550101',
        'Tunja',
        'Carrera 10 # 20-30'
    ),
    (
        'Camila Ortiz',
        '1005874123',
        'CC',
        'camila.ortiz@serviteca.test',
        '$2a$10$aPlRLWz1JHb4I2mzkQw4reIrDWDkRAfNoBs15NL1/.kiBcAbMhOXq',
        'CLIENTE',
        'ACTIVO',
        '3115550102',
        'Sogamoso',
        'Carrera 5 # 12-18'
    ),
    (
        'Mateo Silva',
        '1098745632',
        'CC',
        'mateo.silva@serviteca.test',
        '$2a$10$7EkDG/sGwwfJz75XEZiHW.tDgN64G65DdfIMNRgyRUhVmxmRaRYUe',
        'CLIENTE',
        'ACTIVO',
        '3125550103',
        'Chiquinquirá',
        'Calle 4 # 7-21'
    ),
    (
        'Natalia Castro',
        '1012457896',
        'CC',
        'natalia.castro@serviteca.test',
        '$2a$10$PH6cfNqLKHDjRwfUw0IWmuGfIZT/BH8TTc4tgFe3fAiExxI5UsOsi',
        'ADMIN',
        'ACTIVO',
        '3135550104',
        'Duitama',
        'Calle 15 # 8-45'
    ),
    (
        'Oscar Fuentes',
        '1045789632',
        'CC',
        'oscar.fuentes@serviteca.test',
        '$2a$10$vkEgDzryfR.eI/C9zR.zLuND0yD2UO.fYevp0CqmhA5IRVzR5lMHy',
        'CLIENTE',
        'ACTIVO',
        '3145550105',
        'Villa de Leyva',
        'Carrera 6 # 3-90'
    )
ON CONFLICT DO NOTHING;
