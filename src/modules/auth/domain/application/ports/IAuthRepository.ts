import { Auth } from "../entity/auth.ts"
import { type AuthProps } from "../types/AuthType.ts"

export interface IAuthRepository {

    getAcessTokenById( id: number ):Promise<Auth[]>

    partialUpdate( dataAuth: Partial<Omit<Auth, 'id'>>, id:number ):Promise<number>

    insert( dataAuth: Omit<AuthProps, 'id' | 'updated_at'> ):Promise<number>
    
    upInsert(dataAuth: Omit<AuthProps,'updated_at' | 'id'> ):Promise<number>
}