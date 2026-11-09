export interface Authtype {
        id: number
        token: string
        token_type: string
        expires_in: number
}

export interface AuthProps { 
        id: number
        token: string
        token_type: string
        /** tempo de expiração do token em segundos */
        expires_in: number
        expires_at: string
        updated_at:string
}