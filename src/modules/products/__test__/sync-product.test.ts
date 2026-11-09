import test from 'node:test';
 
import { SyncProductFactory } from '../sync-product-factory.ts';



test("sync Product ", async ()=>{
 
                    const syncProduct = await SyncProductFactory.createService();

                    await syncProduct.syncProductByCode();

})