import cron from 'node-cron';
import { SyncProductService } from './sync-product-service.ts';

export class ProductJob {

    private syncProductService:SyncProductService;
    
    constructor(syncProductService:SyncProductService){
        this.syncProductService=syncProductService
    }
    
    async job(configCron: string) {

        let inExec = false
        console.log('[V] Tarefa de envio de Produtos agendada com sucesso.')

        cron.schedule(configCron, async () => {
            if (inExec) {
                console.log('[X] Tarefa de envio de produtos ainda em execução.')
                return
            }

            try {
                inExec = true
                console.log('[V] Executando tarefa de envio de Produtos...')

                await this.syncProductService.syncProductByCode();


            } catch (e) {
                console.error('Erro no Job de Produtos:', e)
            } finally {
                inExec = false
                console.log('[V] Fim da tarefa de envio de Produtos.')
            }
        })

    }

}