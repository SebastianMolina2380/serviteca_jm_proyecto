const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'serviteca-jm-super-secret-key-change-me';
const defaultDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/serviteca';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || defaultDatabaseUrl,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

function buildErrorResponse(message, details = null) {
  return { error: message, details };
}

function buildUserResponse(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      rol: user.rol,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

async function comparePasswords(inputPassword, storedPassword) {
  if (!storedPassword) return false;
  if (/^\$2[aby]\$/.test(storedPassword)) {
    return bcrypt.compare(inputPassword, storedPassword);
  }
  return inputPassword === storedPassword;
}

function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json(buildErrorResponse('Token requerido.'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(buildErrorResponse('Token inválido o expirado.', error.message));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json(buildErrorResponse('No tienes permisos para acceder a este recurso.'));
    }
    next();
  };
}

async function findUserByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );
  return result.rows[0] || null;
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: 'No hay conexión a PostgreSQL o la base de datos no existe.',
      details: error.message,
    });
  }
});

async function handleLogin(req, res) {
  const { email, password, role } = req.body || {};

  if (!email || !password) {
    return res.status(400).json(buildErrorResponse('Email y contraseña son obligatorios.'));
  }

  try {
    const user = await findUserByEmail(email.trim());
    if (!user) {
      return res.status(401).json(buildErrorResponse('Credenciales inválidas.'));
    }

    const passwordIsValid = await comparePasswords(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json(buildErrorResponse('Credenciales inválidas.'));
    }

    if (role && role !== user.rol) {
      return res.status(403).json(buildErrorResponse('El usuario no tiene el rol seleccionado.'));
    }

    const token = signToken(user);
    const safeUser = buildUserResponse(user);

    return res.json({
      ok: true,
      message: 'Inicio de sesión correcto',
      token,
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error al validar usuario.', error.message));
  }
}

app.post('/api/login', async (req, res) => handleLogin(req, res));
app.post('/api/auth/login', async (req, res) => handleLogin(req, res));

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1 LIMIT 1', [req.user.sub]);
    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Usuario no encontrado.'));
    }

    return res.json({ user: buildUserResponse(result.rows[0]) });
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error consultando perfil.', error.message));
  }
});

app.get('/api/dashboard', authMiddleware, requireRole('admin', 'recep', 'tecnico'), async (req, res) => {
  try {
    const [usuarios, clientes, citas, inventario, facturas] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM usuarios'),
      pool.query('SELECT COUNT(*)::int AS total FROM clientes'),
      pool.query('SELECT COUNT(*)::int AS total FROM citas'),
      pool.query('SELECT COUNT(*)::int AS total FROM inventario'),
      pool.query('SELECT COUNT(*)::int AS total FROM facturas'),
    ]);

    return res.json({
      usuarios: Number(usuarios.rows[0].total),
      clientes: Number(clientes.rows[0].total),
      citas: Number(citas.rows[0].total),
      inventario: Number(inventario.rows[0].total),
      facturas: Number(facturas.rows[0].total),
    });
  } catch (error) {
    return res.status(500).json(buildErrorResponse('No se pudo consultar el dashboard.', error.message));
  }
});

app.get('/api/usuarios', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY id');
    res.json(result.rows.map(buildUserResponse));
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error consultando usuarios.', error.message));
  }
});

app.post('/api/usuarios', authMiddleware, requireRole('admin'), async (req, res) => {
  const { nombre, email, password, rol } = req.body || {};

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json(buildErrorResponse('Nombre, email, contraseña y rol son obligatorios.'));
  }

  if (password.length < 6) {
    return res.status(400).json(buildErrorResponse('La contraseña debe tener al menos 6 caracteres.'));
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol)
       VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, nombre, email, rol, creado_en`,
      [nombre.trim(), email.trim(), passwordHash, rol]
    );

    if (rol === 'cliente') {
      await pool.query(
        `INSERT INTO clientes (nombre, email, usuario_id)
         VALUES ($1, LOWER($2), $3)
         ON CONFLICT (usuario_id) DO NOTHING`,
        [nombre.trim(), email.trim(), result.rows[0].id]
      );
    }

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(buildErrorResponse('Ya existe un usuario con ese correo.'));
    }
    return res.status(500).json(buildErrorResponse('Error creando usuario.', error.message));
  }
});

app.get('/api/clientes', authMiddleware, requireRole('admin', 'recep', 'tecnico'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error consultando clientes.', error.message));
  }
});

app.post('/api/clientes', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { nombre, documento, telefono, email, direccion } = req.body || {};
  if (!nombre) {
    return res.status(400).json(buildErrorResponse('El nombre es obligatorio.'));
  }

  try {
    const result = await pool.query(
      `INSERT INTO clientes (nombre, documento, telefono, email, direccion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, documento || null, telefono || null, email || null, direccion || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error creando cliente.', error.message));
  }
});

app.put('/api/clientes/:id', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { id } = req.params;
  const { nombre, documento, telefono, email, direccion } = req.body || {};

  try {
    const result = await pool.query(
      `UPDATE clientes
       SET nombre = COALESCE($1, nombre),
           documento = COALESCE($2, documento),
           telefono = COALESCE($3, telefono),
           email = COALESCE($4, email),
           direccion = COALESCE($5, direccion)
       WHERE id = $6
       RETURNING *`,
      [nombre || null, documento || null, telefono || null, email || null, direccion || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Cliente no encontrado.'));
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error actualizando cliente.', error.message));
  }
});

app.delete('/api/clientes/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Cliente no encontrado.'));
    }
    return res.json({ ok: true, deleted: result.rows[0] });
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error eliminando cliente.', error.message));
  }
});

app.get('/api/vehiculos', authMiddleware, requireRole('admin', 'recep', 'tecnico'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehiculos ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error consultando vehículos.', error.message));
  }
});

app.get('/api/mi/vehiculos', authMiddleware, requireRole('cliente'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*
       FROM vehiculos v
       INNER JOIN clientes c ON c.id = v.cliente_id
       WHERE c.usuario_id = $1
       ORDER BY v.id`,
      [req.user.sub]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error consultando tus vehículos.', error.message));
  }
});

app.post('/api/mi/vehiculos', authMiddleware, requireRole('cliente'), async (req, res) => {
  const { placa, marca, modelo, anio, color } = req.body || {};
  if (!placa || !marca || !modelo) {
    return res.status(400).json(buildErrorResponse('Placa, marca y modelo son obligatorios.'));
  }

  try {
    const clientResult = await pool.query(
      'SELECT id FROM clientes WHERE usuario_id = $1 LIMIT 1',
      [req.user.sub]
    );
    if (clientResult.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Tu usuario no tiene un perfil de cliente asociado.'));
    }

    const result = await pool.query(
      `INSERT INTO vehiculos (cliente_id, placa, marca, modelo, anio, color, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'activo')
       RETURNING *`,
      [clientResult.rows[0].id, placa.trim().toUpperCase(), marca.trim(), modelo.trim(), anio || null, color || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(buildErrorResponse('Ya existe un vehículo con esa placa.'));
    }
    return res.status(500).json(buildErrorResponse('Error registrando vehículo.', error.message));
  }
});

app.post('/api/vehiculos', authMiddleware, requireRole('admin', 'recep', 'tecnico'), async (req, res) => {
  const { cliente_id, placa, marca, modelo, anio, color, estado } = req.body || {};
  if (!placa) {
    return res.status(400).json(buildErrorResponse('La placa es obligatoria.'));
  }

  try {
    const result = await pool.query(
      `INSERT INTO vehiculos (cliente_id, placa, marca, modelo, anio, color, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [cliente_id || null, placa, marca || null, modelo || null, anio || null, color || null, estado || 'activo']
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error creando vehículo.', error.message));
  }
});

app.put('/api/vehiculos/:id', authMiddleware, requireRole('admin', 'recep', 'tecnico'), async (req, res) => {
  const { id } = req.params;
  const { cliente_id, placa, marca, modelo, anio, color, estado } = req.body || {};

  try {
    const result = await pool.query(
      `UPDATE vehiculos
       SET cliente_id = COALESCE($1, cliente_id),
           placa = COALESCE($2, placa),
           marca = COALESCE($3, marca),
           modelo = COALESCE($4, modelo),
           anio = COALESCE($5, anio),
           color = COALESCE($6, color),
           estado = COALESCE($7, estado)
       WHERE id = $8
       RETURNING *`,
      [cliente_id || null, placa || null, marca || null, modelo || null, anio || null, color || null, estado || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Vehículo no encontrado.'));
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error actualizando vehículo.', error.message));
  }
});

app.delete('/api/vehiculos/:id', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM vehiculos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Vehículo no encontrado.'));
    }
    return res.json({ ok: true, deleted: result.rows[0] });
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error eliminando vehículo.', error.message));
  }
});

app.get('/api/citas', authMiddleware, requireRole('admin', 'recep', 'tecnico'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM citas ORDER BY fecha, hora');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error consultando citas.', error.message));
  }
});

app.post('/api/citas', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { cliente_id, vehiculo_id, fecha, hora, servicio, estado } = req.body || {};
  if (!cliente_id || !vehiculo_id || !fecha || !hora || !servicio) {
    return res.status(400).json(buildErrorResponse('Faltan datos requeridos para la cita.'));
  }

  try {
    const result = await pool.query(
      `INSERT INTO citas (cliente_id, vehiculo_id, fecha, hora, servicio, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [cliente_id, vehiculo_id, fecha, hora, servicio, estado || 'programada']
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error creando cita.', error.message));
  }
});

app.put('/api/citas/:id', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { id } = req.params;
  const { cliente_id, vehiculo_id, fecha, hora, servicio, estado } = req.body || {};

  try {
    const result = await pool.query(
      `UPDATE citas
       SET cliente_id = COALESCE($1, cliente_id),
           vehiculo_id = COALESCE($2, vehiculo_id),
           fecha = COALESCE($3, fecha),
           hora = COALESCE($4, hora),
           servicio = COALESCE($5, servicio),
           estado = COALESCE($6, estado)
       WHERE id = $7
       RETURNING *`,
      [cliente_id || null, vehiculo_id || null, fecha || null, hora || null, servicio || null, estado || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Cita no encontrada.'));
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error actualizando cita.', error.message));
  }
});

app.delete('/api/citas/:id', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM citas WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Cita no encontrada.'));
    }
    return res.json({ ok: true, deleted: result.rows[0] });
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error eliminando cita.', error.message));
  }
});

app.get('/api/inventario', authMiddleware, requireRole('admin', 'recep', 'tecnico'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventario ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error consultando inventario.', error.message));
  }
});

app.post('/api/inventario', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { nombre, categoria, cantidad, precio, proveedor, minimo } = req.body || {};
  if (!nombre) {
    return res.status(400).json(buildErrorResponse('El nombre del repuesto es obligatorio.'));
  }

  try {
    const result = await pool.query(
      `INSERT INTO inventario (nombre, categoria, cantidad, precio, proveedor, minimo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nombre, categoria || null, cantidad || 0, precio || 0, proveedor || null, minimo || 0]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error creando inventario.', error.message));
  }
});

app.put('/api/inventario/:id', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, cantidad, precio, proveedor, minimo } = req.body || {};

  try {
    const result = await pool.query(
      `UPDATE inventario
       SET nombre = COALESCE($1, nombre),
           categoria = COALESCE($2, categoria),
           cantidad = COALESCE($3, cantidad),
           precio = COALESCE($4, precio),
           proveedor = COALESCE($5, proveedor),
           minimo = COALESCE($6, minimo)
       WHERE id = $7
       RETURNING *`,
      [nombre || null, categoria || null, cantidad || null, precio || null, proveedor || null, minimo || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Registro no encontrado.'));
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error actualizando inventario.', error.message));
  }
});

app.delete('/api/inventario/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM inventario WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Registro no encontrado.'));
    }
    return res.json({ ok: true, deleted: result.rows[0] });
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error eliminando inventario.', error.message));
  }
});

app.get('/api/facturas', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM facturas ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error consultando facturas.', error.message));
  }
});

app.post('/api/facturas', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { cliente_id, numero_factura, total, estado } = req.body || {};
  if (!cliente_id || !numero_factura) {
    return res.status(400).json(buildErrorResponse('Faltan datos básicos de la factura.'));
  }

  try {
    const result = await pool.query(
      `INSERT INTO facturas (cliente_id, numero_factura, total, estado)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cliente_id, numero_factura, total || 0, estado || 'pendiente']
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error creando factura.', error.message));
  }
});

app.put('/api/facturas/:id', authMiddleware, requireRole('admin', 'recep'), async (req, res) => {
  const { id } = req.params;
  const { cliente_id, numero_factura, total, estado } = req.body || {};

  try {
    const result = await pool.query(
      `UPDATE facturas
       SET cliente_id = COALESCE($1, cliente_id),
           numero_factura = COALESCE($2, numero_factura),
           total = COALESCE($3, total),
           estado = COALESCE($4, estado)
       WHERE id = $5
       RETURNING *`,
      [cliente_id || null, numero_factura || null, total || null, estado || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Factura no encontrada.'));
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error actualizando factura.', error.message));
  }
});

app.delete('/api/facturas/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM facturas WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json(buildErrorResponse('Factura no encontrada.'));
    }
    return res.json({ ok: true, deleted: result.rows[0] });
  } catch (error) {
    return res.status(500).json(buildErrorResponse('Error eliminando factura.', error.message));
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, `${page}.html`);

  if (page.includes('.') || page === 'api') {
    return next();
  }

  if (require('fs').existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  next();
});

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
  console.log('Base de datos esperada en:', process.env.DATABASE_URL || defaultDatabaseUrl);
});
