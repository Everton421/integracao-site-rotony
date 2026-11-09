import test from 'node:test';
import assert from 'node:assert';
import { Auth } from '../entity/auth.ts';



test("teste verificar validade do token ", async () => {
    const auth = new Auth({ expires_in: 5000, id: 1, token: '2112133212413322132', token_type: 'Bearer', updated_at: '2026-11-03 01:00:00', expires_at: '2026-11-06 01:00:00' })

    const resultVerifyAcesstoken = auth.isValidAcessToken();
    assert.strictEqual(resultVerifyAcesstoken, true, 'Erro ao validar token ');

})
