import express from 'express';
import contactRoutes from './routes/contact.routes';

const app = express();

app.use(express.json());
app.use('/identify', contactRoutes);

export default app;
