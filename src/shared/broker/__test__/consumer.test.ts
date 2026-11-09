import test from 'node:test'
import { consumer_sistema } from '../consumer.ts'

test("", async (t)=>{

    await t.test( async ()=>{
        await consumer_sistema()
    })
})