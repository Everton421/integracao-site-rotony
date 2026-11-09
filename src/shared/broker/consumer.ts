import amqplib from 'amqplib';
 
 
import { delay } from '../utils/delay.ts';
import { type event } from '../contracts/event.ts';
import { PublishProductByEvent } from '../../modules/products/services/publish-product-by-event.ts';
import { SyncStockService } from '../../modules/inventory/service/sync-stock-service.ts';


const RECONNECT_DELAY = 5000;

export async function consumer_sistema(): Promise<void> {

  const URL = process.env.BROKER_URL;
  const EXCHANGE = process.env.EXCHANGE_NAME!;
  const QUEUE_NAME = process.env.QUEUE_NAME!;


  if (!QUEUE_NAME || !EXCHANGE) {
    throw new Error("Verificar variaveis de ambiente do broker do sistema [ BASE_QUEUE_NAME,   EXCHANGE_NAME] ");
  }

  async function startConsumer() {

    const conn = await amqplib.connect(URL!);
    const channel = await conn.createChannel();


    await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });

    const q = await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    await channel.bindQueue(q.queue, EXCHANGE, '');

    console.log(`[*] Worker sistema iniciado na fila [${QUEUE_NAME}] `);

    channel.prefetch(1);
    const delaySyncData = 500;

    await channel.consume(q.queue, async (msg) => {
      if (msg) {
        try {

          let conteudo = JSON.parse(msg.content.toString());

          if (conteudo  ) {

            const data = conteudo as event;
           
            switch (data.tabela_origem) {
    
                case 'cad_prod':
                    await delay(delaySyncData, `[...] Aguardando ${delaySyncData/1000} segundos para processar produto ...`)
                        await PublishProductByEvent.send(data);
                    channel.ack(msg);
                    break;
            
                case 'prod_setor' :
                    await delay(delaySyncData, `[...] Aguardando ${delaySyncData/1000} segundos para processar estoque do produto ${data.id_registro} ...`)
                        await SyncStockService.postStockLojaSyma({ codigo: data.id_registro, compareLastStock: 'S'});
                        await SyncStockService.postStockSymaSC({ codigo: data.id_registro, compareLastStock: 'S'});

                    channel.ack(msg);
                    break;
                    
                default:
                    console.log("[X] Mensagem recebida do sistema, porém nenhuma ação será executada.")
                    channel.ack(msg);

                }

          } else {
            console.log("Mensagem vazia: ", conteudo )
                  channel.ack(msg);
          }

        } catch (e) {
          console.log("[x] Erro ao processar a mensagem do broker do sistema: ", e)
                  channel.nack(msg, false, false);
        }
      }
    }, { noAck: false });

    conn.on('error', (err) => {
      console.error(`[!] Erro na conexão RabbitMQ (sistema): ${err.message}`);
    });

    conn.on('close', () => {
      console.warn(`[!] Conexão RabbitMQ (sistema) perdida. Reconectando em ${RECONNECT_DELAY / 1000}s...`);
      setTimeout(startConsumer, RECONNECT_DELAY);
    });

    channel.on('error', (err) => {
      console.error(`[!] Erro no channel RabbitMQ (sistema): ${err.message}`);
    });
  }

  await startConsumer();

}
