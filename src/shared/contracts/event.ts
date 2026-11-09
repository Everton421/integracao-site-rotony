
 
export interface event {
    id:number
    tabela_origem: string
    id_registro: number
    tipo_evento: 'INSERT' | 'UPDATE' | 'DELETE'
    dados_json: string | null
    status: 'PENDENTE' | 'PROCESSADO' | 'ERRO'
    setor:number | 0
    tabela:number | 0 
    id_message: string | null 
    id_evento:number
    criado_em: string
}   