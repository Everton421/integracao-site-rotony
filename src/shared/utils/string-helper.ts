


export class StringHelper{
 
    /**
     * Corrige caracteres comuns de encodings quebrados (Latin1 -> UTF8)
     */
    static fixEncoding(str: string | null | undefined): string {
        if (!str) return "";

        try {
            // Tenta converter o buffer: 
            // Se o dado vem do banco como 'binary' ou 'latin1' mas é lido como utf8 errado
            return Buffer.from(str, 'binary').toString('utf-8');
        } catch (error) {
            return str;
        }
    }

    /**
     * Remove caracteres de controle que quebram JSON/GraphQL
     * (Ex: quebras de linha invisíveis, tabs excessivos fora de string)
     */
    static sanitizeGraphQL(str: string): string {
        if (!str) return "";
        let cleanStr = this.fixEncoding(str);
        
        // Remove caracteres de controle ASCII inválidos, mantendo acentos
        // eslint-disable-next-line no-control-regex
        return cleanStr.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, "");
    }

    /**
     * Remove caracteres que não podem ser armazenados em Latin1 (MySQL)
     * Ex: U+2060 (WORD JOINER), U+200B (ZERO WIDTH SPACE), etc.
     */
    static sanitizeLatin1(str: string | null | undefined): string {
        if (!str) return "";
        return str.replace(/[^\x00-\xFF]/g, "").trim();
    }


}