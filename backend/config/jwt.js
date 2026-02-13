/**
 * configuracion de jwt
 * Este archivo contiene funciones para generar y verificar tokens JWT
 * los JWT se usa para autenticar usarios sin neesidad de sesiones
 */

//importar jsonwebtoken para manejar los token
const { error } = require('console');
const jwt = require('jsonwebtoken');

//Importar dotenv para accerder aa las variablees de entorno
require('dotenv').config();

/** 
 * Generar un token JWT para un usuario
 * 
 * @param {Object} payload - Datos que se incluira en el token (id, email, rol)
 * @returns {string} - Token generado
 */

const generateToken = (payload) => {
    try {
        //jwt.sing() crea y firma un token
        //Parametros:
        //1. payload: datos a incluir en token 
        //2. secret: clave secreta para firmar (desde .env)
        //3. options: opciones adicionales como tiempo de expiracion
        const token = jwt.sign(
            payload, //datos de usuario
            process.env.JWT_SECRET, //clave secreta desde .env
            { expiresIn: process.env.JWT_EXPIRES_IN  } //tiempo de expiracion

        );
        return token;
    } catch (error) {
        console.error('Error al generar el token JWT:', error.message);
        throw new Error('Error al generar el token de atutenticación');
    }
};

/**
 * Verificar si un token es valido 
 * 
 * @param {string} token - Token JWt a verificar 
 * @returns {Object} - daros decodificacion del token si es valido
 * @throws {Error} - si el token es no es invalido o ha expirado
 */

const verifyToken = (token) => {
    try {
        //jwt,verify() verifica la firma del token y lo decodifica
        //Parametros:
        //1. token: token JWt a verificar
        //2. secret: la misma clave secreta usada para firmalo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;

    } catch (error) {
        //Diferentes tipos de errores 
        if (error.name === 'TokenExpiredError') {
            throw new Error ('token ha expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token inválido');
        } else {
            throw new Error('Error al verificar el token');
        }
    }
};

/**
 * extraer el tokenel token del header de Authonization
 * el token viene en forma de "Bearer <token>"
 * 
 * @param {string} authHeader - Header Authonization de la peticion
 * @return {string|null} - El token extraido o null si no existe 
 */

const extractToken = (authHeader) => {
    //verificar que el header exitente y empieza con "Bearer "
    if (authHeader && authHeader.startsWhith('Bearer ')) {
        //Extraer el token (quitar "Bearer ")
        return authHeader.substring(7);

    }

    return null; //no se encuentra token valido
};

//Exportar las funciones para usarlas en otros archivos
module.exports = {
    generateToken,
    verifyToken,
    extractToken,
};
