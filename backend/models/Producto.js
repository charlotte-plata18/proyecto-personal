/**
 * MODE PRODUCTO
 * define la tabla producto en la base de datos
 * almacena los productos de cada subcategoria
 */

//importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importae instancia de sequelize
const { sequelize } = require('../config/database');
const { table, error } = require('console');
const { type } = require('os');
const Categoria = require('./Categoria');

 /**
  * Definir el modelo de la producto
  */
const Producto = sequelize.define('Producto', {
    //Campos de la tabla
    //Id Identificador unico (PRYMARY KEY)
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        uautoIncrement: true, 
        allowNull: false 
    },

    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate:{
            notEmpty: {
                msg: 'El nombre del producto no puede estar vacio  '
        },
        len: {
            args: [2, 200],
            msg:' El nombre debe tener estre 2 y 200 caracteres'
        },
                
        }
    },

    /**
     * Descripcion detallada del productp
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    //Precio del producto
    precio:{
        type: DataTypes.DECIMAL(10,2), //hasta 99.999,999.99
        allowNull: false,
        validate:{
            isDecimal: {
                msg: 'El precio debe ser un numero decimal valido'
            },
            min: {
                args:[0],
                msg:'El precio no puede ser negativo',
            },
        },
    },

    //Stock del producto cantidad disponible en inventario
     stock:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate:{
            isInt: {
                msg: 'El stock debe ser un numero entero valido'
            },
            min: {
                args:[0],
                msg:'El stock no puede ser negativo',
            },
        },
    },

    /**
     * imagen Nombre del archivo 
     * se guarda solo el nombre ejemplo; coca-cola-producto.jpg
     * la ruta seria uploads/productos/coca-cola-producto.jpg
     */

    Imagen:{
        type: DataTypes.STRING(255),
        allowNull: true, // la imagen puede ser opcional
        validate: {
            is: {
                args: /\.(jpg|jpeg|png|gif)$/i,
                msg: 'El archivo de imagen debe ser un archivo JPG,JPEG,PNG O GIF'
            },
        },
    },

    /**
     * categoriaId - ID de la categoria a la que pertenece (FOREIGNKEY)
     * Esta es la relacion con la tabla categoria
     */
    subcategoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'subcategorias', // nombr de la tabla relacionada
            Key: 'id' // campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', // Si se actualiza el id, actualizar aca 
        // tambien
        onDelete: 'CASCADE',// si se elimina la categoria eliminar de   
        // las subcategoria
        validate: {
            notNull: {
                msg: 'Debe selecionar una categoria'
            }
        }
    },

    /**
     * activo estado de la subcategoria
     * si es false los productos de esta subcategoria se ocultan
     */
    activo:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    //Opciones del modelo
    
    tableName: 'Productos',
    timestamps: true, // Agrega campos createdAt y updatedAt

    /** 
     * indice compuestos para optimizar busquedas
     */
    indexes: [
        {
            // indice para buscar productos por subcategoria
            fields: [ 'subcategoriaId']
        },
                {
            // indice para buscar productos por categoria
            fields: [ 'categoriaId']
        },
        {
            // Indice para buscar productos activos
            fields : ['activo']
        },
        {
            // Indice para buscar productos nombre
            fields : ['nombre']
        },
    ],

    /**
     * Hooks Acciones de automaticas
     */

    hooks:{
        /**
         * beforeCreate - se ejecuta antes de crear una producto
         * valida que la subcategoria y que la categoria padre esten activas

         */
        beforeCreate: async (producto) =>{
            const Categoria = require ('./Categoria');
            const Subcategoria = require ('./Subcategoria');

            // Buscar subcategoria padre
            const subcategoria = await Subcategoria.findByPk (producto.subcategoriaId);

            if (!subcategoria) {
                throw  new Error ( 'La subcategoria seleccionada no existe');
            }

            if (!subcategoria.activo) {
                throw new Error ('No se puede crear una producto en una subcategoria inactiva')
            }

         // Buscar categoria padre
            const categoria = await Categoria.findByPk (producto.categoriaId);

            if (!categoria) {
                throw  new Error ( 'La categoria seleccionada noo existe');
            }

            if (!categoria.activo) {
                throw new Error ('No se puede crear una producto  en una categoria inactiva')
            }


        //validar que la sudcategoria pertenezca a una categoria
            if (subcategoria.categoriaId !== producto.categoriaId) {
            throw new Error("La subcategoria no pertenece a la categoria seleccionada");
            }
            
        },

        /**
         * beforeDestroy se ejecuta antes de eliminar 
         * un producto
         * Eliminar la imagen del servidor si existe
         */
        beforeDestroy: async (producto) => {
            if (producto.imagen) {
                const{deletefile} =require('../config/multer');
                //intenta eliminar la imagen del servidor
                const eliminado= await deletefile (producto.imagen);
                if (eliminado) {
                    console.log(`Imagen eliminada: 
                    ${producto.imagen}`);
                    
                }
            }
        }

    }
});

//METODOS DE INSTANCIA
/**Metodos instacia para obtener la url completa de la imagen del producto
 * 
 * @returns {string|null} - numero de productos
 */
Producto.prototype.contarproductos = function() {
    if (this.imagen){ 
         return null;
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${this.imagen}`;
};

/**
 * metodo para verificar si hay stock disponible
 * 
 * @param {number} cantidad - cantidad solicitada
 * @returns {boolean} - true si hay stock suficiente, false si no
 */

Producto.prototype.hayStock = function (cantidad = 3) {
    return this.stock >= cantidad;

};

/**
 * Metodo para reducir el stock
 * util para despues de la venta
 * @param {number} cantidad - cantidad a reducir
 * @returns {Promise<void>}
 */
Producto.prototype.reducirStock = async function (cantidad) {
    if(this.hayStock(cantidad)){
        throw new Error('Stock insuficiente');
    }
    this.stock -= cantidad;
    return await this.save();
};

/**
 * Metodo para aumentar el stock
 * util al cancelar una venta o recibir un inventario
 * @param {number} cantidad - cantidad a aumentar
 * @return {Promise<Producto>} - producto actualizado
 */
Producto.prototype.aumentarStock = async function (cantidad) {
    this.stock += cantidad;
    return await this.save();
};

 
// exportar modelo Producto
module.exports = Producto;
