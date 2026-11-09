import {type IProductRepository, type resultQueryProduct, type typePhotoProductErp } from "./IProduct-repository.ts";
import mysql, { type ResultSetHeader } from 'mysql2/promise';
 
  export interface ITimestamps {
        id:number
        ultimo_envio_produto:string
    }


export class ProductRepository implements IProductRepository{

    private databasePublico:string ; 
    private databaseVendas:string ; 
    private connection: mysql.Pool;
    private databaseIntegration: string;
    private databaseStock:string

    constructor( connection:mysql.Pool, databasePublico:string, databaseIntegration: string, databaseVendas:string, databaseStock:string){
        this.connection = connection
        this.databasePublico= databasePublico
        this.databaseVendas= databaseVendas
        this.databaseIntegration = databaseIntegration
        this.databaseStock=databaseStock; 
    }



   async getTimestamps(): Promise<ITimestamps[]> {
      const sql = `SELECT * FROM ${this.databaseIntegration}.timestamps WHERE id = 1;`;
         const [result] = await this.connection.query(sql);
       return result as  ITimestamps[];
    }
    async updateTimestamps(now?:string):Promise<number>{
        const sql = `UPDATE ${this.databaseIntegration}.timestamps SET  ultimo_envio_produto = ?;`;

         const [result] = await this.connection.query(sql, [ now ? now : 'NOW()']);
             const resultAffectedRows = result as ResultSetHeader;
            return resultAffectedRows.affectedRows;
    }

   async findPhotosProductbyIds(ids: number[]): Promise<typePhotoProductErp[]> {
               
              const baseSql =    `SELECT  
                            CONCAT( 
                            CAST(p.FOTOS  AS CHAR(1000)  CHARACTER SET latin1),
                            CAST(fp.FOTO  AS CHAR(1000)  CHARACTER SET latin1)  
                            ) as CAMINHO_FOTO ,
                            CAST(fp.FOTO  AS CHAR(1000)  CHARACTER SET latin1) as FOTO,
                            fp.PRODUTO,
                            fp.SEQ,
                            fp.DESCRICAO,
                            fp.id
                        FROM  ${this.databasePublico}.fotos_prod fp 
                        JOIN  ${this.databaseVendas}.parametros p on p.id = 1
                        WHERE fp.produto in ( ?)
                  ` 

           const [ data ] = await this.connection.query(baseSql, [ids]);
            return data  as typePhotoProductErp[]
    } 

   async findPhotosProductbyParams(query: { product?: number; photoId?: number; sequency?: number; }): Promise< typePhotoProductErp[]> {
          const { photoId, product, sequency } = query;
              const baseSql =    `SELECT  
                            CONCAT( 
                            CAST(p.FOTOS  AS CHAR(1000)  CHARACTER SET latin1),
                            CAST(fp.FOTO  AS CHAR(1000)  CHARACTER SET latin1)  
                            ) as CAMINHO_FOTO ,
                            CAST(fp.FOTO  AS CHAR(1000)  CHARACTER SET latin1) as FOTO,
                            fp.PRODUTO,
                            fp.SEQ,
                            fp.DESCRICAO,
                            fp.id
                        FROM  ${this.databasePublico}.fotos_prod fp 
                        JOIN  ${this.databaseVendas}.parametros p on p.id = 1
                  ` 
                const conditions=[];
                const values=[]
                if(photoId){
                    conditions.push(` fp.id = ? `)
                    values.push(photoId)
                }
                if(product){
                    conditions.push(` fp.PRODUTO = ? `)
                    values.push(product)
                }
                if(sequency){
                    conditions.push(` fp.SEQ = ? `)
                    values.push(sequency)
                }

                        const whereClause = ` WHERE `;
                        const finalSql = baseSql + whereClause + conditions.join(' AND ');

           const [ data ] = await this.connection.query(finalSql, values);
            return data  as typePhotoProductErp[]
    } 
   
/**
 *  -Consulta o estoque, preço e demais dados do produto
 *  -Compara data de recadastro do produto, preco e estoque 
 * @param pricesTable Codigo da tabela de precos
 * @returns 
 */
  async  getProductUpdatedAt(   pricesTable?:number): Promise<resultQueryProduct[]> {
        const codPricesTable =  pricesTable ? pricesTable : 1;
            const sql = `SELECT
                    P.CODIGO,
                    GREATEST(COALESCE(EST.ESTOQUE_TOTAL, 0) - COALESCE(RES.RESERVADO, 0), 0) AS ESTOQUE,
                        pg.NOME as GRUPO,
                        sg.descricao as SUBGRUPO,
                        ma.descricao as MARCA,
                          
                       CAST(p.APLICACAO AS CHAR(10000) CHARACTER SET latin1) AS APLICACAO,
                        p.DESCRICAO,
                        p.TITULO_SITE,
                        CAST(p.APLICACAO_SITE AS CHAR(10000) CHARACTER SET latin1) AS APLICACAO_SITE,
                        p.DATA_RECAD,
                          ROUND(pp.PRECO , 2 )  as PRECO,
                        it.ultimo_envio_produto as ULTIMO_ENVIO_PRODUTO
                        
                FROM  ${this.databasePublico}.cad_prod P
                 LEFT JOIN ${this.databasePublico}.cad_pgru pg on pg.CODIGO = p.GRUPO
                 LEFT JOIN ${this.databasePublico}.subgrupos sg on sg.CODIGO = p.SUBGRUPO
                 LEFT JOIN ${this.databasePublico}.cad_pmar ma on ma.CODIGO = p.MARCA
                 LEFT JOIN delari_publico.prod_tabprecos pp on pp.produto = p.CODIGO and pp.tabela = '${codPricesTable}'
                  LEFT JOIN ${this.databaseIntegration}.timestamps it on it.id = 1
				         LEFT JOIN (
                    SELECT
                        PS.PRODUTO,
                        MAX(PS.DATA_RECAD) AS DATA_RECAD,
                        SUM(PS.ESTOQUE) AS ESTOQUE_TOTAL
                    FROM ${this.databaseStock}.prod_setor PS
                    WHERE PS.SETOR IN (
                        SELECT DISTINCT S.SETOR
                        FROM ${this.databaseVendas}.empresas_setor S
                        WHERE S.EST_ATUAL = 'X'   AND  S.EST_REAL = 'X' 
                    )  
                    GROUP BY PS.PRODUTO 
                ) EST ON EST.PRODUTO = P.CODIGO

                LEFT JOIN (
                    SELECT
                        PO.PRODUTO,
                                 SUM(
										LEAST(PO.QTDE_SEPARADA, GREATEST(PO.QUANTIDADE - PO.QTDE_MOV, 0))
										* PO.FATOR_QTDE
										* IF(CO.TIPO = '5', -1, 1)
								 	) AS RESERVADO
                    FROM ${this.databaseVendas}.cad_orca CO
                    INNER JOIN ${this.databaseVendas}.pro_orca PO ON PO.ORCAMENTO = CO.CODIGO
                    WHERE CO.SITUACAO IN ('AI','AP','FP') 
                    GROUP BY PO.PRODUTO
                ) RES ON RES.PRODUTO = P.CODIGO
                WHERE P.ATIVO = 'S' AND p.NO_SITE= 'S' AND
                  p.DATA_RECAD >= it.ultimo_envio_produto
                  OR EST.DATA_RECAD >= it.ultimo_envio_produto
                  OR pp.DATA_RECAD >= it.ultimo_envio_produto
                group by p.CODIGO` 
                const [result] = await this.connection.query(sql);
                return result as resultQueryProduct[];
    }


async getProduct(codigo: number, pricesTable?:number): Promise<resultQueryProduct[]> {
        const codPricesTable =  pricesTable ? pricesTable : 1;

     const sql = `SELECT
                    P.CODIGO,
                    GREATEST(COALESCE(EST.ESTOQUE_TOTAL, 0) - COALESCE(RES.RESERVADO, 0), 0) AS ESTOQUE,
                        pg.NOME as GRUPO,
                        sg.descricao as SUBGRUPO,
                        ma.descricao as MARCA,
                          
                       CAST(p.APLICACAO AS CHAR(10000) CHARACTER SET latin1) AS APLICACAO,
                        p.DESCRICAO,
                        p.TITULO_SITE,
                        CAST(p.APLICACAO_SITE AS CHAR(10000) CHARACTER SET latin1) AS APLICACAO_SITE,
                        p.DATA_RECAD,
                          ROUND(pp.PRECO , 2 )  as PRECO,
                        it.ultimo_envio_produto as ULTIMO_ENVIO_PRODUTO
                        
                FROM  ${this.databasePublico}.cad_prod P
                 LEFT JOIN ${this.databasePublico}.cad_pgru pg on pg.CODIGO = p.GRUPO
                 LEFT JOIN ${this.databasePublico}.subgrupos sg on sg.CODIGO = p.SUBGRUPO
                 LEFT JOIN ${this.databasePublico}.cad_pmar ma on ma.CODIGO = p.MARCA
                 LEFT JOIN delari_publico.prod_tabprecos pp on pp.produto = p.CODIGO and pp.tabela = '${codPricesTable}'
                  LEFT JOIN ${this.databaseIntegration}.timestamps it on it.id = 1
				         LEFT JOIN (
                    SELECT
                        PS.PRODUTO,
                        MAX(PS.DATA_RECAD) AS DATA_RECAD,
                        SUM(PS.ESTOQUE) AS ESTOQUE_TOTAL
                    FROM ${this.databaseStock}.prod_setor PS
                    WHERE PS.SETOR IN (
                        SELECT DISTINCT S.SETOR
                        FROM ${this.databaseVendas}.empresas_setor S
                        WHERE S.EST_ATUAL = 'X'   AND  S.EST_REAL = 'X' 
                    )  
                    GROUP BY PS.PRODUTO 
                ) EST ON EST.PRODUTO = P.CODIGO

                LEFT JOIN (
                    SELECT
                        PO.PRODUTO,
                                 SUM(
										LEAST(PO.QTDE_SEPARADA, GREATEST(PO.QUANTIDADE - PO.QTDE_MOV, 0))
										* PO.FATOR_QTDE
										* IF(CO.TIPO = '5', -1, 1)
								 	) AS RESERVADO
                    FROM ${this.databaseVendas}.cad_orca CO
                    INNER JOIN ${this.databaseVendas}.pro_orca PO ON PO.ORCAMENTO = CO.CODIGO
                    WHERE CO.SITUACAO IN ('AI','AP','FP') 
                    GROUP BY PO.PRODUTO
                ) RES ON RES.PRODUTO = P.CODIGO
                WHERE P.ATIVO = 'S' AND
                     p.CODIGO = ? 
                  
                group by p.CODIGO` 
                const [result] = await this.connection.query(sql, codigo);
                return result as resultQueryProduct[];
 }

}