/**
 * MODE PEDIDO
 * define la tabla Pedido en la base de datos
 * almacena los pedidos realizados por los usuarios
 */

//importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importae instancia de sequelize
const { sequelize } = require('../config/database');
const { type } = require('os');


 /**
  * Definir el modelo de Pedido
  */
const Pedido = sequelize.define('Pedido', {
    //Campos de la tabla
    //Id Identificador unico (PRYMARY KEY)
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },

    // UsuarioId ID del usuario que realiza el pedido
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', //No se puede eliminar el usuario con pedidos
        validate:{
            notNull: {
                msg: 'debe especificar usuario'
            }
        }
    },

    //Total monto total del pedido
    total: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El total debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El total no puede ser negativo'
            }
        }
    },

    /**
     * Estado - estado actual del pedido
     * valores posibles:
     * pendiente: pedido creado pero no pagado
     * pagado: pedido pagado pero no enviado
     * enviado: pedido enviado pero no entregado
     * cancelado: pedido cancelado
     */
    estado:{
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Enviado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [['pendiente', 'pagado', 'enviado', 'cancelado']],
            }
        }
    },

    // Direccion de envio del pedido
    direccionEnvio: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty:{
                msg: 'la Dirección del envio es obligatoria'
            }
        }
    },

    //telefono de contacto para el envio
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El telefono de contacto es obligatorio'
            }
        }
    },

    // notas adicionales del pedido (opcional)
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    //Fecha de pago
    fechaPago:{
        type: DataTypes.DATE,
        allowNull: true,
    },

      //Fecha de envio
    fechaEnvio:{
        type: DataTypes.DATE,
        allowNull: true,
    },

      //Fecha de Entrega
    fechaEntrega:{
        type: DataTypes.DATE,
        allowNull: true,
    },


}, {
    //Opciones del modelo
    tableName: 'pedidos',
    timestamps: true,
    //indices compuestos para optimizar busquedas
    indexes: [
        {
            //indice para buscar por usuario y producto
            fields: ['usuarioId',]
        },
        {
            //indice para buscar pedidos por estado
            fields: ['estado',]
        },
        {
            //indice para buscar pedidos por fecha de pago
            fields: ['createdAt',]
        }  
    ],

    /**
     * Hooks Acciones de automaticas
     */

    hooks:{
        /**
         * afterUpdate - se ejecuta antes de actulizar un pedido
         * actualiza las fechas segun el estado del pedido
         */


        afterUpdate: async (pedido) => {
            //si el estado cambio a pagado se guarda la fecha de pago
            if (pedido.changed('estado') && pedido.estado === 'pagado') {
                pedido.fechaPago = new Date();
                await pedido.save({hooks: false}); // Guarda sin ejecutar hooks para evitar bucles infinitos
            }
            // si el estado cambio a enviado se guarda la fecha de envio
                if (pedido.changed('estado') && pedido.estado === 'enviado' && !pedido.fechaEnvio) {
                    pedido.fechaEnvio = new Date();
                    await pedido.save({hooks: false}); // Guarda sin ejecutar hooks para evitar bucles infinitos
                }

            //si el estado cambio a entregado se guarda la fecha de entrega
            if (pedido.changed('estado') && pedido.estado === 'entregado') {
                pedido.fechaEntrega = new Date();
                await pedido.save({hooks: false}); // Guarda sin ejecutar hooks para evitar bucles infinitos
            }
            // si el estado cambio a enviado se guarda la fecha de envio
                if (pedido.changed('estado') && pedido.estado === 'enviado' && !pedido.fechaEnvio) {
                    pedido.fechaEnvio = new Date();
                    await pedido.save({hooks: false}); // Guarda sin ejecutar hooks para evitar bucles infinitos
                }
            },

            /**
             * beforeDestroy : se ejecuta antes de eliminar un pedidp
             */
            beforeDestroy: async (pedido) => {
                throw new Error('No se puede eliminar un pedido, solo se puede cancelar cambiando su estado a cancelado');
            }
        }
    });

//METODOS DE INSTANCIA
/**
 * Metodo para cambiar el estado del pedido
 * 
 * @param {string} nuevoEstado - nuevo estado del pedido
 * @returns {number} - Subtotal (precio * cantidad)
 */
Pedido.prototype.cambiarEstado = function(nuevoEstado) {
    const estadosValidos = ['pendiente', 'pagado',
    'enviado', 'cancelado'];
    if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error(`estado invalido`)
    }
    
    this.estado = nuevoEstado;
    return this.save();
};

/**
 * Metodo para verificar si el pedido se puede cancelado 
 * solo se puede cancelar un pedido si esta en estado pendiente o pagado
 * @returns {boolean} - true si se puede cancelar, false si no
 */

Pedido.prototype.puedeSerCancelar = function() {
    return ['pendiente', 'pagado'].includes(this.estado);

};


/** 
 * Metodo para cancelar pedido
 * @returns {Promise<Pedido>} - Pedido cancelado
*/
Pedido.prototype.cancelar = async function() {
    if (!this.puedeSerCancelar()) {
        throw new Error(`este pedido no puede ser cancelado`);
    }

    //importar modelo
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');

    //obtener detalles del pedido
    const detalles = await DetallePedido.findAll({
        where: {pedidoId: this.id}
    });

    //devolver stock de cada producto 
    for (const detalle of detalles) {
        const producto = await Producto.findByPk(detalle.productoId);
        if (producto) {
            await producto.aumentarStock(detalle.cantidad);
            console.log(`Stock devuelto:${detalle.cantidad} X ${producto.nombre}`);
        }
    }

    //cambiar estado a cancelado
    this.estado = 'cancelado';
    return await this.save();
};


/**
 * Metodo para obtener el detalle del pedido con productos
 * @returns {Promise<Array>} - detalle del pedido
 */

Pedido.prototype.obtenerDetalle = async function () {
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');

    return await DetallePedido.findAll({
        where: {pedidoId: this.id},
        include:[
            {
                model: Producto,
                as: 'producto',
            }
        ]
    });
};

/**
 * Metodo para obtener pedidos por estado
 * @param {string} estado - estado del a filtrar
 * @returns {Promise<Array>} - pedidos filtrados
 */
Pedido.obtenerPedidosPorEstado = async function (estado) {
    const Usuario = require('./Usuario');
    return await this.findAll({
        where: {estado},
        include: [
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'email', 'telefono']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Metodo para obtener historial de pedidos de un usuario
 * @param {number} usuarioId - Id del usuario
 * @return {Promise<Array>} - pedidos del usuario
 */
Pedido.obtenerHistorialusuario = async function (usuarioId) {
    return await this.findAll({
        where: {usuarioId},
        order: [['createdAt', 'DESC']]
    });
};

//Exportar el modelo
module.exports = Pedido;



