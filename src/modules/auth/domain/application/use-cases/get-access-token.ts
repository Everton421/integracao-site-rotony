import axios, { isAxiosError } from "axios";
import { type IAuthRepository } from "../ports/IAuthRepository.ts"
import { DateService } from "../../../../../shared/utils/date-service.ts";

type responseAcessToken = { 
    access_token: string,
    token_type : string,
    expires_in:number
}

export class GetAcessToken{
    private authUrl:string
    private authRepository: IAuthRepository
    private dateService: DateService
    
    constructor(authUrl:string, authRepository: IAuthRepository ){
         this.authUrl = authUrl; 
         this.authRepository = authRepository; 
         this.dateService = new DateService();
    }

   public async getToken(clientId:  string , clientSecret: string ):Promise<string>{

            // 1- consultar o acess token no banco de dados
            // 2 - se existir, verificar a validade e obter token novo caso necessario.
            // 3 - se nao existir, obter um token novo

           const dataAcessToken = await this.authRepository.getAcessTokenById(1);

           if(new Date(dataAcessToken[0].expires_at) > new Date(Date.now())){
                return dataAcessToken[0].token;
           }
             
              // token nao registrado, obtendo novo token...
                return await this.getAndSaveAcesstoken( clientId,clientSecret );
    }

     private async getApiAcessToken(clientId:  string , clientSecret: string ){
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            
            try {
                const response = await axios.post<responseAcessToken>(this.authUrl+`/api/v1/auth/token`, params,
                    {
                         headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json',
                            'User-Agent': 'integracao-shopify-syma/1.0',
                        },
                    }
                )
                return response.data;

            } catch (error) {
                const erro = isAxiosError(error) ? error.response?.data : error  
                    throw new Error(`Erro ao obter o token de acesso da api: `+JSON.stringify(erro) );
            }
    }

    private async getAndSaveAcesstoken(clientId:  string , clientSecret: string){
             const dataAcessToken =   await this.getApiAcessToken( clientId, clientSecret )
             const expires_at =  new Date( Date.now() +  dataAcessToken.expires_in * 1000 ) ;
                                 
                                await this.authRepository.upInsert({
                                          expires_in:  Number(dataAcessToken.expires_in)  ,
                                        token: dataAcessToken.access_token,
                                        token_type: dataAcessToken.token_type,
                                        expires_at: this.dateService.formatarDataHora(expires_at),
                                    })
                            
                   return dataAcessToken.access_token
    }

}