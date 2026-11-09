export interface ICompleteProduct  {
CODIGO: number, 
OUTRO_COD: string, 
DATA_RECAD: string, 
SKU_MKTPLACE: string, 
DESCR_CURTA_MKTPLACE: string, 
DESCR_LONGA_MKTPLACE: string, 
DESCR_CURTA_SITE: string, 
DESCR_LONGA_SITE: string,
APLICACAO_SITE: string
TITULO_SITE:string
ATIVO: 'S' | 'N'
NO_SITE:'S' | 'N'
INDEXADO: 'S' | 'N' | null
DESCRICAO: string, 
APLICACAO: string,  
GARANTIA: string,
PESO: number, 
ORIGEM: number, 
NUM_FABRICANTE: string, 
PRECO: number, 
PROMOCAO: number,  
VALID_PROM: string,
MARCA: string, 
CATEGORIA: string, 
SUBCATEGORIA: string
id_produto_pai: string | null ,
variante_id: string,
COMPRIMENTO:number
LARGURA:number
ALTURA:number

}

export interface findSyncedUpdatedAt {
CODIGO: number
OUTRO_COD: string
DATA_RECAD: string
SKU_MKTPLACE: string
DESCR_CURTA_MKTPLACE: string
DESCR_LONGA_MKTPLACE: string
DESCR_CURTA_SITE: string
DESCR_LONGA_SITE: string 
APLICACAO_SITE: string
TITULO_SITE:string
DESCRICAO: string
APLICACAO: string
GARANTIA: string
PESO: number
LARGURA: number
ALTURA: number
COMPRIMENTO: number
ORIGEM: number
NUM_FABRICANTE: string
PRECO: number
PROMOCAO: number
MARCA: string
ATIVO: 'S' | 'N'
NO_SITE:'S' | 'N'
INDEXADO: 'S' | 'N' | null

SUBCATEGORIA: string
CATEGORIA: string
id_produto_pai: string
 variante_id:string
}
export interface IProductSystem {

CODIGO:number 
GRUPO:number 
SUBGRUPO:number 
DESCRICAO:string
DESCR_REDUZ:string
NUM_FABRICANTE:string
NUM_ORIGINAL:string
OUTRO_COD:string
APLICACAO:string
ULT_FORNECEDOR1:number
ULT_FATUR1:number
PRIM_COMPRA1:number
ULT_COMPRA1:string
ULT_CUSTO1:number
CUSTO_MEDIO1:number
DATA_CADASTRO:string
DATA_RECAD:string
DATA_LANCAMENTO:string
INDEXADO1:string
PPB:string
MARCA:number
ATIVO: 'S' | 'N'
MOV_SALDO:string
NIVEL:string
MSG_PRODUTO:string
OBSERVACOES1:string
OBSERVACOES2:string
OBSERVACOES3:string
GARANTIA:number
PESO:number
COMPRIMENTO:number
LARGURA:number
TIPO:number
REMOCAO_SITE:string
CONTR_LOTE_SERIE: 'S' | 'N'
CLASS_FISCAL:number
ORIGEM:number
VAL_INCLUSAO_DIG:number
JUST_INCLUSAO_DIG:string
ESTOQUE_MIN:number
CARAC_DESCR:string
GRADE:number
ULT_RECALC1:string
BLOQ_RECALC:string
LIMITE_OFERTA_NET:number
USAR_DESC: 'N' | 'S' | 'B'
CST:string
PORCAO:number
UND_PORCAO: '0' | '1' | '2'
MED_INT:string
MED_DEC:string
MED_UTIL:string
ALTURA:number
IMPORTADO_SITE:'S' | 'N'
ALTERADO_SITE:'S' | 'N'
QTDE_VOL:number
DESCR_CURTA:string
DESCR_LONGA:string
BNDES:string
NO_ANYMARKET:'S' | 'N'
COD_ANYMARKET:string
VOLTAGEM:string
SITE_DESBLOQUEAR_PRECO:string
APLIC_SITE:string
NUM_FCI:string
INICIO_PROM:string
OUTRO_COD2:string
NO_SITE:'S' | 'N'
SKU_SITE: string
TITULO_SITE: string
DESCR_CURTA_SITE: string
DESCR_LONGA_SITE: string
APLICACAO_SITE: string
NO_MKTP: 'S' | 'N'
SKU_MKTPLACE: string
TITULO_MKTPLACE: string
DESCR_CURTA_MKTPLACE: string
DESCR_LONGA_MKTPLACE: string
APLICACAO_MKTPLACE: string
LOCAL_PRODUTO: string
LOCAL1_PRODUTO: string
LOCAL2_PRODUTO: string
LOCAL3_PRODUTO: string
LOCAL4_PRODUTO: string
}
