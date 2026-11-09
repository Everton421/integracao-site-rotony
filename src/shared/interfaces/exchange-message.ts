export type exchange_message ={
  id_message: string,
  criado_em: string,
  dados_json: string,
  id_evento:  number,
  id_registro: number,
  status: 'PENDENTE' | 'PROCESSADO' | 'ERRO',
  tabela_origem: string,
  tipo_evento: 'UPDATE' | 'INSERT' | 'DELETE'
}