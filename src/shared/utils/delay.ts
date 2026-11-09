  export function delay(ms:number, service_name?:string) {
      return new Promise((resolve) => {
          const msg = ` Aguardando ${ms / 1000} segundos `
        const comp = service_name ? `para excutar ${service_name}...` : `...`
        console.log( msg + comp)
        setTimeout(resolve, ms)
    });
    } 