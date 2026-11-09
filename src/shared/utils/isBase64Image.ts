function isBase64Image(str: string): boolean {
  if (!str) return false;
  const regex = /^data:image\/[a-zA-Z+.-]+;base64,/;
    console.log(  regex.test(str) )
  return regex.test(str);
}



function getBase64Data(str: string):string | null { 
    if (!str) return null;

  // 2. Regex para validar o cabeçalho (mesma lógica da sua função anterior)
  const regex = /^data:image\/[a-zA-Z+.-]+;base64,/;
  
  // 3. Se não tiver o cabeçalho correto, retorna null (não é uma imagem base64 válida)
  if (!regex.test(str)) {
    return null;
  }

  // 4. Divide a string na vírgula e pega a segunda parte (os dados)
  // Ex: "data:image/png;base64,iVBORw..." -> ["data:image/png;base64", "iVBORw..."]
  return str.split(',')[1];
}