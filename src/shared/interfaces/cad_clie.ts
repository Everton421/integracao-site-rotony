

export interface cad_clie{
    NOME:string
    APELIDO:string
    FIS_JUR: 'F' | 'J'
    CPF:string
    RG:string
    EMAIL_FISCAl:string
    EMAIL:string
    SENHA:string
    OBSERVACOES:string
    HISTORICO:string
    BLOQ_MOTIVO:string //motivo do bloqueio
    OBS_BANCARIA:string
    OBS_COMERCIAL1:string
    OBS_COMERCIAL2:string
    OBS_COMERCIAL3:string
    OBS_PESSOAL:string
    ENDERECO:string
    NUMERO:string
    COMPLEMENTO:string
    BAIRRO:string
    CIDADE:string
    ESTADO:string
    CEP:string
    TELEFONE_RES:string
    CELULAR:string
    DATA_CADASTRO:string
    DATA_RECAD:string
    CONSUMIDOR_FINAL:string
    ATIVO:'S' | 'N'
    NO_SITE:'S' | 'N'
    VENDEDOR:number
    MIDIA_CLI:number
}