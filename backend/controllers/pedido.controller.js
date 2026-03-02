/**
 * Controlador de pedidos
 * gestios de pedidos
 * requiere automatizacion
 */
//Importar modelos

const Pedido = require ('../models/Pedido');
const DetallePedido = require ('../models/DetallePedido');
const Carrito = require ('../models/Carrito');
const Producto = require ('../models/Producto');
const Usuario = require ('../models/Usuario');
const Categoria = require ('../models/Categoria');
const Subcategoria = require ('../models/Subcategoria');

/**
 * crear pedido desde el carrito (checkout)
 * POST/api/cliente/pedidos
 */

const crearPedido = async (req, res) => {
    const { sequelize} = require ('../config/database');
    const t = await sequelize.transaction();

    try {
        const { direccionEnvio, telefono, metodoPago = 'efectivo',notasAdicionales} = req.body;

        //Validacion 1: Direccion requerida
        if(!direccionEnvio || direccionEnvio.trim() === '') {
            await t.rollback();
            return res.status(400).json({
                succes: false,
                message: 'Se requiere dirrecion'
            });
        }

        //Validacion 2: telefono requerido
        if(!telefono || telefono.trim() === '') {
            await t.rollback();
            return res.status(400).json({
                succes: false,
                message: 'Se requiere telefono'
            });
        }

        //Validacion 3: motodos de pago
        const metodosValidos = [ 'efectivo', 'tarjeta', 'trasnferecia']
        if(!metodosValidos.includes(metodoPago)) {
            await t.rollback();
            return res.status(400).json({
                succes: false,
                message: `metodo de pago invalido, opciones: ${metodosValidos.join(',')}`
            });
        }

        //obtener items del carrito

        const carritoItems = await Carrito.findAll ({
            where:{ usuarioId: req.user.usuarioId},
            include:[{
                model:Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'activo']
            }],
            transaction :t
        });

        if (itemsCarrito.lenght === 0) {
            await t.rollback ();
            return res.status(400).json({
                succes: false,
                message:' El carrito esta vacio'
            })
        }


    } catch (error){
        console.error ('Error en crearPedido',error)
        return res.status(500).json({
            succes: false,
            message: 'Error al crear Pedido',
            error: error.message
        })
    }
}
