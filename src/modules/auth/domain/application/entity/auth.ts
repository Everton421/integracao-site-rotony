 
  
import { type AuthProps } from "../types/AuthType.ts";

export class Auth{
    private  props:  AuthProps ;
    constructor( props: AuthProps){
            this.props =props;
        }

    get id():number {
        return this.props.id;
    }
    
    get token():string {
        return this.props.token;
    }
    get token_type(): string {
        return this.props.token_type
    }
    get expires_in(): number{
        return this.props.expires_in;
    }
    get update_at():string {
        return this.props.updated_at
    }
     get expires_at(): string{
        return this.props.expires_at;
    }

}