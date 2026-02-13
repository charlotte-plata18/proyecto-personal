/**
 * configuracion de subida de archibos
 * 
 * Multer es un middleware para manejar la subida de archivos
 * Este archivo configura como y donde se guarda las imagenes 
 */

//importar multer para manejar archivos
const multer = require('multer');

//importar path para trabajar con rutas de archivos
const path = require('path');

//importar fs para verificar/crear directorios
const fs = require('fs');
const { log } = require('console');

//importar dotenv para variables de entorno
require('dotenv').config();

// Obtener la ruta donde se guarda los archivos 
const uploadPath = process.env.UPLOAD_PATH || '/uploads ';

//verificar si la carpeta uploads existe, si no crearla
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Carpeta ${uploadPath} creada `);
}

/**
 * Configuracion de almacenamiento de multer
 * Define donde y como se guarda los archivos
 */

const storage = multer.diskStorage({
    /**
     * Destination: define la carpeta destino donde se guardara el archivo
     * 
     * @param {Object} req - Objeto de peticion HTTP
     * @param {Object} file - Archivo que esta subiendo
     * @param {Function} cb - Callback que se llamara con (error, destination)
     */
    destination: (req, file, cb) => {
        // cb (null, ruta) -> sin error, ruta = carpeta destino
        cb(null, uploadPath);
    },

    /**
     * filname: define el nombre con el que se guardara el archivo
     * formato: timestamp-originalname.ext
     * @param {Object} req - Objeto de peticion HTTP
     * @param {Object} file - Archivo que esta subiendo
     * @param {Function} cb - Callback que se llamara con (error, filename)
     */
    filename: (req, file, cb) => {
        //generara nombre unico usando timestamp + nombre original
        //Date.now() genera el timestamp unico
        //Path-extname() extrae la extencion del archivo (.jpg, .png, etc)
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName); 
    }

});

/**
 * Filtro para validar el tipo de arrchivo 
 * solo permite imagenes (jpg, jpeg, png, gif)
 * 
 * @param {Object} req - Objeto de peticion HTTP
 * @param {Object} file - Archivo que esta subiendo
 * @param {Function} cb - Callback que se llamara con (error, acceptFile)
 */


const fileFilter = (req, file, cb) => {
    //Tiempos mime permitidos para imagenes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    //verificar si el tipo de archivo esta en la lista permitida
    if (allowedTypes.includes(file .mimetype)) {
        // cb (null, true) -> aceptar el archivo
        cb(null, true); 
    } else {
        //cb(error) -> rechazar el archivo
        cb(new Error('solo se permite imagenes (jpg, jpeg, png, gif)'), false);
    }
    
};

/**
 * configurar multer con las opciones definidas
 */

const upload = multer({
    storage: storage,
    filefilter: fileFilter,
    limits:{
        //limite de tamaño dek archivo en bytes 
        //por defecto 5MB (5 *1024 ) 5242880  bytes
        fileSize:parseInt(process.env.MAX_FILE_SIZE) || 5242880
    }
});

/**
 * funcion para eliminar el archivo del servidor 
 * Utili cuando se actualiza o elimina el producto
 * 
 * @param {string} filename -nombre de archivo a eliminar
 * @return {Boolean} - true si se elimino, false si hubo error 
*/

const deletefile = (filename) => {
    try {
        //construir ña ruta completa del archivo
        const filePath = path.join(uploadPath, filename);

        //Verficar si el archivp existe 
        if (fs.existsSync(filePath)) {
            //eliminar el archivo
            fs.unlinkSync(filePath);
            console.log(`Archivo eliminado: ${filePath}`);
            return true;
        }else {
            console.log(`Archivo no encontrado: ${filePath}`);
            return false;
        }
    }catch (error) {
        console.error(`Error al eliminar el archivo;`,error.message);
        return false;
    }
};

//Exportar configuracion del muter y funcion de eliminacion de archivos
module.exports = {
    upload,
    deletefile
};