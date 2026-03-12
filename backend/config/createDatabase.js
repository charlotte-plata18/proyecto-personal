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

    try{ // guarda todas la funciones 
        console.log('Intentando creacion de base de datos...    \n');

        //conectar mysqul sin especificar base de datos
        console.log('conectano a Mysql ... ');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306, //puerto mysql
            user: process.env.DB_user || 'root', // usuario
            password: process.env.DB_PASSWORD || '' // contraseña
        });  // variables de entorno

        console.log(' conexion de MySQL estrablecida\n');

        //crear la base de datos si no existe
        const dbname = process.env.DB_NAME || 'ecommerce_db'; // obtiene el nombre de la base de datos y si no exite la crea 
        console.log(`creando base de datos: ${dbname}... 
            `); // manda mensaje de que crea la base de datos
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbname}\`;`);

        //CERRAR LA CONEXION
        await connection.end(); // aqui termina de crear la base de datos, entoces cierra la conexion

        console.log('¡Proceso completado! Ahor puedes iniciar el servidor con: npm start\n'); // manda mensaje despues de crear la
        // base de datos manda mensaje a la terminar de que lo creo exitosamener
 
    }  catch (error) { // posibles errores
        console.error('Error al crear la base de datos:', error.message);
        console.error('1.XAPP esta corriendo');
        console.error('2.MySQL esta inciaando en XAPP');
        console.error('3.Las credenciales en el archivo .env son correctas');


        if (connection) {           
             await connection.end(); // cierra la conexion si queda abierta despues de hubiera un error

         }
         process.exit(1);

        }
};


//ejecutar la funcion
createDatabase();