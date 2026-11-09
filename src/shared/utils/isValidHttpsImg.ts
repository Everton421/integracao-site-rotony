export function isHttpsUrl(url:string) {
  return typeof url === 'string' && url.startsWith('https://');
}