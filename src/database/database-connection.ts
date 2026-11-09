 // import 'dotenv/config';
import mysql from 'mysql2/promise';

/**----------------------------------------------------------------------- */
        const hostname = process.env.HOST! ;
        const portdb =Number(process.env.PORT_DB!);
        const username = process.env.USER!;
        const dbpassword = process.env.PASSWORD!;

        export const db_publico = process.env.DB_PUBLICO;
        export const db_vendas = process.env.DB_VENDAS;
        export const db_estoque = process.env.DB_ESTOQUE;
        export const db_financeiro = process.env.DB_FINANCEIRO;

        export const database_api =process.env.DB_API!
 
        export const conn2  = await  mysql.createPool({
            connectionLimit : 10,
            host: hostname,
            user: String(username),
            port: portdb,
            password: String(dbpassword),
        })

/**----------------------------------------------------------------------- */

 