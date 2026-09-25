CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'admin',
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  documento VARCHAR(30),
  telefono VARCHAR(30),
  email VARCHAR(150),
  direccion VARCHAR(200),
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS vehiculos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  placa VARCHAR(20) NOT NULL UNIQUE,
  marca VARCHAR(80),
  modelo VARCHAR(80),
  anio INTEGER,
  color VARCHAR(50),
  estado VARCHAR(30) DEFAULT 'activo',
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  vehiculo_id INTEGER REFERENCES vehiculos(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  servicio VARCHAR(120) NOT NULL,
  estado VARCHAR(30) DEFAULT 'programada',
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  categoria VARCHAR(80),
  cantidad INTEGER NOT NULL DEFAULT 0,
  precio NUMERIC(12,2) NOT NULL DEFAULT 0,
  proveedor VARCHAR(120),
  minimo INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facturas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  numero_factura VARCHAR(40) NOT NULL UNIQUE,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado VARCHAR(30) DEFAULT 'pendiente',
  fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO usuarios (nombre, email, password, rol)
VALUES
  ('Administrador', 'admin@serviteca.com', '$2a$10$VQRdM7OUlb54zV4Kv5rljuALx1rcpOwTFTkrMzEbIdP42DVCevHh.', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO clientes (nombre, documento, telefono, email, direccion)
VALUES
  ('Ana Torres', '1023456789', '3001112233', 'ana@correo.com', 'Calle 12 #45-67'),
  ('Carlos Rojas', '1023456790', '3102223344', 'carlos@correo.com', 'Carrera 8 #10-20')
ON CONFLICT DO NOTHING;

INSERT INTO vehiculos (cliente_id, placa, marca, modelo, anio, color, estado)
VALUES
  (1, 'ABC123', 'Toyota', 'Corolla', 2022, 'Blanco', 'activo'),
  (2, 'XYZ789', 'Renault', 'Logan', 2021, 'Gris', 'activo')
ON CONFLICT (placa) DO NOTHING;

INSERT INTO citas (cliente_id, vehiculo_id, fecha, hora, servicio, estado)
VALUES
  (1, 1, CURRENT_DATE + INTERVAL '1 day', '09:00:00', 'Mantenimiento general', 'programada'),
  (2, 2, CURRENT_DATE + INTERVAL '2 day', '14:30:00', 'Cambio de aceite', 'programada')
ON CONFLICT DO NOTHING;

INSERT INTO inventario (nombre, categoria, cantidad, precio, proveedor, minimo)
VALUES
  ('Filtro de aceite', 'Motor', 18, 25000, 'AutoPartes JM', 5),
  ('Pastilla de freno', 'Frenos', 12, 45000, 'Mecánica Central', 4),
  ('Batería 12V', 'Eléctrico', 6, 180000, 'ElectroAutos', 2)
ON CONFLICT DO NOTHING;

INSERT INTO facturas (cliente_id, numero_factura, total, estado, fecha)
VALUES
  (1, 'FAC-1001', 320000, 'pagada', NOW()),
  (2, 'FAC-1002', 185000, 'pendiente', NOW())
ON CONFLICT (numero_factura) DO NOTHING;
