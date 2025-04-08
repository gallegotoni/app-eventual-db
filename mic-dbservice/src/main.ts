import axios from 'axios';
import express, { Request, Response } from 'express';

interface DataEntry {
    P: number[];
    N: number[];
    value: number;
}

class Database {
    private database: Record<string, DataEntry> = {};
    private peers: string[];
    private lastWriteTime: number;
    private syncInterval: number;

    constructor(peers: string[] = [], syncInterval: number = 5000) {
        this.peers = peers;
        this.lastWriteTime = Date.now();
        this.syncInterval = syncInterval;
        this.startSyncTimer();
    }

    increment(key: string, value: number): number {
        if (!this.database[key]) {
            this.database[key] = { P: [], N: [], value: 0 };
        }
        this.database[key].P.push(value);
        this.database[key].value += value;
        this.lastWriteTime = Date.now();
        return this.database[key].value;
    }

    decrement(key: string, value: number): number {
        if (!this.database[key]) {
            this.database[key] = { P: [], N: [], value: 0 };
        }
        this.database[key].N.push(value);
        this.database[key].value -= value;
        this.lastWriteTime = Date.now();
        return this.database[key].value;
    }

    add(key: string, value: number): void {
        if (!this.database[key]) {
            this.database[key] = { P: [], N: [], value: 0 };
        }
        this.database[key].value = value;
        this.lastWriteTime = Date.now();
    }

    delete(key: string): void {
        delete this.database[key];
        this.lastWriteTime = Date.now();
    }

    get(key: string): DataEntry | null {
        return this.database[key] || null;
    }

    applyConvergence(key: string): void {
        if (!this.database[key]) return;
        const { P, N } = this.database[key];
        const sumP = P.reduce((a, b) => a + b, 0);
        const sumN = N.reduce((a, b) => a + b, 0);
        this.database[key].value = sumP - sumN;
        this.database[key].P = [];
        this.database[key].N = [];
        this.lastWriteTime = Date.now();
    }

    startSyncTimer(): void {
        setInterval(() => {
            if (Date.now() - this.lastWriteTime >= this.syncInterval) {
                this.syncWithPeers();
            }
        }, this.syncInterval);
    }

    syncWithPeers(): void {
        Object.keys(this.database).forEach(key => {
            const data = { key, P: this.database[key].P, N: this.database[key].N };
            this.peers.forEach(peer => {
                axios.post(`${peer}/api/sync`, data)
                    .catch(err => console.error(`Sync error with ${peer}:`, err.message));
            });
        });
    }
}

const app = express();
app.use(express.json());
const peers: string[] = process.env.PEERS ? process.env.PEERS.split(',') : [];
const db = new Database(peers);

// Endpoints REST API compatibles con mic-apiservice

app.post('/add', (req: Request, res: Response) => {
    const { key, value } = req.body;
    db.add(key, value);
    res.json({ message: 'Added successfully' });
});
    
app.post('/increment', (req: Request, res: Response) => {
    const { key, value } = req.body;
    const result = db.increment(key, value);
    res.json({ value: result });
});
    
app.post('/decrement', (req: Request, res: Response) => {
    const { key, value } = req.body;
    const result = db.decrement(key, value);
    res.json({ value: result });
});
    
app.delete('/delete', (req: Request, res: Response) => {
    const { key } = req.body;
    db.delete(key);
    res.json({ message: 'Deleted successfully' });
});
    
app.get('/get', (req: Request, res: Response) => {
    const { key } = req.query;
    const result = db.get(String(key));
    res.json(result?.value);
});

app.post('/sync', (req: Request, res: Response) => {
    const { key, P, N }: { key: string; P: number[]; N: number[] } = req.body;
    if (!db.get(key)) {
        db.add(key, 0);
    }
    db.get(key)!.P.push(...P);
    db.get(key)!.N.push(...N);
    db.applyConvergence(key);
    res.json({ message: 'Synchronized' });
});

const PORT = process.env.DB_PORT || 4000;
app.listen(PORT, () => {
    console.log(`Database service running on port ${PORT}`);
});
