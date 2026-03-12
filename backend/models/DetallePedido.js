/**
 * MODE DETALLE PEDIDO
 * define la tabla Detalle Pedido en la base de datos
 * Almacena los productos incluidos en cada pedido
 * relación muchos a muchos entre pedidos y productos
 */
 
//importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importae instancia de sequelize
const { sequelize } = require('../config/database');


 /**
  * Definir el modelo detalle pedido
  */
const DetallePedido = sequelize.define('DetallePedido', {
    //Campos de la tabla
    //Id Identificador unico (PRYMARY KEY)
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },

    // PedidoId ID del pedido al que pertenece el detalle del pedido
    pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Pedidos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', //si se elimina el pedido se eliminan los detalles asociados
        validate:{
            notEmpay:{
                msg: 'Debe especificar el ID del pedido del detalle del pedido'
            }
        }
    },

    // ProductoId ID del producto que se agrega al detalle del pedido
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', //si se elimina el producto no se puede eliminar el detalle
        validate:{
            notEmpty: {
                msg: 'debe especificar UN Producto'
            }
        }
    },

    // Cantidad del producto en el detalle del pedido
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    },
    /**
     * Subtotal calculado como precioUnitario * cantidad
     * se calcula automaticamente antes de guardar 
     */
    subtotal: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate:{
            isDecimal: {
                msg: 'El subtotal debe ser un numero decimal valido'
        },
        min: {
            args: [0],
            msg: 'El subtotal no puede ser negativo'
        }
    }
}, 
    //Opciones del modelo
    tableName: 'detalle_pedidos',
    timestamps: false, // No necesitamos createdAt ni updatedAt para el detalle del pedido

    //indices para mejorar ls busquedas
    indexes: [
        {
            //indice para buscar por detalle por pedido
             fields: ['pedidoId',]
        },
        {
            //indice para buscar por detalle por producto
            fields: ['productoId',]
        }, 
    ],



    /**
     * Hooks Acciones automaticas
     */
    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear un detalle de pedido
         * calcula el subtotal automaticamente 
         */
        beforeCreate:(detalle) =>{
            //calcular subtotal precio * cantidad
            detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
        },

        /**
         * BeforeUpdate - se ejecuta antes de actulizar detalle de pedido
         * recalcular el subtotal si cambia la cantidad o el precio unitario
         */


        beforeupdate: (detalle) => {

            if (detalle.changed('precioUnitario') ||
            detalle.changed('cantidad')) {
                detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
            }
        }
    }
});

//METODOS DE INSTANCIA
/**
 * Metodo para calcular el subtotal 
 * 
 * @returns {number} - subtotal cantidad
 */
DetallePedido.prototype.calcularSubtotal = function() {
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
 * Metodo para crear deetalle del pedido desde el carrito
 * convierte los items del carrito en detalles de pedido
 * @param {number} pedidoId - Id del pedido
 * @param {Array} itemsCarrito - Items del carrito
 * @return {Promise<Array>} - detalles de pedido creados
 */
DetallePedido.crearDesdeCarrito = async function (pedidoId, itemsCarrito) {
    const detallesCreados = [];
    for (const item of itemsCarrito) {
        const detalle = await this.create({
            pedidoId: pedidoId,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario
        });
        detallesCreados.push(detalle);
    }
    return detallesCreados;
};
/**
 * Metodo para calcular el total del pedido a partir de los detalles del pedido, este método toma un array de detalles de pedido como argumento, calcula el subtotal de cada detalle de pedido utilizando el método calcularSubtotal() y luego suma todos los subtotales para obtener el total del pedido, esto permite obtener el monto total que el usuario tendría que pagar por su pedido en función de los detalles del pedido asociados a ese pedido.
 * @param {number} pedidoId - El ID del pedido para el cual se desea calcular el total del pedido
 * @returns {promise<number>} El total del pedido calculado a partir de los detalles del pedido asociados al ID del pedido proporcionado, o un error si no se encuentra ningún detalle de pedido para el ID de pedido proporcionado.
 */
DetallePedido.calcularTotalPedido = async function (pedidoId) {
  const detalles = await this.findAll({ where: { pedidoId } });

  let total = 0;
  for (const detalle of detalles) {
    total += parseFloat(detalle.Subtotal()); //Suma el subtotal de cada detalle al total
  }
  return total;
};


/**
 * Metodo para obtener el ressumen de productos mas vendidos, este método consulta la base de datos para obtener un resumen de los productos más vendidos, incluyendo el ID del producto, el nombre del producto y la cantidad total vendida, esto permite obtener información valiosa sobre los productos más populares entre los usuarios y tomar decisiones informadas sobre el inventario y las estrategias de marketing.
 * @param {number} limit - El número máximo de productos más vendidos que se desea obtener en el resumen, este parámetro permite limitar la cantidad de productos que se incluyen en el resumen para enfocarse en los productos más populares.
 * @return {Promise<Array>} Un array de objetos que representan los productos más vendidos, cada objeto incluye el ID del producto, el nombre del producto y la cantidad total vendida, o un error si no se encuentra ningún detalle de pedido para calcular el resumen de productos más vendidos.
 */
DetallePedido.obtenerProductosMasVendidos = async function (limit = 10) {
  const {sequelize } = require("../config/database");
  return await this.findAll({
    attributes: [
        "productoId",
        [sequelize.fn("SUM", sequelize.col("cantidad")), "totalVendido"]
    ],
    group: ["productoId"],
    order: [[sequelize.fn("SUM", sequelize.fn("cantidad")), "DESC"]],
    limit: limite 
  });
};



//Exportar el modelo de carrito para ser utilizado en otras partes de la aplicación
module.exports = DetallePedido;