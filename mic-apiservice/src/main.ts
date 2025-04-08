import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const DB_SERVICE_URL = process.env.DB_SERVICE_URL || 'http://localhost:4000';

app.post('/api/increment', async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;
        const response = await axios.post(`${DB_SERVICE_URL}/increment`, { key, value });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/decrement', async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;
        const response = await axios.post(`${DB_SERVICE_URL}/decrement`, { key, value });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/add', async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;
        await axios.post(`${DB_SERVICE_URL}/add`, { key, value });
        res.json({ message: 'Added successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/delete', async (req: Request, res: Response) => {
    try {
        const { key } = req.body;
        await axios.delete(`${DB_SERVICE_URL}/delete`, { data: { key } });
        res.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/get', async (req: Request, res: Response) => {
    try {
        const { key } = req.query;
        const response = await axios.get(`${DB_SERVICE_URL}/get`, { params: { key } });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
    console.log(`API service running on port ${PORT}`);
});
