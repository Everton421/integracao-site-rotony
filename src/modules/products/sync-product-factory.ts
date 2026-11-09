import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../database/database-connection.ts";
import { ApiClient } from "../../shared/api/api.ts";
import { AuthRepository } from "../auth/domain/application/repository/auth-repository.ts";
import { GetAcessToken } from "../auth/domain/application/use-cases/get-access-token.ts";
import { LogRepository } from "./repositories/log-repository.ts";
import { ProductRepository } from "./repositories/product-repository.ts";
import { SyncProductService } from "./sync-product-service.ts";

export class SyncProductFactory { 

    static async createService(){

        const API_BASE_URL = process.env.API_BASE_URL!;
        const getAcessToken = new GetAcessToken(
            API_BASE_URL ,
            new AuthRepository(conn2, database_api)
        )

        const clientId =process.env.API_CLIENT_ID!
        const clientSecret =process.env.API_CLIENT_SECRET!
    
                const token = await getAcessToken.getToken( clientId, clientSecret);
                
                    const api = new ApiClient( API_BASE_URL, token)

                    return new SyncProductService(api, new ProductRepository(conn2, db_publico!, database_api, db_vendas!, db_estoque!), new LogRepository(conn2,database_api!)  );
        }

                 
   }

      