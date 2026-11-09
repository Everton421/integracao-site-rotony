import axios, { type AxiosInstance } from "axios";

export class ApiClient {
    public api: AxiosInstance;

   /**
    * 
    * @param baseURL 
    * @param token 
    */
    constructor(baseURL: string,  token: string ) {
        this.api = axios.create({
            baseURL ,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
    }
}