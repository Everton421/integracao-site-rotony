import assert from 'node:assert';
import test from 'node:test';

import { conn2, database_api } from '../../../../../database/database-connection.ts';
import { AuthRepository } from '../repository/auth-repository.ts';
import { GetAcessToken } from '../use-cases/get-access-token.ts';

const API_BASE_URL = process.env.API_BASE_URL!;
const API_CLIENT_ID = process.env.API_CLIENT_ID!;
const API_CLIENT_SECRET = process.env.API_CLIENT_SECRET!;
 
test(" test get acess token " , async (t)=>{
    
    await t.test("", async ()=>{
        try {
             const getAcessToken = new GetAcessToken( API_BASE_URL, new AuthRepository(conn2, database_api)  )
             const token = await getAcessToken.getToken( API_CLIENT_ID, API_CLIENT_SECRET );
            
             assert.strictEqual(typeof token , 'string' );
       } catch (error) {
         console.log(error)
        }
       
    })
})

