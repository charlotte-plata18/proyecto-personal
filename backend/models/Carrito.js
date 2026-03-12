/**
 * MODE CAREGORIA
 * define la tabla Carrito en la base de datos
 * almacena los productos que cada usuario ha agregado a su carrito
 */

//importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importae instancia de sequelize
const { sequelize } = require('../config/database');
const { table } = require('console');

 /**
  * Definir el modelo de la Carrito
  */
const Carrito = sequelize.define('Carrito', {
    //Campos de la tabla
    //Id Identificador unico (PRYMARY KEY)
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },

    // UsuarioId ID del usuario dueño del carrito
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', //si se elimina el usuario se elimina su carrito
        validate:{
            notNull: {
                msg: 'debe especificar usuario'
            }
        }
    },

    // ProductoId ID del producto que se agrega al carrito
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // se elimina el producto se elimina del carrito
        validate:{
            notNull: {
                msg: 'Debe especificar producto'
            }
        }
    },

    // Cantidad del producto en el carrito
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        delfaultvalue: 1,
        validate:{
            isInt: {
                msg: 'La cantidad debe ser un numero entero'
            },
            min: {
                args: [1],
                msg: 'La cantidad debe ser al menos 1'
            }
        }
    },


    /**
     * Precio Unitario del producto al monento de agregar al carrito
     * se guarda para mantener el precio aunque el producto cambie de precio
     */
    precioUnitario: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate :{
            isDecimal: {
                msg: 'El precio unitario debe ser un numero decimal valido'
            },
            min:{
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }
    }
}, {
    //Opciones del modelo
    tableName: 'carritos',
    timestamps: true,
    //indices compuestos para optimizar busquedas
    indexes: [
        {
            //indice para buscar por usuario y producto
            fields: ['usuarioId',]
        },
        {
            //Indice compuesto: un usuario no puede tener el mismo producto
            //duplicado
            unique: true,
            fields: ['usuarioId', 'productoId'],
            name: 'usuario_producto_unico'
        }
        
    ],

    /**
     * Hooks Acciones de automaticas
     */

    hooks:{
        /**
         * beforeCreate - se ejecuta antes de crear una subcategoria
         * valida qu este activo
         */
        beforeCreate: async (itemCarrito) =>{
            const Producto = require ('./Producto');

            // Buscar producto
            const producto = await Producto.findByPk (itemCarrito.productoId);

            if (!producto) {
                throw  new Error ( 'El producto  no existe');
            }
            if (!producto.activo) {
                throw new Error ('No se puede crear un item de carrito para un producto inactivo')
            }
            if (!producto.haystock (itemCarrito.cantidad)) {
                throw new Error (`Stock insuficiente, solo hay ${producto.stock} unidades disponibles`)
            }

            // Guardar el precio actual del producto

            itemCarrito.precioUnitario = producto.precio;
        },

        /**
         * BeforeUpdate - se ejecuta antes de actulizar un caarito
         * valida que haya stock suficiente si se aumenta la cantidad
         */


        beforeUpdate: async (itemCarrito) => {

            if (itemCarrito.changed('cantidad')) {
                const Producto = require('./Producto');
                const producto = await Producto.findByPk
                (itemCarrito.productoId);
                if (!producto) {
                    throw new Error('El producto no existe');
                }

                if (!producto.haystock (itemCarrito.cantidad)) {
                    throw new Error (`Stock insuficiente, 
                    solo hay ${producto.stock} unidades
                    disponibles`);
                }
            }
        }
    }
});

//METODOS DE INSTANCIA
/**
 * Metodo para calcular el subtotal de este item
 * 
 * @returns {number} - subtotal (precio * cantidad)
 */
Carrito.prototype.calcularSubtotal = function() {
    return parseFloat(this.precioUnitario) * this.cantidad;

};

/** 
 * Metodo para actualizar la cantidad
 * @param {number} nuevaCantidad -  nueva cantidad 
 * @return {Promise} Item actualizado* 
*/
Carrito.prototype.actualizarCatidad = async function (nuevaCantidad) {
    const Producto = require('./Producto');

    const producto = await Producto.findByPk(this.productoId);

    if(!producto.haystock(nuevaCantidad)) {
        throw new Error(`Stock insuficiente, solo hay ${producto.stock} unidades disponibles`);
    }

    this.cantidad = nuevaCantidad;
    return await this.save();

};

/**
 * Metodo para obtener el carrito completo de un usuario
 * incluye informacion de los producto
 * @param {number} usuarioId - Id del usuario
 * @returns {Promise<Array>} - Items del carrito con productos
 */

Carrito.obtenerCarritoUsuario = async function (usuarioId) {
    const Producto = require('./Producto');

    return await this.findByPk({
        where: {usuarioId},
        include:[
            {
                model: Producto,
                as: 'producto',
            }
        ],
        orden: [['createdAt', 'DESC']]
    });
};

/**
 * Metodo para calcular el total del carrito de un usuario
 * @param {number} usuarioId - Id del usuario
 * @returns {Promise<number>} - Total del carrito
 */
Carrito.calcularTotalCarrito = async function (usuarioId) {
    const Items = await this.findAll({
        where: {usuarioId}
    });

    let total = 0;
    for (const item of Items) {
        total += item.calcularSubtotal();
    }
    return total;
};

/**
 * Metodo para vaciar el carrito del usuario
 * util despues de realizar un pedido *
 * @param {number} usuarioId - Id del usuario
 * @return {Promise<number>} - numero de items eliminados
 */
Carrito.vaciarCarrito = async function (usuarioId) {
    return await this.destroy({
        where: {usuarioId}
    });
};

//Exportar el modelo
module.exports = Carrito;



