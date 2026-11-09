import mysql, {type  ResultSetHeader } from 'mysql2/promise'
import { type IAuthRepository } from '../ports/IAuthRepository.ts';
import { Auth } from '../entity/auth.ts';
import { type AuthProps } from '../types/AuthType.ts';

export class AuthRepository implements IAuthRepository { 
    private connection: mysql.Pool
    private databaseApi:string 

    constructor (connection: mysql.Pool, databaseApi:string ){
        this.connection = connection;
        this.databaseApi = databaseApi;
    }


async getAcessTokenById(id: number): Promise<Auth[]> {
    const sql = `SELECT *  FROM ${this.databaseApi}.tokens where id = ? `

        const [response] = await this.connection.query(sql, [id]);
        return response as Auth[]
}   


async insert(dataAuth: Omit<AuthProps, 'id' | 'updated_at'>): Promise<number> {
     const sql = ` 
     INSERT INTO  ${this.databaseApi}.tokens SET token = ? , token_type = ?,  expires_in = ?,  expires_at = ?;
     ` 
     const values = [dataAuth.token, dataAuth.token_type, dataAuth.expires_in, dataAuth.expires_at];
        const [response] = await this.connection.query(sql, values);
            const data = response  as ResultSetHeader;

    return data.insertId;
 }

async partialUpdate(dataAuth: Partial<Omit<Auth, 'id'>>, id: number): Promise<number> {
        const { expires_in, token, token_type, update_at } = dataAuth;

        const fields: Record<string, unknown> = {
            token,
            token_type,
            expires_in,
            updated_at: update_at,
        };

        const entries = Object.entries(fields).filter(([, value]) => value !== undefined);

        if (entries.length === 0) {
            return 0;
        }

        const setClause = entries.map(([column]) => `${column} = ?`).join(', ');
        const values = entries.map(([, value]) => value);

        const sql = `UPDATE ${this.databaseApi}.tokens SET ${setClause} WHERE id = ?`;
        const [response] = await this.connection.query(sql, [...values, id]);
        const data = response as ResultSetHeader;

        return data.affectedRows;
 }
 
async upInsert(dataAuth: Omit<AuthProps, 'updated_at' | 'id'> ): Promise<number> {
    const sql = ` 
        INSERT INTO  ${this.databaseApi}.tokens SET id = 1 , token = ? , token_type = ?,  expires_in = ?,  expires_at = ?
        ON DUPLICATE KEY UPDATE
          token =  VALUES(token) ,
          token_type = VALUES (token_type),
          expires_in = VALUES(expires_in),
          expires_at = VALUES(expires_at) ;` 
        
          const values = [dataAuth.token, dataAuth.token_type, dataAuth.expires_in, dataAuth.expires_at  ];
           const [response] = await this.connection.query(sql, values);
            const data = response  as ResultSetHeader;
    return data.serverStatus;
}


} 

