import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDb } from './db.js';
import { importData } from './import-data.js';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database and seed if empty
initDb();
importData();

// Register API routes
app.use('/api', routes);

// Serve static frontend in production
const clientDist = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor Contábil CEPR rodando na porta ${PORT}`);
  console.log(`📊 API disponível em http://localhost:${PORT}/api/dashboard`);
});
