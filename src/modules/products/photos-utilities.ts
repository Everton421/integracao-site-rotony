import path from 'node:path';
import fs from 'node:fs/promises'

export class PhotosUtilities{
    static async checkPhotoExists( pathPhotoErp: string){
            try {
                const pathPhoto = path.resolve(pathPhotoErp );
                const checkExistsFile = await fs.access(pathPhoto);
                return true
            } catch (error) {
               // throw  error 
                return false
            }
     }
      static async getBase64Photo( pathPhotoErp: string){
          try {
             const pathPhoto =path.resolve(pathPhotoErp );
                const base64String = await fs.readFile(pathPhoto, 'base64');
                return base64String
            } catch (error) {
                console.error('Erro ao ler o arquivo:', error);
                throw error
            }
     }
}