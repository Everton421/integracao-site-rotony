import  crypto from 'node:crypto'
 
// Utilitário para validar HMAC da Shopify
export function isValidHmac(query:any) {

  if(! process.env.SHOPIFY_API_SECRET) return;
  const {hmac, ...rest} = query;
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&');

  const generatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');

  return generatedHmac === hmac;
}