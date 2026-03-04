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
const { totalmem } = require('os');
const { parse } = require('path');
const { count } = require('console');

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

        // Verificar stock y productos activos
        const erroresValidacion = [];
        let totalPedido = 0;

        for (const item of itemsCarrito) {
            const producto = item.producto;

            // verificar que el producto este activo
            if(!producto.activo) {
                erroresValidacion.push(`${producto.nombre} ya no esta disponible`);
                continue;
            }

            //verificar stock suficiente
            if(item.cantidad > producto.stock) {
                erroresValidacion.push(
                    `${producto.nombre}: stock insuficiente (disponible: ${producto.stock}, solicitado: ${item.cantidad})`
                );
                continue;
            }

            //Caluclar total
            totalPedido += parseFloat(item.precioUnitario) * item.cantidad;
        }

        //Si hay errores de validacion retornar
        if(erroresValidacion.length > 0){
            await t.rollback();
            return res.status(400).json ({
                succes: false,
                message: 'Error en validacion de carrito',
                errores: erroresValidacion
            });
        }

        //crear pedido
        const pedido = await Pedido.create({
            usuarioId: req.user.usuarioId,
            total: totalPedido,
            estado: 'Pediente',
            direccionEnvio,
            telefono,
            metodoPago,
            notasAdicionales
        }, {transaction: t});

        //Crear  detalles del pedido y actualizar stock
        const detallesPedido = [];
        for (const item of itemsCarrito) {
            const producto = item.producto;

            //Crar detalle
            const detalle = await DetallePedido.create({
                pedidoId: pedido.id,
                productoID: producto.id,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subtotal: parseFloat(item.precioUnitario) * item.cantidad
            },{transaction: t});

            detallesPedido.push(detalle);

        //reducir stock del producto
        producto.stock -= item.cantidad;
        await producto.save ({transaction: t});
        }

        //vaciar carrito
        await Carrito.destroy({
            where : {usuarioId: req.usuario. id},
            transaction: t
        });

        //confirmar transaccion
        await t.commit();

        //cargar pedido con relaciones
        await pedido.reload({
            include:[
                {
                    model: Usuario,
                    as :'usuario',
                    attributes:['id', 'nombre', 'email']
                },
                {
                    model: DetallePedido,
                    as :'detalles',
                    include:[{
                        model: Producto,
                        as: ' producto',
                        attributes: [' id', 'nombre', 'precio','imagen']
                    }]
                }
            ]
        });

        //respuesta exitosa
        res.status(201).json ({
            succes:true,
            message: "Pedido creado existosa",
            data:{
                pedido
            }
        });


    } catch (error){
        //revetir transaccion en caso de error
        await t.rollback();
        console.error ('Error en crearPedido',error);
        res.status(500).json({
            succes: false,
            message: 'Error al crear Pedido',
            error: error.message
        });
    }
};

/**
 * Obtener pedido del cliente autenticado
 * GET/ap/cliente/pedidos
 * query:?estado=pediente&pagina=1&limite=10
 */

const getMisPedidos = async (req, res ) =>{
    try{
        const {estado, pagina = 1, limite=10} = req.query;

        //filtros
        const where ={usuarioId: req.usuario.id };
        if (estado) where.estado = estado;


        //paginacion
        const offset =(parseInt (pagina) - 1) * parseInt (limite);

        //consultar pedidos
        const { count, rows:pedidos} = await Pedido.findAndCountAll({
            where,
            include:[
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include:[{
                        model: Producto,
                        as :'producto',
                        attributes: [ 'id', 'nombre', 'imagen']
                    }]
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['createAt', 'DESC']]
        });

        //respuesta exitosa
        res.status(201).json({
            succes: true,
            data: {
                pedidos,
                paginacion:{
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count/parseInt(limite))
                }
            }
        });


    } catch (error){
        console.error ('Error en getMisPedidos', error);
        res.status(500).json({
            succes: false,
            message: 'Error al obtener los  pedido ',
            error: error.messagen
        });
    }
};

/**
 * Obtener un pedido especifico por id 
 * GET/api/cliente/pedidos:id
 * solo puede ver sus pedidos admin todos
 */

const getPedidoById = async (req, res) =>{
    try{
        const {id} = req.params;
        //construir filtros ( cliente solo ve sus pedido admin ve todos)
        const where ={id};
        if (req.usuario.rol !== 'administrador'){
            where.usuarioId= req.usuario.id;
        }

        //Buscar pedido
        const pedido = await Pedido.findOne({
            where,
            include:[
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: [' id',' nombre',' email']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include:[{
                        model: Producto,
                        as :'producto',
                        attributes: [ 'id', 'nombre','descripcion', 'imagen'],
                        include:[
                            {
                                model:Categoria,
                                as: 'categoria',
                                attributes: [ 'id','nombre']
                            },
                            {
                                model:Subcategoria,
                                as: 'subcategoria',
                                attributes: [ 'id','nombre']
                            },
                        ]
                    }]
                }
            ]
        });

        if(!pedido) {
            return res.status(404).json({
                succes: false,
                message: 'pedido no encontrado'
            });
        }

        //respuesta exitosa
        res.json({
            succes:true,
            data:{
                pedido,
            }
        })

    }catch (error){
        console.error('Error en getPedidoById:', error);
        res.status(500).json({
            succes:false,
            message:'Pedido no encontrado',
            error: error.message
        });
    }
};

/**
 * cancelar pedido
 * Put/api/cliente/pedidos/:id/cliente
 * solo se puede cancelar si el estado es pendiente
 * devuelve el stock a los productos
 */

const cancelarPedido = async (req,res) =>{
    const {sequelize} = require('../config/database');
    const t = await sequelize.transaction();
    
    try{
        const {id} = req.params;

        //buscar el pedido solo los prodpios pedidos
        const pedido = await Pedido.findOne({
            where:{
                id,
                usuarioId: req.usuario.id
            },
            include:[{
                model:DetallePedido,
                as: 'detalles',
                include:[{
                    model:Producto,
                    as: ' pedido',   
                }]
            }],
            transaction: t
        });

        if(!pedido){
            await t.rollback();
            return res.status(404).json({
                succes:false,
                message:'Pedido no encontrado'
            });
        }

        // solo se puede cancelar si esta en pendiente
        if(pedido.estado !== 'pendiente'){
            await t.rollback();
            return res.status(404).json({
                succes: false,
                message: `NO se puede cancelar un pedido en estado '${pedido.estado}'`
            });
        }

        // devolver stock de los productos
        for(const detalle of pedido.detalle){
            const producto = detalle.producto;
            producto.stock += detalle.cantidad;
            await producto.save({transaction: t})
        }


        //actualizar estado del pedido
        pedido.estado = 'cancelado';
        await pedido.save({transaction: t});

        await t.commit();

        //respuesta exitosa
        res.status(201).json({
            succes:true,
            message: 'Pedido cancelado existosamente',
            data:{
                pedido
            }
        });


    }catch(error){
        await t.rollback();
        console.error('Error en cancelarPedido:', error);
        res.status(500).json({
            succes: false,
            message: ' Error al cancelar el pedido',
            error: error.message
        });
    }
};

/**
 * adim obtener todos los pedidos
 * get/api//admin/pedidos
 * query ?estado=pendiente&usuarioId=1&pagina=1&limite=10 
 */
const getAllPedidos = async (req, res) =>{
    try{
        const {estado,usuarioId, pagina = 1, limite = 20} = req.query;

        //filtro
        const where = {};
        if (estado) where.estado = estado;
        if (usuarioId) where.usuarioId = usuarioId;

        //paginacion
        const offset = (parseInt(pagina) - 1)* parseInt (limite);

        //Consultar pedidos
        const {count, rows: pedidos} = await Pedido.findAndCountAll({
            where,
            include: [
                {
                model:Usuario,
                as: 'usuario',
                attributes: [ 'id', 'nombre', 'email']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'imagen']
                    }]
                }
            ],
            limit: parseInt(limite),
            offset,
            order : [['createdAt', 'DESC']]
        });

        // respuesta exitosa
        res.status(201).json({
            succes: true,
            data:{
                pedidos,
                paginacion:{
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count/parseInt(limite),)
                }
            },
        });

    }catch(error){
        console.error ('Error en getAllPedidos:', error);
        res.status(500).json({
            succes: false,
            message: "Error al obtener pedidos",
            error: error.message
        })
    }
}

/**
 * Adminactualizar estado del pedido
 * PUT/api/admin/pedidos/:id/estado
 * body:{estado}
 */

const actualizarEstadoPedido = async (req, res) =>{
    try{
        const {id} = req.params;
        const {estado} = req.body;

        //validar estado 
        const estadosValidos = ['pendiente', 'enviado',
        'entregado', 'cancelado'
        ];
        if(!estadosValidos.includes(estado)){
            return res.status(400).json({
                succes: false,
                message: `estado invalido, opciones: ${estadosValidos.json(',')}`
            });
        }

        //buscar pedido
        const pedido = await Pedido.findByPk(id);
        if(!pedido){
            return res.status(404).json({
                succes: false,
                message: ' pedido no encontrado'
            });
        }

        //actualiazar estados
        pedido.estado = estado;
        await pedido.save();

        // recargar con relciones
        await pedido.reload({
            include:[
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                }
            ]
        });

        // Respuesta exitosa
        res.status(201).json({
            succes: true,
            message: 'Estado del pedido actualizado',
            data:{
                pedido
            }
        });


    } catch (error){
        console.error('Error en actualizarEstadoPedido:', error);
        res.status(500).json({
            succes: false,
            message: 'Error al actualizar el estado del pedido',
            error: message.error
        });
    }
};

/**
 * Obtener estadisticae de pedidos
 * GET/api/admin/pedidos/estadisticas
 */

const getEstadisticasPedidos = async (req, res) =>{
    try{
        const { Op, fn, col} = require ('sequelize');

        //Total de pedidos
        const totalPedidos = await Pedido.count();

        //pedido estado
        const pedidosPorEstado = await Pedido.findAll({
            attributes:[ 
                'estado',
                [fn('COUNT', col('id')), ' cantidad'],
                [fn('SUM', col('total')), ' totalVentas'],
            ],
            group:['estado']
        });

        //total de ventas
        const totalVentas = await Pedido.sum('total');

        //pedido hoy
        const  hoy = new Date();
        hoy.setHours(0,0,0,0);

        const pedidosHoy = await Pedido.count ({
            where:{
                createdAt: { [Op.gte]: hoy} // pedidos de los ultimos 7 dias
            }
        });

        // respuesta exitosa
        res.status(201).json({
            succes: true,
            message: 'Estadisticas obtenidas exitosamente',
            data:{
                totalpedido,
                pedidosHoy,
                ventasTotales: parseFloat(totalVentas || 0).toFixed(2),
                pedidosPorEstado: pedidosPorEstado.map(p => ({
                    estado: p.estado,
                    cantidad: parseInt(p.getDataValue ('cantidad')),
                    totalVentas: parseFloat(p.getDataValue('totalVentas') ||  0 ). toFixed(2)
                }))
            }
        });
    }catch(error){
        console.error('Error en getEstadisticasPedido:',error);
        res.status(500).json({
            succes:false,
            message: 'Error al obtener las estadisticas ',
            error:message.error
        });
    }
}

//Exportar controladore
module.exports = {
    //cliente
    crearPedido,
    getMisPedidos,
    getPedidoById,
    cancelarPedido,

    //admid
    getAllPedidos,
    actualizarEstadoPedido,
    getEstadisticasPedidos
};