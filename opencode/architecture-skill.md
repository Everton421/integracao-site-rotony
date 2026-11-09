# SKILL: Especialista em Integração ERP -> Catálogo Rotony (Monolito Modular & Clean Architecture)

Você atua como um Engenheiro de Software Sênior e Arquiteto de Soluções. Sua função é projetar e implementar a sincronização de produtos entre o ERP Legado (MySQL) e a API do Catálogo Rotony.

> Documento base em evolução. Os pontos marcados com **[A CONFIRMAR]** devem ser completados com novas instruções antes da implementação.

---

## 1. OBJETIVO E ESCOPO

- O ERP é a fonte da verdade dos produtos, preços, estoque e imagens.
- O destino é a API do Catálogo Rotony, especificada em `docs/api-integracao.pdf`.
- A aplicação mantém um banco próprio, no MySQL `DB_API`, para registrar o estado dos produtos sincronizados, tokens e logs.
- Os arquivos do projeto Nuvemshop existentes no repositório servem apenas como referência de organização, clientes HTTP e padrões de repositório. Eles não são o destino da integração.
- A integração deve ser idempotente, tolerante a falhas e capaz de reprocessar produtos com erro.

### Referências existentes no projeto

- Consultas de produtos do ERP: `src/modules/products/produto-repository.ts`.
- Fotos de produtos: `src/modules/products/photos-repository.ts`.
- Conexões MySQL: `src/database/database-connection.ts`.
- Criação das tabelas de integração: `src/database/seed.ts`.
- Interface de token: `src/shared/interfaces/tokens-integration.ts`.
- Cliente HTTP legado: `src/shared/api/api.ts`.

---

## 2. STACK TECNOLÓGICA & RESTRIÇÕES CRÍTICAS

1. **Runtime:** Node.js em modo nativo TypeScript via `--experimental-strip-types`.
   - Comando de execução: `node --env-file .env --experimental-strip-types src/server.ts`
   - **Regra do TypeScript Strip-Types:** NÃO USE `enums` do TypeScript nem decorators experimentais. Use `const objects as const` ou `Union Types`.
   - Use estritamente ESM (`import/export`).
2. **Dependências:**
   - Consulte o `package.json` antes de sugerir ou instalar bibliotecas.
   - MySQL: use estritamente `mysql2/promise` com Connection Pool.
   - Evite ORM pesado. Prefira Repositories com SQL puro e queries parametrizadas.
3. **Documentação externa:**
   - Payloads, headers, endpoints e autenticação da API do catálogo estão em `docs/`.
   - Ao criar DTOs, valide o contrato contra `docs/api-integracao.pdf`.
4. **Proibições:**
   - Não concatenar valores externos em SQL. Use `?` e o array de parâmetros.
   - Não registrar `client_secret`, `access_token` ou payloads sensíveis em logs.
   - Não usar paralelismo descontrolado nas chamadas à API do catálogo.

---

## 3. ARQUITETURA: MONOLITO MODULAR + CLEAN ARCH

O projeto deve ser estruturado em módulos independentes dentro de `src/modules/`.

### Estrutura esperada

```text
src/
├── config/                       # Variáveis de ambiente e bootstrap
├── database/                     # Pools MySQL existentes e seed
├── shared/
│   ├── errors/                   # Erros tipados da aplicação
│   ├── http/                     # Wrapper de HTTP (fetch nativo)
│   └── interfaces/               # Interfaces compartilhadas
├── modules/
│   ├── auth/
│   │   ├── domain/               # Token, portas e regras de expiração
│   │   ├── application/          # Obter/renovar token
│   │   └── infrastructure/       # Repositório MySQL + cliente OAuth
│   ├── products/
│   │   ├── domain/               # Entidade Product e portas
│   │   ├── application/          # Casos de uso de leitura e mapeamento
│   │   ├── infrastructure/
│   │   │   ├── database/         # Repositórios do ERP e da integração
│   │   │   └── external/         # Cliente da API do Catálogo Rotony
│   │   └── presentation/         # Controllers e gatilhos manuais
│   └── sync/
│       ├── application/          # Orquestração da sincronização
│       └── presentation/         # Cron e comandos de carga
└── server.ts                     # Ponto de entrada
```

### Diretrizes

- `domain` não importa `mysql2`, `fetch` ou detalhes de infraestrutura.
- `application` depende de interfaces (ports), não de implementações concretas.
- `infrastructure` implementa os repositórios e clientes externos.
- `presentation` apenas valida a entrada e aciona os casos de uso.
- Injeção de dependência manual no bootstrap, sem framework de DI.

---

## 4. FONTE DE DADOS DO ERP — BANCO PÚBLICO

Toda consulta de produto deve usar o banco público configurado em `DB_PUBLICO`.

### Tabelas principais

| Tabela | Papel | Campos relevantes |
| --- | --- | --- |
| `cad_prod` | Produto | `CODIGO`, `GRUPO`, `SUBGRUPO`, `MARCA`, `ATIVO`, `NO_SITE`, `DATA_RECAD`, `TITULO_SITE`, `DESCRICAO`, `DESCR_LONGA_SITE`, `DESCR_CURTA_SITE`, `SKU_SITE`, `OUTRO_COD`, `PESO`, `COMPRIMENTO`, `LARGURA`, `ALTURA`, `GARANTIA`, `ORIGEM`, `NUM_FABRICANTE` |
| `cad_pgru` | Grupo/categoria | `CODIGO`, `NOME`, `NO_SITE`, `ATIVO` |
| `subgrupos` | Subgrupo/subcategoria | `CODIGO`, `COD_GRUPO`, `DESCRICAO`, `NO_SITE` |
| `cad_pmar` | Marca | `CODIGO`, `DESCRICAO` |
| `prod_tabprecos` | Preços | `PRODUTO`, `TABELA`, `PRECO`, `PROMOCAO`, `VALID_PROM` |

### Joins oficiais

```sql
FROM DB_PUBLICO.cad_prod p
LEFT JOIN DB_PUBLICO.cad_pmar m
  ON m.CODIGO = p.MARCA
LEFT JOIN DB_PUBLICO.cad_pgru cg
  ON cg.CODIGO = p.GRUPO
LEFT JOIN DB_PUBLICO.subgrupos sg
  ON sg.CODIGO = p.SUBGRUPO
 AND sg.COD_GRUPO = cg.CODIGO
LEFT JOIN DB_PUBLICO.prod_tabprecos tp
  ON tp.PRODUTO = p.CODIGO
 AND tp.TABELA = ?
```

### Regras de consulta

- Somente leitura no ERP. Nunca executar `INSERT`, `UPDATE` ou `DELETE` no banco público.
- Parametrizar o código da tabela de preços; não interpolar `tabela_preco` diretamente no SQL.
- Para envio ao catálogo, considerar produtos com `p.ATIVO = 'S'` e `p.NO_SITE = 'S'`.
- Validar também `cg.NO_SITE = 'S'` e `sg.NO_SITE = 'S'` quando a categoria/subcategoria precisar estar publicada.
- Carga incremental: `p.DATA_RECAD > ultimo_envio_produto` ou produto sem registro local.
- Carga inicial: todos os produtos ativos e publicados.
- Evitar duplicidade por grupo quando o mesmo `CODIGO` de subgrupo existir em grupos diferentes; sempre relacionar `COD_GRUPO`.

### Mapeamento ERP -> payload do catálogo

| Campo do catálogo | Origem sugerida |
| --- | --- |
| `externalId` | `cad_prod.CODIGO` |
| `name` | `TITULO_SITE` ou `DESCRICAO` |
| `description` | `DESCR_LONGA_SITE` ou `DESCRICAO` |
| `sku` | `SKU_SITE`, `OUTRO_COD` ou `CODIGO` **[A CONFIRMAR]** |
| `category` | Lista com `cad_pgru.NOME` e `subgrupos.DESCRICAO` |
| `brand` | `cad_pmar.DESCRICAO` |
| `price` | `prod_tabprecos.PRECO` ou promoção vigente **[A CONFIRMAR]** |
| `inStock` | Regra de estoque existente em `DB_ESTOQUE`/`DB_VENDAS` **[A CONFIRMAR]** |
| `active` | `ATIVO = 'S'` e `NO_SITE = 'S'` |
| `images` | `DB_PUBLICO.fotos_prod` + `DB_VENDAS.parametros.FOTOS`; URL (`LINK`) ou base64 validado |
| `url` | Definida pela Rotony na criação; persistir a URL retornada |

### Preços

- A tabela de preços deve vir da configuração da aplicação, como `configuracoes.tabela_preco`.
- O preço efetivo deve considerar promoção vigente quando `VALID_PROM` for válido **[A CONFIRMAR]**.
- Alterações de preço devem ser detectadas por comparação com o último preço enviado.
- O catálogo exige o produto completo no `PUT`; não envie apenas o preço.

### Estoque

- O catálogo usa `inStock` booleano.
- A regra de saldo continua sendo consultada nas bases de estoque/vendas existentes.
- A definição exata de “disponível” por filial/setor está **[A CONFIRMAR]**.

### Imagens

#### Origem e join

A origem oficial das fotos é o banco público do ERP:

- `DB_PUBLICO.fotos_prod`: registros das fotos por produto.
- `DB_VENDAS.parametros`: pasta base das imagens.
- `parametros.FOTOS` é a pasta raiz; `fotos_prod.FOTO` é o arquivo/caminho relativo.
- `fotos_prod.LINK`, quando preenchido com `http://` ou `https://`, tem prioridade e deve ser enviado como URL, sem ler arquivo local.

O join deve permanecer no repositório de fotos, pois os dois lados da consulta pertencem à leitura do ERP:

```sql
SELECT
  fp.id,
  fp.PRODUTO,
  fp.SEQ,
  fp.FOTO,
  fp.LINK,
  par.FOTOS AS PASTA_BASE
FROM DB_PUBLICO.fotos_prod fp
JOIN DB_VENDAS.parametros par
  ON par.ID = 1
WHERE fp.PRODUTO IN (...)
ORDER BY fp.PRODUTO, fp.SEQ
```

- Não usar `CompanyRepository.findIndiceErpParams()` para obter a pasta de fotos: ele consulta `parametros.INDICE`, que é índice de preço.
- A consulta existente em `src/modules/products/photos-repository.ts` já faz esse join e deve ser a base da implementação.
- `fotos_prod.FOTO` pode conter subpastas. Resolver sempre com `path.join(PASTA_BASE, FOTO)` e nunca concatenar strings manualmente.

#### Resolução segura do arquivo

1. Se `LINK` for uma URL `http`/`https` válida, usar a URL diretamente.
2. Caso contrário, resolver o caminho local com `path.join`.
3. Normalizar o caminho final e garantir que ele permaneça dentro de `PASTA_BASE`.
4. Rejeitar caminhos com `..`, caminhos absolutos que escapem da pasta base ou arquivos que não existam.
5. Ler o arquivo com `fs/promises.readFile` e obter `mime`, `tamanho` e bytes reais.

O formato exato dos valores de `parametros.FOTOS` e `fotos_prod.FOTO` e se a pasta é local/UNC acessível pelo processo Node ainda está **[A CONFIRMAR]**. Um exemplo real dos dois campos deve ser validado antes da implementação.

#### Validação de imagem e base64

Antes de montar o payload:

- Aceitar somente JPEG, PNG e WebP.
- Validar pela assinatura real do arquivo, não apenas pela extensão:
  - JPEG: `ff d8 ff`
  - PNG: `89 50 4e 47`
  - WebP: `52 49 46 46 ... 57 45 42 50`
- Rejeitar GIF e formatos desconhecidos.
- Tamanho máximo do arquivo bruto: **5 MB por imagem**.
- Máximo de **10 imagens por produto**.
- Converter para base64 e verificar se o tamanho decodificado é igual ao tamanho do arquivo.
- Validar padding e caracteres do base64.
- Preferir `data:image/{mime};base64,...` para explicitar o tipo; a Rotony também aceita base64 puro.
- Se qualquer imagem for inválida, não enviar o produto. A Rotony rejeita o produto inteiro com `422`; a validação deve falhar antes da chamada.

O `src/shared/utils/isBase64Image.ts` atual não é suficiente: valida apenas data URI por regex, não confere assinatura, decodificação nem tamanho. O validador deve ser reintroduzido/reescrito em `src/shared/utils/`, removendo `console.log` e cobrindo os casos acima.

#### Payload, cache e reaproveitamento

- A Rotony devolve a URL pública da imagem gravada. Persistir essa URL em `fotos_produtos.url_catalogo`.
- Em sincronizações futuras, se o hash do arquivo não mudou e já existe `url_catalogo`, enviar a URL em vez de base64.
- Se o arquivo mudou, gerar novo base64 e reenviar.
- Nunca persistir o base64 no `DB_API` nem em logs.
- Calcular o tamanho total do payload: limite de **20 MB por chamada de produto** e **50 MB por lote**.
- Como base64 cresce cerca de 33%, 10 imagens de 5 MB podem ultrapassar 20 MB. Nesse caso, reduzir a quantidade de imagens enviadas por chamada, usar URLs já publicadas ou dividir o lote.
- O limite de 10 imagens é por produto, mas o limite de corpo da chamada sempre prevalece.

#### Falha de imagem

- Registrar em `sync_logs` qual foto falhou, o caminho e o motivo.
- Marcar o produto com `sync_status = 'error'` e `error_message` objetivo.
- Não avançar `ultimo_envio_produto` para o produto com erro.
- Reprocessar na próxima execução depois de corrigir o arquivo ou a configuração.

---

## 5. AUTENTICAÇÃO — OAUTH 2.0 CLIENT CREDENTIALS

A API usa OAuth 2.0 no fluxo `client_credentials`.

### Variáveis de ambiente

```env
API_BASE_URL=https://...
API_VERSION=v1
API_CLIENT_ID=...
API_CLIENT_SECRET=...
```

- `API_CLIENT_ID` e `API_CLIENT_SECRET` vêm da Rotony por canal seguro.
- Credenciais são diferentes por ambiente.
- Nunca versionar o `.env` nem expor o segredo em logs.

### Obter token

```http
POST /api/v1/auth/token
Content-Type: application/x-www-form-urlencoded
```

Corpo:

```text
grant_type=client_credentials&client_id=SEU_CLIENT_ID&client_secret=SEU_CLIENT_SECRET
```

Também são aceitos:

- JSON: `{"grant_type":"client_credentials","client_id":"...","client_secret":"..."}`
- Header `Authorization: Basic base64(client_id:client_secret)`

Resposta `200 OK`:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Uso do token

```http
Authorization: Bearer <access_token>
```

### Regras obrigatórias

- Reaproveitar o token até perto do vencimento. Não solicitar token a cada chamada.
- A rota de token aceita no máximo **10 requisições por minuto**.
- Em `401 token_expired` ou `401 unauthorized`, solicitar um novo token e repetir a chamada **uma única vez**.
- Se o segundo `401` ocorrer, falhar e registrar erro de autenticação.
- Uma credencial revogada invalida imediatamente todos os tokens dela.
- Em rotação de segredo, a Rotony emite uma credencial nova; o sistema passa a usá-la e depois a antiga é revogada.
- Usar controle de concorrência (mutex/single-flight) para evitar várias renovações simultâneas.

### Persistência do token no `DB_API`

A tabela `tokens` deve armazenar o token da aplicação:

| Coluna | Tipo sugerida | Observação |
| --- | --- | --- |
| `id` | INT PK | Usar registro único, por exemplo `id = 1` |
| `token` | VARCHAR/TEXT | `access_token` |
| `token_type` | VARCHAR(20) | `Bearer` |
| `expires_in` | INT | Segundos retornados pela API |
| `expires_at` | DATETIME | Calculado no momento da emissão |
| `ult_atualizacao` | DATETIME | Última renovação |

- O fluxo `client_credentials` não usa `refresh_token`; a coluna pode ser mantida como legado ou removida.
- Antes de usar, verificar `expires_at > agora + margem de segurança`.
- Se estiver vencido ou ausente, renovar e fazer upsert.

---

## 6. BANCO DE DADOS DA APLICAÇÃO — `DB_API`

O MySQL `DB_API` é o banco de controle da integração. Ele registra o que foi sincronizado, o token e os erros. Ele não substitui o ERP como fonte da verdade.

### Tabelas

#### `produtos`

| Coluna | Finalidade |
| --- | --- |
| `id` | PK local |
| `codigo_erp` / `erp_sku` | Código do produto no ERP, único |
| `external_id` | Identificador enviado à Rotony; usar o código do ERP |
| `titulo` | Nome enviado ao catálogo |
| `preco` | Último preço enviado |
| `sync_status` | `pending`, `synced`, `error`, `inactive`, `waiting_update` |
| `error_message` | Último erro de sincronização |
| `dados_produto` | Payload enviado, em JSON |
| `hash_payload` | Hash para detectar mudanças reais |
| `url_catalogo` | URL retornada pela Rotony |
| `ultimo_envio_produto` | Data do último envio com sucesso |
| `data_recad_erp` | `DATA_RECAD` do ERP no momento da leitura |
| `created_at`, `updated_at` | Controle local |

- Substituir referências legadas a `shopify_product_id` por campos neutros do catálogo.
- Criar índice em `sync_status` e `data_recad_erp`.
- `external_id` deve ser estável; a URL do produto é definida na criação e não deve ser alterada.

#### `fotos_produtos`

| Coluna | Finalidade |
| --- | --- |
| `id` | PK local |
| `codigo_erp` | Produto no ERP |
| `id_foto_erp` | Identificador/sequência da foto em `fotos_prod.id` |
| `posicao` | Ordem de exibição (`SEQ`) |
| `caminho_origem` | Caminho montado a partir de `parametros.FOTOS` + `fotos_prod.FOTO` |
| `origem_tipo` | `url` ou `base64` |
| `mime_type` | `image/jpeg`, `image/png` ou `image/webp` |
| `tamanho_bytes` | Tamanho bruto validado |
| `hash` | Evitar reenvio do mesmo arquivo |
| `url_catalogo` | URL retornada pela Rotony |
| `validado_em` | Última validação bem-sucedida |
| `created_at`, `updated_at` | Controle local |

- Reaproveitar a tabela existente, ajustando/removendo campos legados de Shopify e PostgreSQL.
- Manter unicidade por produto e foto.
- Não persistir o conteúdo base64.

#### `tokens`

- Cache do token OAuth, conforme seção 5.

#### `sync_logs`

| Coluna | Finalidade |
| --- | --- |
| `id` | PK |
| `referencia` | `product` |
| `referencia_id` | ID local ou código ERP |
| `action` | `create`, `update`, `delete`, `batch`, `auth` |
| `status` | `sucess`, `error`, `warning` |
| `http_status` | Código HTTP retornado |
| `message` | Mensagem resumida |
| `created_at` | Data do evento |

- Não armazenar tokens nem credenciais.
- Payload completo, se necessário, deve ser sanitizado e limitado.

#### `configuracoes`

O escopo atual é somente envio de produtos e suas configurações. A tabela deve ser reduzida para:

| Coluna | Finalidade |
| --- | --- |
| `id` | PK; usar `id = 1` |
| `enviar_produtos` | `S`/`N` para habilitar o envio de produtos |
| `atualizar_produtos` | `S`/`N` para permitir atualização de produtos já enviados |
| `enviar_imagens` | `S`/`N` para incluir imagens no payload |
| `tabela_preco` | Tabela de preços usada do ERP |
| `tamanho_lote` | Tamanho do lote; padrão e máximo 100 |
| `ultimo_envio_produto` | Controle da carga incremental |
| `created_at`, `updated_at` | Controle local |

Remover da configuração e do fluxo:

- envio de estoque separado;
- envio de preço separado;
- importação/sincronização de pedidos;
- forma de pagamento e vendedor de pedido;
- Intelipost;
- canais de venda, locais e variantes legadas.

### Diretrizes

- Alterações de schema devem ser feitas no `seed.ts` ou em migrations explícitas.
- Usar `CREATE TABLE IF NOT EXISTS` apenas para bootstrap; mudanças estruturais exigem migration.
- `dados_produto` deve ser JSON serializado e sanitizado.
- O banco de integração nunca deve ser usado como fonte de preço, estoque ou descrição.

---

## 7. CONTRATO DA API DO CATÁLOGO ROTONY

### Endpoints

| Método | Rota | Uso |
| --- | --- | --- |
| `POST` | `/api/v1/auth/token` | Obter token OAuth 2.0 |
| `PUT` | `/api/v1/products/{externalId}` | Criar ou atualizar produto completo |
| `POST` | `/api/v1/products` | Criar produto, equivalente ao `PUT` |
| `POST` | `/api/v1/products/batch` | Criar/atualizar até 100 produtos |
| `DELETE` | `/api/v1/products/{externalId}` | Remover produto do site (soft delete) |
| `GET` | `/api/v1/products/{externalId}` | Consultar produto salvo |
| `POST` | `/api/v1/uploads` | Enviar imagem e obter URL pública |

### Payload de produto

```json
{
  "externalId": "12345",
  "name": "Nome do produto",
  "description": "Descrição completa",
  "sku": "12345",
  "category": ["Ferramentas", "Chaves"],
  "brand": "Marca",
  "price": 99.9,
  "inStock": true,
  "active": true,
  "images": ["https://..."],
  "url": "https://...",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### Regras

- `externalId` é obrigatório e imutável.
- `url` é definida na criação e não muda depois.
- `PUT` cria o produto se ele não existir.
- `DELETE` não apaga o registro; para reexibir, enviar o produto novamente.
- `PUT`, `DELETE` e lote são idempotentes; reenviar em caso de `500` ou falha de rede é seguro.
- `batch` aceita até 100 produtos.
- Imagens: até 10 por produto, máximo de 5 MB por arquivo bruto.
- Limites de corpo: 20 MB por chamada de produto e 50 MB por lote, considerando o crescimento do base64.
- Uma imagem inválida rejeita o produto inteiro com `422`; validar antes de enviar.
- Taxa: até 20 chamadas por segundo, com tolerância a picos curtos.
- Em `429`, aguardar e repetir sem paralelismo.
- Erros esperados: `400`, `401`, `404`, `413`, `429`, `500`.

---

## 8. FLUXO DE SINCRONIZAÇÃO

1. **Autenticação**
   - Obter ou reaproveitar token da tabela `tokens`.
   - Renovar quando estiver próximo do vencimento.

2. **Carga inicial**
   - Consultar todos os produtos ativos e publicados no `DB_PUBLICO`.
   - Enviar em lotes de até 100 produtos.
   - Registrar cada produto localmente antes ou durante o envio.

3. **Carga incremental**
   - Buscar produtos com `DATA_RECAD > ultimo_envio_produto`.
   - Buscar também produtos locais com `sync_status = 'error'` ou `pending`.
   - Enviar cada produto com `PUT /api/v1/products/{externalId}`.

4. **Preparar e validar fotos**
   - Consultar `fotos_prod` com join em `parametros` para obter `PASTA_BASE`, `FOTO` e `LINK`.
   - Usar `LINK` diretamente quando for URL `http/https`.
   - Caso contrário, resolver o caminho dentro de `PASTA_BASE`, ler o arquivo e validar MIME, assinatura, decodificação e tamanho.
   - Reaproveitar `url_catalogo` quando o hash não mudou.
   - Falhar o produto antes da chamada se qualquer foto for inválida.
   - Verificar o tamanho total do payload antes de enviar.

5. **Produto removido ou descontinuado**
   - Se `ATIVO = 'N'`, `NO_SITE = 'N'` ou removido do ERP, enviar `DELETE` ou `PUT` com `active: false`.
   - Atualizar `sync_status` para `inactive`.

6. **Persistência do resultado**
   - Sucesso: `sync_status = 'synced'`, atualizar `ultimo_envio_produto`, `url_catalogo` e `dados_produto`.
   - Falha: `sync_status = 'error'`, preencher `error_message` e registrar em `sync_logs`.
   - Nunca avançar `ultimo_envio_produto` em caso de falha.
   - Persistir as URLs de imagem retornadas pela Rotony em `fotos_produtos.url_catalogo`.

7. **Idempotência e reprocessamento**
   - O mesmo `externalId` deve gerar sempre o mesmo resultado.
   - Produtos com erro devem ser reprocessados na próxima execução.
   - O envio não deve depender de ordem entre produtos.

---

## 9. VARIÁVEIS DE AMBIENTE

```env
# API do catálogo
API_BASE_URL=https://...
API_VERSION=v1
API_CLIENT_ID=...
API_CLIENT_SECRET=...

# Bancos do ERP
HOST=...
PORT_DB=3306
USER=...
PASSWORD=...
DB_PUBLICO=...
DB_VENDAS=...
DB_ESTOQUE=...

# Banco de integração
HOST_API=...
PORT_DB_API=3306
USER_API=...
PASSWORD_API=...
DB_API=...

# Sincronização
PRICE_TABLE_ID=...
SYNC_BATCH_SIZE=100
```

### Arquivos de ambiente

- `.env`: produção.
- `.env.test`: homologação/desenvolvimento.
  - `API_BASE_URL=https://16-58-173-147.sslip.io`
  - `API_VERSION=v1`
  - `DB_PUBLICO=delari_publico`
  - `DB_VENDAS=delari_vendas`
  - `DB_ESTOQUE=delari_estoque`
  - `DB_FINANCEIRO=delari_financeiro`
  - `DB_API=integracao_rotony_teste`
  - `CRON=0` para não disparar jobs no modo dev
- `npm run dev` usa `--env-file .env.test`.
- `npm start` usa `--env-file .env`.
- `API_CLIENT_ID` e `API_CLIENT_SECRET` devem ser preenchidos localmente; nunca versionar os valores reais.
- Validar variáveis obrigatórias no bootstrap e falhar rápido se faltarem.

---

## 10. CONVENÇÕES E SEGURANÇA

- Interfaces em `src/shared/interfaces/` ou no `domain` do módulo.
- Repositórios recebem `Pool` e nomes de bancos por injeção.
- Erros de domínio separados de erros de infraestrutura.
- SQL sempre parametrizado.
- Logs estruturados, sem credenciais, tokens ou dados sensíveis.
- Não criar dependência circular entre módulos.
- Não usar `any` para esconder contratos; tipar respostas da API e do ERP.
- Manter nomes de tabelas e colunas do ERP exatamente como existem no banco público.

---

## 11. ESCOPO SIMPLIFICADO — ENVIO DE PRODUTOS E CONFIGURAÇÕES

O projeto deve ser reduzido ao fluxo de envio de produtos do ERP para o catálogo Rotony e à gravação das configurações desse envio. Não manter telas ou rotas de pedidos, estoque, preço separado, clientes, serviços, setores, canais, Intelipost ou integrações legadas.

### Rotas ativas

| Método | Rota | Uso |
| --- | --- | --- |
| `GET` | `/` | Painel com resumo do envio de produtos e atalho para configurações |
| `GET` | `/produtos` | Listagem de produtos do ERP, status e seleção para envio |
| `GET` | `/produto/:codigo` | Detalhe somente leitura do produto e preview das fotos |
| `POST` | `/post-products` | Enviar produtos selecionados ou produto individual |
| `GET` | `/configuracoes` | Tela de configurações do envio |
| `POST` | `/ajusteConfig` | Gravar configurações do envio |

Manter os nomes atuais de `/post-products` e `/ajusteConfig` para não aumentar o retrabalho dos controllers existentes. As demais rotas devem ser removidas de `src/web/routes.ts`.

### Views ativas

| View | Situação |
| --- | --- |
| `src/web/Views/index.ejs` | Manter e simplificar para status de produtos/configurações |
| `src/web/Views/produtos/index.ejs` | Manter e remover ações de estoque, preço e atualização massiva |
| `src/web/Views/produtos/detalhe.ejs` | Criar a partir de `produto-editar.ejs`, somente leitura + fotos + envio |
| `src/web/Views/configuracoes/index.ejs` | Manter e reduzir aos campos de produto |
| `src/web/Views/components/sidebar.ejs` | Manter apenas Painel, Produtos e Configurações |

Remover ou parar de usar:

- `src/web/Views/produto-editar.ejs` após criar `produtos/detalhe.ejs`;
- `src/web/Views/produto-editar copy.ejs`;
- `src/web/Views/fotos/`;
- `src/web/Views/logs/`;
- `src/web/Views/pedidos/`;
- `src/web/Views/clientes/`;
- `src/web/Views/servicos/`;
- `src/web/Views/setores/`;
- `src/web/Views/canais-venda/`;
- `src/web/Views/categorias/`;
- `src/web/Views/intelipost/`;
- `src/web/Views/teste/`.

Os logs continuam sendo gravados em `sync_logs`, mas sem tela dedicada neste escopo.

### Comportamento esperado das telas

#### Painel

- Mostrar apenas indicadores de produtos: total, pendentes, enviados e com erro.
- Atalho para `/produtos` e `/configuracoes`.
- Remover cards e métricas de pedidos, estoque ou preço.

#### Listagem de produtos

- Filtros por código, descrição, status e categoria.
- Seleção de produtos e envio em lote.
- Exibir `sync_status`, última sincronização e erro resumido.
- Exibir contagem/status das fotos quando disponível.
- Remover botões de estoque, preço, atualização massiva, Shopify e Intelipost.
- Respeitar `tamanho_lote` e o limite de 100 produtos por lote.

#### Detalhe do produto

- Dados do ERP somente leitura.
- Fotos vindas de `fotos_prod` + `parametros`, com preview e status de validação por imagem.
- URL `LINK` usada diretamente quando existir.
- Fotos locais convertidas para base64 somente no momento do envio.
- Botão para enviar/atualizar o produto na Rotony.
- Remover upload do computador, inclusão manual de URL, campos editáveis e referências a Shopify/Nuvemshop.
- Se não houver foto, permitir envio sem imagens, salvo regra de negócio contrária.
- Se houver foto inválida, bloquear o envio e mostrar o motivo.

#### Configurações

- `enviar_produtos`
- `atualizar_produtos`
- `enviar_imagens`
- `tabela_preco`
- `tamanho_lote`
- `ultimo_envio_produto` somente leitura
- Remover pedidos, estoque, preço separado, forma de pagamento, vendedor e Intelipost.

### Bootstrap, jobs e integrações

- `src/server.ts` deve importar apenas módulos existentes.
- Remover jobs/imports de pedidos, estoque, preço, Intelipost, canais, locais e variantes.
- Manter o serviço de token OAuth e o envio de produtos.
- Se houver job automático, deve existir apenas o job de produtos.
- Remover o uso de PostgreSQL para fotos; a origem passa a ser a pasta do ERP.
- Remover RabbitMQ/broker e `pg` se não forem mais usados pelo fluxo de produtos.
- Não usar autenticação com callback (`/auth/callback`) para `client_credentials`.

### Estado atual que precisa ser corrigido

- O working tree contém apenas os módulos `company` e `products`.
- `src/web/routes.ts` ainda importa controllers/serviços deletados de pedidos, estoque, preço, canais, Intelipost, fotos e autenticação.
- `src/server.ts` ainda importa jobs e módulos removidos.
- Por isso a aplicação não inicia no estado atual. A simplificação de rotas, server e views é pré-requisito para validar o restante.

---

## 12. CHECKLIST DE VALIDAÇÃO DO PROJETO

Usar este checklist para validar qualquer parte do projeto antes de considerar a implementação concluída.

### 12.1 Build e inicialização

- [ ] `npm install` conclui sem erros.
- [ ] `npm run start` inicia a aplicação sem imports de arquivos inexistentes.
- [ ] `src/server.ts` não importa controllers, jobs ou repositórios deletados.
- [ ] `src/web/routes.ts` registra somente as rotas da seção 11.
- [ ] O servidor falha rápido e com mensagem clara se variável de ambiente obrigatória faltar.
- [ ] A aplicação abre `/`, `/produtos`, `/produto/:codigo` e `/configuracoes`.

### 12.2 Rotas e views

- [ ] A sidebar contém apenas Painel, Produtos e Configurações.
- [ ] Nenhuma view ativa referencia Shopify, Nuvemshop, Intelipost, pedidos ou estoque.
- [ ] `GET /produtos` lista produtos do ERP e não quebra sem fotos.
- [ ] `GET /produto/:codigo` mostra dados somente leitura.
- [ ] `POST /post-products` envia produto selecionado e produto individual.
- [ ] `POST /ajusteConfig` grava e recarrega as configurações.
- [ ] Views obsoletas não são renderizadas nem acessíveis por rota.

### 12.3 Fotos e base64

- [ ] O join `fotos_prod` + `parametros` retorna `PASTA_BASE`, `FOTO` e `LINK`.
- [ ] `LINK` `http/https` é usado sem leitura de arquivo local.
- [ ] Caminho local é montado com `path.join` e permanece dentro de `PASTA_BASE`.
- [ ] Caminho com `..` ou fora da pasta base é rejeitado.
- [ ] Arquivo inexistente gera erro claro e não quebra o lote inteiro.
- [ ] Assinatura real confere JPEG, PNG ou WebP.
- [ ] GIF e formato desconhecido são rejeitados.
- [ ] Arquivo acima de 5 MB é rejeitado.
- [ ] Base64 decodificado tem o mesmo tamanho do arquivo.
- [ ] Máximo de 10 imagens por produto é respeitado.
- [ ] Payload total não passa de 20 MB por produto nem de 50 MB por lote.
- [ ] Imagem inválida impede o envio do produto e gera `sync_status = 'error'`.
- [ ] `url_catalogo` é reutilizada quando o hash não mudou.
- [ ] Base64 não é salvo em `DB_API`, `sync_logs` ou logs de aplicação.

### 12.4 Payload e API Rotony

- [ ] `externalId` é o código do ERP e permanece estável.
- [ ] `url` só é enviada na criação e persistida depois.
- [ ] `PUT /api/v1/products/{externalId}` envia o produto completo.
- [ ] `POST /api/v1/products/batch` não passa de 100 produtos.
- [ ] Token é reaproveitado e renovado antes do vencimento.
- [ ] Em `401`, o token é renovado e a chamada repetida uma única vez.
- [ ] Em `429`, a aplicação aguarda e repete sem paralelismo.
- [ ] Em falha de rede ou `500`, o reenvio é seguro e idempotente.
- [ ] Respostas de sucesso atualizam `sync_status`, `url_catalogo` e `ultimo_envio_produto`.
- [ ] Respostas de erro atualizam `error_message` e `sync_logs`.

### 12.5 Banco e persistência

- [ ] `DB_API` é MySQL e não é usado como fonte de produto/preço/estoque.
- [ ] `configuracoes` contém apenas os campos da seção 6.
- [ ] `ultimo_envio_produto` não avança em caso de falha.
- [ ] `fotos_produtos` guarda caminho, hash, MIME, tamanho, status e `url_catalogo`.
- [ ] `tokens` tem registro único e `expires_at` correto.
- [ ] `sync_logs` não contém token, credencial ou base64.
- [ ] Queries do ERP são somente leitura e parametrizadas.

### 12.6 Segurança

- [ ] Nenhum segredo aparece em log, tela, commit ou resposta HTTP.
- [ ] `.env` não está versionado.
- [ ] Caminho de foto não permite path traversal.
- [ ] SQL não interpola `tabela_preco` nem outros valores.
- [ ] Erros internos não são devolvidos crus ao navegador.
- [ ] Upload manual e URL arbitrária foram removidos da tela de produto.

### 12.7 Verificação de resíduos legados

Executar buscas no código antes de concluir:

```powershell
# Rotas e imports legados
Select-String -Path src\**\*.ts -Pattern "pedidos|estoque|preco|intelipost|canais-venda|shopify|nuvemshop|postgres|pg-connection|broker"

# Referências a views removidas
Select-String -Path src\web\Views\**\*.ejs -Pattern "pedidos|estoque|preco|intelipost|shopify|nuvemshop|canais-venda"

# Arquivos de view ativos
Get-ChildItem -Recurse -File src\web\Views
```

- [ ] Nenhum resultado inesperado nas buscas acima.
- [ ] Somente as views da seção 11 permanecem ativas.
- [ ] O projeto não depende mais de PostgreSQL para fotos.
- [ ] O projeto não depende mais de RabbitMQ para o fluxo de produtos, se removido.

---

## 13. PONTOS ABERTOS PARA NOVAS INSTRUÇÕES

Os itens abaixo precisam de definição antes ou durante a implementação:

- **[A CONFIRMAR]** Qual tabela de preços (`prod_tabprecos.TABELA`) será usada em produção e homologação.
- **[A CONFIRMAR]** Regra exata de preço efetivo: `PRECO`, `PROMOCAO` ou promoção somente se `VALID_PROM` estiver vigente.
- **[A CONFIRMAR]** Regra exata de `inStock` por filial/setor.
- **[A CONFIRMAR]** Formato real de `parametros.FOTOS` e `fotos_prod.FOTO` e se a pasta é local/UNC acessível pelo processo Node.
- **[A CONFIRMAR]** Campo usado como `sku` e como `name` quando `TITULO_SITE` estiver vazio.
- **[A CONFIRMAR]** Confirmar se `enviar_imagens` deve ser configurável ou sempre obrigatório quando houver fotos.
- **[A CONFIRMAR]** Frequência da carga incremental e horário da carga inicial.
- **[A CONFIRMAR]** URL de homologação e produção da API Rotony.
- **[A CONFIRMAR]** Estratégia para produtos com variantes: um produto por variante ou produto pai com variações.
- **[A CONFIRMAR]** O que fazer quando categoria, subcategoria ou marca estiverem ausentes ou não publicadas.
- **[A CONFIRMAR]** Retenção de logs e política de reprocessamento de erros antigos.
