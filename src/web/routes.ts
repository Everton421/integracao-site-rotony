import { Router } from 'express';
import { conn2, database_api, db_publico, db_vendas } from '../database/database-connection.ts';

const router = Router();

// const productRepository = new ProductErpRepository(
//     conn2,
//     String(db_publico),
//     String(database_api),
//     String(process.env.DB_ESTOQUE),
//     String(db_vendas)
// );

// const photosRepository = new PhotosRepository(
//     conn2,
//     String(db_publico),
//     String(database_api),
//     String(db_vendas)
// );

// function quoteIdentifier(value: string | undefined): string {
//     if (!value) {
//         throw new Error('Identificador de banco ausente nas variaveis de ambiente.');
//     }

//     return `\`${value.replace(/`/g, '``')}\``;
// }

// function publicDb(): string {
//     return quoteIdentifier(db_publico);
// }

// function integrationDb(): string {
//     return quoteIdentifier(database_api);
// }

// function configTable(): string {
//     return `${integrationDb()}.configuracoes`;
// }

// type ConfigRow = {
//     id: number;
//     enviar_produtos: 'S' | 'N';
//     atualizar_produtos: 'S' | 'N';
//     enviar_imagens: 'S' | 'N';
//     tabela_preco: number;
//     tamanho_lote: number;
//     ultimo_envio_produto: string | null;
//     created_at?: string;
//     updated_at?: string;
// };

// async function ensureConfig(): Promise<ConfigRow> {
//     const table = configTable();
//     const [rows] = await conn2.query(`SELECT * FROM ${table} ORDER BY id LIMIT 1`) as any[];

//     if (rows[0]) {
//         return rows[0] as ConfigRow;
//     }

//     await conn2.query(`
//         INSERT INTO ${table}
//             (enviar_produtos, atualizar_produtos, enviar_imagens, tabela_preco, tamanho_lote)
//         VALUES ('N', 'N', 'N', 0, 100)
//     `);

//     const [created] = await conn2.query(`SELECT * FROM ${table} ORDER BY id LIMIT 1`) as any[];
//     return created[0] as ConfigRow;
// }

// async function loadGroups(): Promise<any[]> {
//     try {
//         const [rows] = await conn2.query(`
//             SELECT CODIGO, NOME
//             FROM ${publicDb()}.cad_pgru
//             WHERE ATIVO = 'S' AND NO_SITE = 'S'
//             ORDER BY NOME
//         `);
//         return rows as any[];
//     } catch {
//         return [];
//     }
// }

// async function loadSubgroups(): Promise<any[]> {
//     try {
//         const [rows] = await conn2.query(`
//             SELECT CODIGO, COD_GRUPO, DESCRICAO
//             FROM ${publicDb()}.subgrupos
//             WHERE NO_SITE = 'S'
//             ORDER BY DESCRICAO
//         `);
//         return rows as any[];
//     } catch {
//         return [];
//     }
// }

// async function loadPriceTables(): Promise<any[]> {
//     try {
//         const [rows] = await conn2.query(`
//             SELECT DISTINCT TABELA AS CODIGO, CONCAT('Tabela ', TABELA) AS DESCRICAO
//             FROM ${publicDb()}.prod_tabprecos
//             ORDER BY TABELA
//         `);
//         return rows as any[];
//     } catch {
//         return [];
//     }
// }

// async function countProducts(filters: { search: string; syncStatus: string; grupo: string; subgrupo: string }): Promise<number> {
//     const conditions = [`cp.ATIVO = 'S'`, `cp.NO_SITE = 'S'`];
//     const values: any[] = [];
//     const term = `%${filters.search}%`;

//     if (filters.search) {
//         conditions.push('(CAST(cp.CODIGO AS CHAR) LIKE ? OR cp.DESCRICAO LIKE ? OR cp.TITULO_SITE LIKE ?)');
//         values.push(term, term, term);
//     }

//     if (filters.syncStatus === 'synced') {
//         conditions.push(`EXISTS (SELECT 1 FROM ${integrationDb()}.produtos ip WHERE ip.erp_sku = cp.CODIGO)`);
//     } else if (filters.syncStatus === 'not_synced') {
//         conditions.push(`NOT EXISTS (SELECT 1 FROM ${integrationDb()}.produtos ip WHERE ip.erp_sku = cp.CODIGO)`);
//     }

//     if (filters.grupo) {
//         conditions.push('cp.GRUPO = ?');
//         values.push(Number(filters.grupo));
//     }

//     if (filters.subgrupo) {
//         conditions.push('cp.SUBGRUPO = ?');
//         values.push(Number(filters.subgrupo));
//     }

//     const [rows] = await conn2.query(`
//         SELECT COUNT(*) AS total
//         FROM ${publicDb()}.cad_prod cp
//         WHERE ${conditions.join(' AND ')}
//     `, values) as any[];

//     return Number(rows[0]?.total ?? 0);
// }

// async function findProducts(filters: { search: string; syncStatus: string; grupo: string; subgrupo: string }, limit: number, offset: number): Promise<any[]> {
//     const conditions = [`cp.ATIVO = 'S'`, `cp.NO_SITE = 'S'`];
//     const values: any[] = [];
//     const term = `%${filters.search}%`;

//     if (filters.search) {
//         conditions.push('(CAST(cp.CODIGO AS CHAR) LIKE ? OR cp.DESCRICAO LIKE ? OR cp.TITULO_SITE LIKE ?)');
//         values.push(term, term, term);
//     }

//     if (filters.syncStatus === 'synced') {
//         conditions.push(`EXISTS (SELECT 1 FROM ${integrationDb()}.produtos ip WHERE ip.erp_sku = cp.CODIGO)`);
//     } else if (filters.syncStatus === 'not_synced') {
//         conditions.push(`NOT EXISTS (SELECT 1 FROM ${integrationDb()}.produtos ip WHERE ip.erp_sku = cp.CODIGO)`);
//     }

//     if (filters.grupo) {
//         conditions.push('cp.GRUPO = ?');
//         values.push(Number(filters.grupo));
//     }

//     if (filters.subgrupo) {
//         conditions.push('cp.SUBGRUPO = ?');
//         values.push(Number(filters.subgrupo));
//     }

//     const [rows] = await conn2.query(`
//         SELECT
//             cp.CODIGO,
//             cp.DESCRICAO,
//             cp.TITULO_SITE,
//             cp.GRUPO AS CODIGO_GRUPO,
//             cp.SUBGRUPO AS CODIGO_SUBGRUPO,
//             (SELECT ip.id FROM ${integrationDb()}.produtos ip WHERE ip.erp_sku = cp.CODIGO LIMIT 1) AS id,
//             cp.NO_SITE,
//             cp.ATIVO
//         FROM ${publicDb()}.cad_prod cp
//         WHERE ${conditions.join(' AND ')}
//         ORDER BY cp.CODIGO
//         LIMIT ? OFFSET ?
//     `, [...values, limit, offset]) as any[];

//     return rows.map((row: any) => ({
//         ...row,
//         id_produto_pai: row.id,
//         CATEGORIA: null,
//         DESCR_CURTA_MKTPLACE: row.DESCRICAO
//     }));
// }

// router.get('/', async (_req, res) => {
//     const config = await ensureConfig();
//     let total = 0;

//     try {
//         const [syncRows] = await conn2.query(`
//             SELECT COUNT(*) AS total
//             FROM ${integrationDb()}.produtos
//             WHERE sync_status = 'synced'
//         `) as any[];
//         total = Number(syncRows[0]?.total ?? 0);
//     } catch {
//         total = 0;
//     }

//     res.render('index', {
//         dados: {
//             ...config,
//             statusProdutos: true,
//             total
//         },
//         statusPedidos: null
//     });
// });

// router.get('/produtos', async (req, res) => {
//     const page = Math.max(1, Number(req.query.page) || 1);
//     const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 50));
//     const offset = (page - 1) * limit;

//     const filters = {
//         search: String(req.query.search ?? ''),
//         syncStatus: String(req.query.sync_status ?? ''),
//         grupo: String(req.query.grupo ?? ''),
//         subgrupo: String(req.query.subgrupo ?? '')
//     };

//     const [produtos, total, grupos, subgrupos] = await Promise.all([
//         findProducts(filters, limit, offset),
//         countProducts(filters),
//         loadGroups(),
//         loadSubgroups()
//     ]);

//     res.render('produtos/index', {
//         produtos,
//         filters: {
//             search: filters.search,
//             sync_status: filters.syncStatus,
//             grupo: filters.grupo,
//             subgrupo: filters.subgrupo
//         },
//         pagination: {
//             page,
//             limit,
//             totalRegistros: total,
//             totalPages: Math.max(1, Math.ceil(total / limit))
//         },
//         grupos,
//         subgrupos
//     });
// });

// router.get('/produto/:codigo', async (req, res) => {
//     const codigo = Number(req.params.codigo);

//     if (!Number.isFinite(codigo)) {
//         return res.status(400).send('Codigo de produto invalido.');
//     }

//     const config = await ensureConfig();
//     const priceTable = Number(config.tabela_preco) || undefined;
//     const produtos = await productRepository.findSingleCompleteErpProduct(codigo, 'S', priceTable);

//     if (!produtos.length) {
//         return res.status(404).send('Produto nao encontrado.');
//     }

//     const produto = produtos[0] as any;
//     const fotos = await photosRepository.findPhotosProductbyParams({ product: codigo });

//     produto.IMAGENS = fotos.map((foto) => ({
//         link: foto.LINK || foto.CAMINHO_FOTO || '',
//         origem: foto.LINK ? 'mysql' : 'erp',
//         ativo: 'S',
//         id_postgres: foto.id
//     }));

//     res.render('produto-editar', {
//         produto,
//         pageTitle: `Editar Produto ${codigo}`
//     });
// });

// router.post('/post-products', async (req, res) => {
//     const selected = req.body?.produtos ?? req.body?.selected_products ?? [];

//     return res.status(501).json({
//         error: 'Envio para a Rotony ainda nao implementado.',
//         message: 'O ambiente esta configurado, mas o cliente da API Rotony ainda precisa ser implementado.',
//         produtos: selected
//     });
// });

// router.get('/configuracoes', async (req, res) => {
//     const config = await ensureConfig();
//     const tabelas = await loadPriceTables();

//     res.render('configuracoes/index', {
//         msgSucesso: req.query.sucesso === 'true',
//         msgErro: req.query.erro === 'true',
//         dados: {
//             enviar_produtos: config.enviar_produtos,
//             atualizar_produtos: config.atualizar_produtos,
//             enviar_imagens: config.enviar_imagens,
//             tabela_preco: config.tabela_preco,
//             tamanho_lote: config.tamanho_lote,
//             ultimo_envio_produto: config.ultimo_envio_produto
//         },
//         formas_pagamento: [],
//         setores: [],
//         tabelas
//     });
// });

// router.post('/ajusteConfig', async (req, res) => {
//     try {
//         const current = await ensureConfig();
//         const body = req.body ?? {};

//         await conn2.query(`
//             UPDATE ${configTable()}
//             SET enviar_produtos = ?,
//                 atualizar_produtos = ?,
//                 enviar_imagens = ?,
//                 tabela_preco = ?,
//                 tamanho_lote = ?
//             WHERE id = ?
//         `, [
//             body.enviar_produtos ?? current.enviar_produtos,
//             body.atualizar_produtos ?? current.atualizar_produtos,
//             body.enviar_imagens ?? current.enviar_imagens,
//             Number(body.tabela_preco ?? current.tabela_preco ?? 0),
//             Number(body.tamanho_lote ?? current.tamanho_lote ?? 100),
//             current.id
//         ]);

//         return res.redirect('/configuracoes?sucesso=true');
//     } catch (error) {
//         console.error('Erro ao salvar configuracao:', error);
//         return res.redirect('/configuracoes?erro=true');
//     }
// });

export { router };
