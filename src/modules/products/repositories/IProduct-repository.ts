import { type ITimestamps } from "./product-repository.ts"

  export type typePhotoProductErp =
    {
        CAMINHO_FOTO: string | null
        FOTO: string | null
        PRODUTO:number
        SEQ: number 
        DESCRICAO:string 
        LINK?:string | null
        id:number 
    }

    export type resultQueryProduct = {
    CODIGO:number,
    ESTOQUE:number
    PRECO:number,
     GRUPO: string,
     SUBGRUPO: string,
     MARCA: string | null,
     APLICACAO: string,
     DESCRICAO:string,
     TITULO_SITE:string | null
     APLICACAO_SITE:string | null
     DATA_RECAD: string 
     ULTIMO_ENVIO_PRODUTO: string
}
    

    export interface IProductRepository { 
         getProduct( codigo:number, pricesTable?:number ):Promise<resultQueryProduct[]>
        getProductUpdatedAt( pricesTable?:number ):Promise<resultQueryProduct[]>
        getTimestamps():Promise<ITimestamps[]>
        findPhotosProductbyParams( query: { product?:number, photoId?:number,sequency?:number }):Promise<typePhotoProductErp[]>
        findPhotosProductbyIds( ids: number[] ):Promise<typePhotoProductErp[]>
        updateTimestamps(now?:string):Promise<number>
    }