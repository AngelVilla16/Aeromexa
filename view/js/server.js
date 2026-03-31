  const express = require('express');
  const mysql = require('mysql2/promise');
  const bcrypt = require('bcrypt');
  const session = require('express-session');
  const path = require('path');

  const app = express();
  const PORT = 3000;

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname))); 

  app.use(session({
    secret: 'aeromexa-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24 horas
  }));


  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',         // contraseña
    database: 'aeromexa_db',
    port: 3306
  };

  let db;

  async function connectDB() {
    try {
      db = await mysql.createConnection(dbConfig);
      console.log(' Conectado a MySQL');
      await initDB();
    } catch (err) {
      console.error(' Error al conectar a MySQL:', err.message);
      console.log('  Servidor corriendo sin base de datos (modo limitado)');
    }
  }

  async function initDB() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS reservaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        vuelo_origen VARCHAR(10) NOT NULL,
        vuelo_destino VARCHAR(10) NOT NULL,
        nombre_pasajero VARCHAR(200) NOT NULL,
        email_pasajero VARCHAR(150) NOT NULL,
        num_pasajeros INT DEFAULT 1,
        precio_total DECIMAL(10,2) NOT NULL,
        metodo_pago VARCHAR(50) NOT NULL,
        codigo_reserva VARCHAR(20) UNIQUE NOT NULL,
        status VARCHAR(30) DEFAULT 'confirmada',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);

    console.log(' Tablas verificadas/creadas');
  }

  function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
      next();
    } else {
      res.status(401).json({ success: false, message: 'No autenticado. Inicia sesión.' });
    }
  }


  app.post('/register', async (req, res) => {
    const { username, apellidos, usuario, email, password, confirm_password } = req.body;

    if (!username || !apellidos || !usuario || !email || !password) {
      return res.json({ success: false, message: 'Todos los campos son requeridos.' });
    }

    if (password !== confirm_password) {
      return res.json({ success: false, message: 'Las contraseñas no coinciden.' });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    if (!db) {
      return res.json({ success: false, message: 'Base de datos no disponible.' });
    }

    try {
      // Verificar si el usuario o email ya existe
      const [existing] = await db.execute(
        'SELECT id FROM usuarios WHERE email = ? OR usuario = ?',
        [email, usuario]
      );

      if (existing.length > 0) {
        return res.json({ success: false, message: 'El correo o nombre de usuario ya está registrado.' });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario
      await db.execute(
        'INSERT INTO usuarios (nombre, apellidos, usuario, email, password) VALUES (?, ?, ?, ?, ?)',
        [username, apellidos, usuario, email, hashedPassword]
      );

      res.json({ success: true, message: 'Cuenta creada exitosamente.' });

    } catch (err) {
      console.error('Error en registro:', err.message);
      res.json({ success: false, message: 'Error al registrar. Inténtalo de nuevo.' });
    }
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: 'Ingresa tu usuario y contraseña.' });
    }

    if (!db) {
      return res.json({ success: false, message: 'Base de datos no disponible.' });
    }

    try {
      const [users] = await db.execute(
        'SELECT * FROM usuarios WHERE email = ? OR usuario = ?',
        [username, username]
      );

      if (users.length === 0) {
        return res.json({ success: false, message: 'Usuario o contraseña incorrectos.' });
      }

      const user = users[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.json({ success: false, message: 'Usuario o contraseña incorrectos.' });
      }

      req.session.userId = user.id;
      req.session.userName = user.nombre;
      req.session.userEmail = user.email;

      res.json({ 
        success: true, 
        message: 'Sesión iniciada.',
        user: { nombre: user.nombre, email: user.email }
      });

    } catch (err) {
      console.error('Error en login:', err.message);
      res.json({ success: false, message: 'Error al iniciar sesión.' });
    }
  });

  app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
  });

  app.get('/api/me', requireAuth, async (req, res) => {
    try {
      const [users] = await db.execute(
        'SELECT id, nombre, apellidos, usuario, email, created_at FROM usuarios WHERE id = ?',
        [req.session.userId]
      );
      if (users.length === 0) return res.json({ success: false });
      res.json({ success: true, user: users[0] });
    } catch (err) {
      res.json({ success: false });
    }
  });

  app.post('/reservations', requireAuth, async (req, res) => {
    const { vuelo_origen, vuelo_destino, nombre_pasajero, email_pasajero, 
            num_pasajeros, precio_total, metodo_pago } = req.body;

    if (!db) return res.json({ success: false, message: 'BD no disponible.' });

    try {
      const codigo = 'AM-' + Date.now().toString(36).toUpperCase().substr(-6);

      await db.execute(
        `INSERT INTO reservaciones 
        (usuario_id, vuelo_origen, vuelo_destino, nombre_pasajero, email_pasajero, 
          num_pasajeros, precio_total, metodo_pago, codigo_reserva) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.session.userId, vuelo_origen, vuelo_destino, nombre_pasajero, 
        email_pasajero, num_pasajeros, precio_total, metodo_pago, codigo]
      );

      res.json({ success: true, codigo_reserva: codigo });

    } catch (err) {
      console.error('Error al reservar:', err.message);
      res.json({ success: false, message: 'Error al procesar la reservación.' });
    }
  });

  app.get('/api/reservaciones', requireAuth, async (req, res) => {
    if (!db) return res.json({ success: false, reservaciones: [] });

    try {
      const [rows] = await db.execute(
        'SELECT * FROM reservaciones WHERE usuario_id = ? ORDER BY created_at DESC',
        [req.session.userId]
      );
      res.json({ success: true, reservaciones: rows });
    } catch (err) {
      res.json({ success: false, reservaciones: [] });
    }
  });


  app.get('/search', (req, res) => {
    const { query } = req.query;
    res.json({ 
      success: true, 
      query,
      message: 'Conecta tu API de vuelos aquí (Amadeus, Sabre, etc.)'
    });
  });

  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`\n AeroMexa Server corriendo en http://localhost:${PORT}`);
      console.log(` Abre http://localhost:${PORT}/index.html para ver la app\n`);
    });
  });