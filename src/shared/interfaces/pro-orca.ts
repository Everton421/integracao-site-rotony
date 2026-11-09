export interface pro_orca {
    ORCAMENTO:number
    SEQUENCIA:number
    PRODUTO:number
    GRADE:number
    PADRONIZADO:number
    TABELA:number
    PRECO_TABELA:number
    COMPLEMENTO:string
    UNIDADE:string | 'UND'
    ITEM_UNID:number |  1 
    JUST_IPI: string | null | ''
    JUST_ICMS: string | null | '' 
    JUST_SUBST: string | null | ''  
    QUANTIDADE:number
    UNITARIO:number
    TOTAL_LIQ:number
    UNIT_ORIG:number
    CUSTO_MEDIO:number
    ULT_CUSTO:number
    FRETE:number
    IPI:number
    DESCONTO:number
}