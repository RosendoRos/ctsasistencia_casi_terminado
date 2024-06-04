// backend

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ctsinge'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Route to register a new user
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  const checkUserQuery = 'SELECT * FROM users WHERE username = ?';
  db.query(checkUserQuery, [username], (err, results) => {
    if (err) {
      console.error('Error checking user existence:', err);
      res.status(500).send('Failed to check user existence');
      return;
    }
    if (results.length > 0) {
      res.status(400).send('Username already taken');
      return;
    }

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, password], (err, results) => {
      if (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Failed to register user');
        return;
      }
      res.status(200).send('User registered successfully');
    });
  });
});

// Route to login a user
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Error logging in user:', err);
      res.status(500).send('Failed to login');
      return;
    }
    if (results.length > 0) {
      const user = results[0];
      if (user.username === '1') {
        res.status(200).send({ message: 'Login successful', isAdmin: true });
      } else {
        res.status(200).send({ message: 'Login successful', isAdmin: false });
      }
    } else {
      res.status(401).send({ message: 'Invalid username or password' });
    }
  });
});

// Route to handle scan data
app.post('/api/save-scan', (req, res) => {
  const { name, puesto, timestamp, entrada_sali, location, id_unico } = req.body;
  const { latitude, longitude } = location || {};

  const query = 'INSERT INTO scans (name, puesto, timestamp, entrada_sali, latitude, longitude, id_unico) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [name, puesto, timestamp, entrada_sali, latitude, longitude, id_unico], (err, results) => {
    if (err) {
      console.error('Error inserting scan data:', err);
      res.status(500).send('Failed to save scan data');
      return;
    }
    res.status(200).send('Scan data saved successfully');
  });
});

// Route to get all unique users from scans
app.get('/api/users', (req, res) => {
  const query = 'SELECT DISTINCT id_unico, name FROM scans';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).send('Failed to fetch users');
      return;
    }
    res.status(200).json(results);
  });
});

// Route to get details of a specific user
app.get('/api/users/:id_unico', (req, res) => {
  const { id_unico } = req.params;

  const query = 'SELECT * FROM scans WHERE id_unico = ? ORDER BY timestamp DESC';
  db.query(query, [id_unico], (err, results) => {
    if (err) {
      console.error('Error fetching user details:', err);
      res.status(500).send('Failed to fetch user details');
      return;
    }
    res.status(200).json(results);
  });
});

// Route to get all scans (for administrators)
app.get('/api/scans', (req, res) => {
  const query = 'SELECT * FROM scans';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching scans:', err);
      res.status(500).send('Failed to fetch scans');
      return;
    }
    res.status(200).json(results);
  });
});

// Route to get weekly report for administrators
app.get('/api/weekly-report', (req, res) => {
  const query = `
    SELECT name, id_unico, 
           SUM(TIMESTAMPDIFF(HOUR, entrada, salida)) as total_hours
    FROM (
      SELECT id_unico, name, 
             MIN(CASE WHEN entrada_sali = 'entrada' THEN timestamp END) as entrada,
             MAX(CASE WHEN entrada_sali = 'salida' THEN timestamp END) as salida
      FROM (
        SELECT id_unico, name, timestamp, entrada_sali,
               CONVERT_TZ(timestamp, 'UTC', 'America/Mexico_City') as local_timestamp
        FROM scans
      ) as converted_scans
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
      GROUP BY id_unico, DATE(timestamp)
    ) as weekly_hours
    WHERE entrada IS NOT NULL AND salida IS NOT NULL
    GROUP BY name, id_unico
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error generating weekly report:', err);
      res.status(500).send('Failed to generate weekly report');
      return;
    }
    res.status(200).json(results);
  });
});

// New Route to get data up to Friday
app.get('/api/weekly-report/friday', (req, res) => {
  const query = `
    SELECT name, id_unico, 
           SUM(TIMESTAMPDIFF(HOUR, entrada, salida)) as total_hours
    FROM (
      SELECT id_unico, name, 
             MIN(CASE WHEN entrada_sali = 'entrada' THEN timestamp END) as entrada,
             MAX(CASE WHEN entrada_sali = 'salida' THEN timestamp END) as salida
      FROM (
        SELECT id_unico, name, timestamp, entrada_sali,
               CONVERT_TZ(timestamp, 'UTC', 'America/Mexico_City') as local_timestamp
        FROM scans
      ) as converted_scans
      WHERE DATE(timestamp) <= DATE_SUB(NOW(), INTERVAL WEEKDAY(NOW()) + 2 DAY)
      GROUP BY id_unico, DATE(timestamp)
    ) as weekly_hours
    WHERE entrada IS NOT NULL AND salida IS NOT NULL
    GROUP BY name, id_unico
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error generating report up to Friday:', err);
      res.status(500).send('Failed to generate report');
      return;
    }
    res.status(200).json(results);
  });
});

// New Route to calculate and add extra hours
app.post('/api/add-extra-hours', (req, res) => {
  const { id_unico, extra_hours } = req.body;

  const query = 'UPDATE users SET extra_hours = extra_hours + ? WHERE id_unico = ?';
  db.query(query, [extra_hours, id_unico], (err, results) => {
    if (err) {
      console.error('Error updating extra hours:', err);
      res.status(500).send('Failed to update extra hours');
      return;
    }
    res.status(200).send('Extra hours added successfully');
  });
});



// Route to generate Excel report with details of records for the current week
app.get('/api/generate-excel-report', async (req, res) => {
  const query = `
    SELECT name, puesto, timestamp, entrada_sali, latitude, longitude
    FROM scans
    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL WEEKDAY(NOW()) DAY)
    ORDER BY name, timestamp
  `;

  db.query(query, async (err, results) => {
    if (err) {
      console.error('Error generating Excel report:', err);
      res.status(500).send('Failed to generate Excel report');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Weekly Report');

      worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Puesto', key: 'puesto', width: 20 },
        { header: 'Timestamp', key: 'timestamp', width: 20 },
        { header: 'Entrada/Salida', key: 'entrada_sali', width: 15 },
        { header: 'Latitude', key: 'latitude', width: 15 },
        { header: 'Longitude', key: 'longitude', width: 15 },
      ];

      results.forEach(row => {
        worksheet.addRow(row);
      });

      res.setHeader(
        'Content-Disposition',
        'attachment; filename="weekly_report.xlsx"'
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error generating Excel file:', error);
      res.status(500).send('Failed to generate Excel file');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
