/** 
 * script de la inicializacion de base de datos
 * est script crea la base de datos si no existe
 * debe ejecutarla una sola vez para antes de iniciar el servidor
*/

//importar mysql2 pra la conexion directa
const mysql = require('mysql2/promise');

//impotar detenv para cargar las variables de entorno
require('dotenv').config();

//funcion para crear la base de datos
const createDatabase = async () => {
    let connection ;

    try{
        console.log('Intentando creacion de base de datos...    \n');

        //conectar mysqul sin especificar base de datos
        console.log('conectano a Mysql ... ');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_user || 'root',
            password: process.env.DB_PASSWORD || ''
        });  

        console.log(' conexion de MySQL estrablecida\n');

        //crear la base de datos si no existe
        const dbname = process.env.DB_NAME || 'ecommerce_db';
        console.log(`creando base de datos: ${dbname}... 
            `);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbname}\` CREADA/VERIFICADA EXISTOSAMENRENTE\n`);

        //CERRAR LA CONEXION
        await connection.end();

        console.log('¡Proceso completado! Ahor puedes iniciar el servidor con: npm start\n');
 
    }  catch (error) {
        console.error('Error al crear la base de datos:', error.message);
        console.error('1.XAPP esta corriendo');
        console.error('2.MySQL esta inciaando en XAPP');
        console.error('3.Las credenciales en el archivo .env son correctas');


        if (connection) {           
             await connection.end();

         }
         process.exit(1);

        }
};


//ejecutar la funcion
createDatabase();