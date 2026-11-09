    export interface integracao_pedidos {
    id:number
    shopify_order_id:string
    shopify_order_number:string
    erp_order_id:number
    nome_cliente:string
    email_cliente:string
    preco_total:number
    status:string
    sync_status: 'pending_validation' | 'approved' | 'synced' | 'error'
    status_pagamento: 'AUTHORIZED' | 'EXPIRED'  | 'PAID' | 'PARTIALLY_PAID' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED' | 'VOIDED' 
     status_atendimento: 'FULFILLED' | 'IN_PROGRESS' | 'ON_HOLD' | 'OPEN' | 'PARTIALLY_FULFILLED' | 'PENDING_FULFILLMENT' | 'REQUEST_DECLINED' | 'RESTOCKED' | 'SCHEDULED' | 'UNFULFILLED'  
    error_message:string
    dados_pedido:string
    data_criacao:string
    data_atualizacao:string
    created_at:string
    updated_at:string
    shopifyFulfillmentOrderId?: string
    delivery_method_id?: string
    deliveryMethod?: string | null
    id_pedido_entrega?: string | null
    numero_nf?: string | null 
    chave_nf?: string | null
    codigo_nf?: string | null
    situacao_nf?: 'N' | 'T' | 'R' | 'P' | 'A' | 'D' | 'C' | null
    nf_cancelada?: 'S' | 'N' | null
    
    SITUACAO_NFE: 'N' | 'T' | 'R' | 'P' | 'A' | 'D' | 'C' | null
    CANCELADA_ERP:  'S' | 'N' | null
    }
