import test from 'node:test';
import assert from 'node:assert';
import { AuthRepository } from '../repository/auth-repository.ts';
import { conn2, database_api } from '../../../../../database/database-connection.ts';
import { seed } from '../../../../../database/seed.ts';

test("test auth repository", async ()=>{

    const authRepository = new AuthRepository(conn2, database_api);
try {
    const response=  await authRepository.upInsert({
        expires_at:"2026-11-04 18:33:41",
        expires_in: 12331,
        id:1,
        token:'test_sfasd41243',
        token_type:'bearer' 
    })
    
        assert.strictEqual(response, 2 );

    
} catch (error) {
    console.log(error);  
    
}


})