import mysql, { type ResultSetHeader } from 'mysql2/promise';
 

export type inputInsertLog = {
    payload:string,
    error:string
}

export interface ILogRepository   {
    insertLog(input:inputInsertLog):Promise<number>
    insertBatchLog(input:inputInsertLog[] ):Promise<any>;

} 

export class LogRepository implements ILogRepository{

    private connection: mysql.Pool;
    private databaseIntegration: string;

    constructor( connection:mysql.Pool,  databaseIntegration: string ){
        this.connection = connection
        this.databaseIntegration = databaseIntegration
    }

 
   async insertLog( input : inputInsertLog) {
    const sql = `INSERT INTO ${this.databaseIntegration}.logs  SET payload = ?, error = ? ;`
    const [result] = await this.connection.query(sql, [ input.payload, input.error]);
     const resultInsert =result as ResultSetHeader
    return resultInsert.insertId;
    } 
 
   async insertBatchLog(input: inputInsertLog[]): Promise<any> {
            const placeholders =[];
            const values = []
            for(const i of input){
                placeholders.push("( ?, ? )")
                values.push( i.payload, i.error);
            } 

        const sql = ` INSERT INTO ${this.databaseIntegration}.logs 
                ( payload, error ) values ${placeholders.join(' ,')}
            `
            const [result] = await this.connection.query(sql, values);
            return result;
    }


}