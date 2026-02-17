/**
 * MODE USUARIO
 * define la tabla Usuario en la base de datos
 * almacena los usuarios del sistema
 */

//importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar bcrypt para encriptar contraseñas
const bcrypt = require('bcrypt');

//importae instancia de sequelize
const { sequelize } = require('../config/database');
const { before } = require('node:test');


 /**
  * Definir el modelo usuario
  */
const Usuario = sequelize.define('Usuario', {
    //Campos de la tabla
    //Id Identificador unico (PRYMARY KEY)
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        uautoIncrement: true, 
        allowNull: false 
    },

    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre no puede estar vacio  '
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
                
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'El email ya esta registrado'
        },
        validate: {
            isEmail: {
                msg: 'Debe ser un email valido'
            },
            notEmpty: {
                msg: 'El email no puede estar vacio'
            }
                
        }
    },
    password: {
        type: DataTypes.STRING(255), // cadena larga para  hast
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La contraseña no puede estar vacia'
            },
            len: {
                args: [6, 255],
                msg: 'La contraseña debe tener al menos 6 caracteres'
            }
                
        }
    },

    //Rol del usuario (cliente, auxiliar, admin)
    rol: {
        type: DataTypes.ENUM('cliente', 'auxiliar', 
            'administrador'), // tres roles disponibles
        allowNull: false,
        defaultValue: 'cliente', // por defecto es cliente
        validate: {
            isIn: {
                args: [['cliente', 'auxiliar', 'administrador']],
                msg: 'El rol debe ser cliente, auxiliar o administrador'
            },   
        }
    },

    //Telefono del usuario es opcional
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true, //es opcional
        validate: {
            is: {
                args: /^[0-9+\-\s()*$]/, // Solo numeros, espacios, guiones y parentesis
                msg: 'El teléfono solo puede contener numeros y caracteres validos'
            }   
        }
    },

    /**
     * Direccion del usuario es opcional
     */
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },


    /**
     * activo estado del usuario
     */
    activo:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // por defecto esta activo
    }
}, {
    //Opciones del modelo
    
    tableName: 'usuarios', // nombre de la tabla en la base de datos
    timestamps: true, // Agrega campos createdAt y updatedAt

    /**
     * Scopes consultas preferidas
     */

    defaultScope: {
        /**
         * por defecto excluir el password de tosas las consultas
         */
        attributes: { exclude: ['password'] }
    },
    scopes: {
        //scope para incluir el password cuanso sea necesario (ejemplo en login)
        withPassword: {
            attributes: { } //incluir todos los atributos
        }
    },

    /**
     * hooks funcines que se ejecutan en momentos es pecificos
     */
    hooks:{
        /**
         * beforeCreate se ejecuta antes de crear un nuevo usuario
         * Encripta la contraseña antes de guardarla en la base de datos
         */
        beforeCreate: async (usuario) => {
            if (usuario.password) {
                //generar un salt (semilla aleatoria) con factor de costo 10
                const salt = await bcrypt.genSalt(10);
                //encriptar la contraseña con el salt
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        },
/**
 * beforeUpdate se ejecuta antes de actualizar un usuario existente
 * Encripta la contraseña si se ha modificado
 */

        beforeUpdate: async (usuario) => {
            //Verificar si el password ha sido modificado
            if (usuario.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        }
    }
});

//METODOS DE INSTANCIA
/**Metodos para contar contraseñas
 * compara la contraseña en texto plano con el hash guardado
 * @param {string} passwordIngresado contraseña em texto plano
 * @returns {Promise<boolean>} - true si las contraseñas coinciden, false en caso contrario
 */
Usuario.prototype.compararPassword = async function(passwordIngresado) {
    return await bcrypt.compare (passwordIngresado, this.password);
};

/**Metodos para obtener datos publicos del usuario (sin contraseña)
 * 
 * @returns {Object} - Objestos con datos publicos del usuario
 */
Usuario.prototype.toJSON = function() {
    const valores = Object.assign({},this.get())

    //Elimiar la contraseña del objeto
    delete valores.password;
    return valores;

};

// exportar modelo Usuario
module.exports = Usuario
