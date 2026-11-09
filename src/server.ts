import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import "express-async-errors";
import path from 'path';

import cookieParser from 'cookie-parser';
import { database_api } from './database/database-connection.ts';
import { seed } from './database/seed.ts';
import { router } from './web/routes.ts';
import { SyncProductFactory } from './modules/products/sync-product-factory.ts';
import { ProductJob } from './modules/products/sync-product-job.ts';

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(import.meta.dirname, 'web/Views'));

if (!database_api) {
    throw new Error('Nome do banco de dados nao foi definido.');
}

await seed();
app.use(router);



app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof Error) {
        return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({
        status: 'error',
        message: 'internal server error.'
    });
});

const PORT_API = Number(process.env.PORT_API ?? 8000);

     const syncProduct = await SyncProductFactory.createService();
    const job= new ProductJob(syncProduct)

    const expressao = process.env.ENVIO_PRODUTOS;
    if(expressao){
        job.job(expressao)
    }
 
app.listen(PORT_API, () => {
    console.log(`app rodando porta ${PORT_API}`);
});


