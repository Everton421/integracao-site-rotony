import { conn2, database_api } from "./database-connection.ts";
 
export async function seed(){
    const database_integration = `\`${database_api}\``;

      const tables = [
        `CREATE DATABASE IF NOT EXISTS ${database_integration};`,
        `CREATE TABLE IF NOT EXISTS ${database_integration}.tokens (
                  id int(11) NOT NULL AUTO_INCREMENT,
                  token text DEFAULT NULL,
                  token_type varchar(20) DEFAULT 'Bearer',
                  expires_in int(10) NOT NULL DEFAULT 0,
                  expires_at datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
                  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY ( id )
                ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
             `,
             `
             CREATE TABLE IF NOT EXISTS ${database_integration}.logs  (
                 id  int(11) NOT NULL AUTO_INCREMENT,
                 payload  blob DEFAULT NULL,
                 error  blob DEFAULT NULL,
                 created_at  timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY ( id )
                ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
             `
        ]

        for ( const sql of tables){
            try{
                  const [ rows ] =    await conn2.query(sql);
            }catch(e){
                console.log(e);
            }
        }   
 
}


 