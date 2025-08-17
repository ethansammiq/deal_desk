import express from 'express';
import { router } from './routes';
import { setupVite } from './vite';

const app = express();
const port = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', router);

// Setup Vite for frontend
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

setupVite(app, server);