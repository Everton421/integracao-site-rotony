import { isAxiosError } from "axios";
import { ApiClient } from "../../shared/api/api.ts";
import {type resultQueryProduct, type IProductRepository } from "./repositories/IProduct-repository.ts";
import { type ILogRepository } from "./repositories/log-repository.ts";
import { PhotosUtilities } from "./photos-utilities.ts";
import { delay } from "../../shared/utils/delay.ts";
import { DateService } from "../../shared/utils/date-service.ts";


export interface IResponseCreate{
    externalId: string,
    sku: string,
    name: string,
    description: "Trena com trava e fita de aço.",
    category: string[],
    brand: string,
    price: number,
    inStock: boolean,
    active:  boolean,
    images: string[ ],
    url: string,
    createdAt: string,
    updatedAt: string
}

export interface IProductApi{ 
            externalId:string;
            name: string,
            sku: string,
            description: string,
            category: string[],
            brand? :  string,
            price: number,
            inStock: boolean,
            images: string[],
}

   
    export interface IReponseBatchProduct {
      summary: { created: number, updated: number, failed: number },
      results: [ { index: number, externalId: string, status: "created" | "error" | "updated" , error?:any} ]
    }
  
 

 export class SyncProductService {
        private api:ApiClient;
        private productRepository:IProductRepository
        private LogRepository: ILogRepository
        private pricesTable:number = Number(process.env.PRICE_TABLE_ID) || 1;

      constructor( api:ApiClient, productRepository:IProductRepository, LogRepository: ILogRepository ){
        this.api=api;
        this.productRepository=productRepository;
        this.LogRepository=LogRepository;
    }

    private async postBatchProduct( products: IProductApi[]):Promise<IReponseBatchProduct> { 
            try {   
                    const response = await this.api.api.post<IReponseBatchProduct>("/api/v1/products/batch", { products: products});
                   return  response.data
            } catch (error) {
                    if(isAxiosError(error)){
                       console.log(JSON.stringify(error.response?.data))
                    }else {
                       console.log(JSON.stringify(error))
                    }
                    throw error;
            }
    }
    private productDTO(product: resultQueryProduct, categories: string[], imagesToSend: string[]):IProductApi {
                let payload:IProductApi = {
                              category:  categories,
                                description: product.APLICACAO_SITE || product.APLICACAO,
                                name: product.TITULO_SITE || product.DESCRICAO,
                                externalId: String(product.CODIGO),
                                inStock: product.ESTOQUE > 0,
                                price:  Number(product.PRECO),
                                images:imagesToSend,
                                sku: String(product.CODIGO)
                }
                if(  product.MARCA ){
                    payload.brand = product.MARCA; 
                }
                return  payload    
    }

    private async configurePayload(codigo?:number){
      const fn = codigo ? this.productRepository.getProduct( codigo )
                        : 
                        this.productRepository.getProductUpdatedAt(this.pricesTable);
                        
                    const [dataProduct   ] = await Promise.all([
                            fn 
                    ]) 
                    const productIds = dataProduct.map( p=> p.CODIGO);
                        
                    if(!productIds.length) return 
                    
                        const photosErp  = await this.productRepository.findPhotosProductbyIds(productIds);
                    
                        const photosByProduct = new Map<number, any[]>();

                    for(const photo of photosErp){
                        const list = photosByProduct.get(photo.PRODUTO) || [];
                        list.push(photo);
                            photosByProduct.set(photo.PRODUTO, list);
                    }

                    const productsToShipping = await Promise.all(
                        dataProduct.map( async ( product)=>{
                            const categories:string[] = [];
                            if(product.GRUPO) categories.push(product.GRUPO);
                            if(product.SUBGRUPO) categories.push(product.SUBGRUPO);

                            const productPhotos =  photosByProduct.get(product.CODIGO)  || [];

                            const imagesPromises= productPhotos.map( async ( photo)=>{
                                if(!photo.CAMINHO_FOTO) return null;

                                const photoExists = await PhotosUtilities.checkPhotoExists(photo.CAMINHO_FOTO);
                                    if(photoExists){
                                        return await PhotosUtilities.getBase64Photo(photo.CAMINHO_FOTO);
                                    }
                                    return null;
                                })
                                const resolvedImages = await Promise.all( imagesPromises);
                                 const imagesToSend = resolvedImages.filter((img): img is string => img !== null);
                                return this.productDTO(product, categories,  imagesToSend);
                        })
                    )
                    return productsToShipping;
    }

    
    async syncProductByCode(codigo?:number){
        const dateService = new DateService();
        const dataSync = dateService.obterDataHoraAtual(); 

        const dataToSend = await this.configurePayload(codigo);
        let CHUNK_SIZE = 100;
            if(dataToSend){

            for( let i=0; i < dataToSend.length; i +=CHUNK_SIZE){
                const chunk = dataToSend.slice(i, i + CHUNK_SIZE);
                const payload = chunk.map( (i)=>{
                    return  i
                })

                await delay(2000, `  Envio de ${payload.length} produtos...`);
                
                const fails:{  status:string, details: string} [] =[];
                
                   const responseBAtchProduct = await this.postBatchProduct(payload)
                   if(responseBAtchProduct.summary.failed){
                        responseBAtchProduct.results.forEach((i)=>{
                            if(i.status == 'error') fails.push( {  status:i.status, details:JSON.stringify(i.error.details) })
                        })
                   }
                   if(fails.length){
                    console.table(fails)
                            const payloadOmitImgs = payload.map((i)=>{ return  {...i, images:[]}})
                        const input = fails.map((i)=> {return{ payload:JSON.stringify(payloadOmitImgs) as any,  error: i.details}}); 
                          await this.LogRepository.insertBatchLog(input)
                }
        }

        await this.productRepository.updateTimestamps(dataSync)
            }

    }
 }