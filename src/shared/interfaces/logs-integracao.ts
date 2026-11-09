export interface LogsIntegracao { 
id:number
referencia : 'order' | 'product' | 'photo' | 'stock' | 'price' | 'tags'
referencia_id:number
action:string
message:string
dados_shopify:string
status: 'error' | 'sucess' | 'warning'
created_at:string
}
