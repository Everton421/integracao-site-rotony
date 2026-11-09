import amqplib, { type ChannelModel, type Channel } from 'amqplib';

export let brokerConnection: ChannelModel | null = null;
export let pubChannel: Channel | null = null;

const URL = process.env.BROKER_URL!;

export async function connectRabbitMQ(BROKER_URL: string = URL, EXCHANGE_NAME: string = 'sistema'): Promise<void> {
    if (!BROKER_URL) throw new Error("BROKER_URL não definido.");

    // 🛡️ PROTEÇÃO CONTRA INSTÂNCIAS DESNECESSÁRIAS:
    // Se já temos uma conexão e um canal abertos e ativos, não faz nada e sai da função.
    if (brokerConnection && pubChannel) {
        return; 
    }

    try {
        console.log("🔌 [RabbitMQ] Iniciando conexão...");
        
        brokerConnection = await amqplib.connect(BROKER_URL);
        pubChannel = await brokerConnection.createChannel();

        await Promise.all([
               pubChannel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true }),
        ]);
        console.log("✅ [RabbitMQ] Conectado e Exchange configurada!");

        brokerConnection.on('error', (err) => {
            console.error("❌ [RabbitMQ] Erro na conexão:", err.message);
        });

        brokerConnection.on('close', () => {
            console.warn("⚠️ [RabbitMQ] Conexão fechada. Tentando reconectar em 5s...");
            brokerConnection = null;
            pubChannel = null;
            setTimeout(() => connectRabbitMQ(BROKER_URL, EXCHANGE_NAME), 5000);  
        });

    } catch (error) {
        console.error("❌ [RabbitMQ] Falha ao conectar. Tentando novamente em 5s...");
        brokerConnection = null;
        pubChannel = null;
        setTimeout(() => connectRabbitMQ(BROKER_URL, EXCHANGE_NAME), 5000);
    }
}

// Função exportada para publicar mensagens
export async function publishExchangeMessage(exchange: string, routingKey: string, data: any): Promise<boolean> {
    if (!pubChannel || !brokerConnection) {
        console.warn("⚠️ [RabbitMQ] Sem conexão ativa. Mensagem não enviada.");
        return false;
    }
    try {
        const buffer = Buffer.from(JSON.stringify(data));
        return pubChannel.publish(exchange, routingKey, buffer);
    } catch (error) {
        console.error("❌ [RabbitMQ] Erro ao tentar publicar:", error);
        return false;
    }
}
/*
  export let brokerConnection: ChannelModel | null = null;
  export let pubChannel:   Channel | null = null;

const URL = process.env.BROKER_URL!;

export async function connectRabbitMQ(BROKER_URL:string = URL, EXCHANGE_NAME:string = 'sistema'): Promise<void> {
    if (!BROKER_URL) throw new Error("BROKER_URL não definido.");

    try {
        console.log("🔌 [RabbitMQ] Iniciando conexão...");
        
        brokerConnection = await amqplib.connect(BROKER_URL);
        pubChannel = await brokerConnection.createChannel();

        await Promise.all([
               pubChannel.assertExchange( EXCHANGE_NAME , 'fanout', { durable: true }),
        ])
        console.log("✅ [RabbitMQ] Conectado e Exchange configurada!");

        brokerConnection.on('error', (err) => {
            console.error("❌ [RabbitMQ] Erro na conexão:", err.message);
        });

        brokerConnection.on('close', () => {
            console.warn("⚠️ [RabbitMQ] Conexão fechada. Tentando reconectar em 5s...");
            brokerConnection = null;
            pubChannel = null;
            setTimeout(connectRabbitMQ, 5000);  
        });

    } catch (error) {
        console.error("❌ [RabbitMQ] Falha ao conectar. Tentando novamente em 5s...");
        setTimeout(connectRabbitMQ, 5000);
    }
}

 
// Função exportada para publicar mensagens
export async function publishExchangeMessage( exchange: string , routingKey: string, data: any): Promise<boolean> {
    if (!pubChannel || !brokerConnection) {
        console.warn("⚠️ [RabbitMQ] Sem conexão ativa. Mensagem não enviada.");
        return false;
    }
    try {
        const buffer = Buffer.from(JSON.stringify(data));
        return pubChannel.publish(exchange, routingKey, buffer);
    } catch (error) {
        console.error("❌ [RabbitMQ] Erro ao tentar publicar:", error);
        return false;
    }
}

*/
 



 

