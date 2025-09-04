const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/project_tracker.db' : 'project_tracker.db';
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database successfully');
  }
});

// Initialize database tables
db.serialize(() => {
  console.log('Creating database tables...');
  
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('un-habitat', 'donor', 'government'))
  )`, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('Users table ready');
  });

  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Planning',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating projects table:', err);
    else console.log('Projects table ready');
  });

  // Expenditures table
  db.run(`CREATE TABLE IF NOT EXISTS expenditures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  )`, (err) => {
    if (err) console.error('Error creating expenditures table:', err);
    else console.log('Expenditures table ready');
  });
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'un-habitat-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (roles.includes(req.session.userRole)) {
      next();
    } else {
      res.status(403).send('Access denied');
    }
  };
};

// Routes
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
      [username, hashedPassword, role], function(err) {
        if (err) {
          res.json({ success: false, message: 'Username already exists' });
        } else {
          res.json({ success: true, message: 'Account created successfully' });
        }
      });
  } catch (error) {
    res.json({ success: false, message: 'Registration failed' });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      res.json({ success: false, message: 'Invalid credentials' });
      return;
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.userRole = user.role;
      res.json({ success: true, role: user.role });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  });
});

app.get('/dashboard', requireAuth, (req, res) => {
  const role = req.session.userRole;
  res.sendFile(path.join(__dirname, 'public', `${role}-dashboard.html`));
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// API Routes
app.get('/api/projects', requireAuth, (req, res) => {
  db.all('SELECT * FROM projects', (err, projects) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(projects);
    }
  });
});

app.post('/api/projects', requireAuth, requireRole(['un-habitat']), (req, res) => {
  const { name, description, status } = req.body;
  
  db.run('INSERT INTO projects (name, description, status) VALUES (?, ?, ?)', 
    [name, description, status], function(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to create project' });
      } else {
        res.json({ id: this.lastID, name, description, status });
      }
    });
});

app.put('/api/projects/:id', requireAuth, requireRole(['un-habitat']), (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  
  db.run('UPDATE projects SET name = ?, description = ?, status = ? WHERE id = ?', 
    [name, description, status, id], function(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to update project' });
      } else {
        res.json({ success: true });
      }
    });
});

app.get('/api/expenditures', requireAuth, (req, res) => {
  const query = `
    SELECT e.*, p.name as project_name 
    FROM expenditures e 
    JOIN projects p ON e.project_id = p.id
  `;
  
  db.all(query, (err, expenditures) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(expenditures);
    }
  });
});

app.post('/api/expenditures', requireAuth, requireRole(['un-habitat']), (req, res) => {
  const { project_id, category, amount, description, date } = req.body;
  
  db.run('INSERT INTO expenditures (project_id, category, amount, description, date) VALUES (?, ?, ?, ?, ?)', 
    [project_id, category, amount, description, date], function(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to add expenditure' });
      } else {
        res.json({ id: this.lastID, project_id, category, amount, description, date });
      }
    });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});