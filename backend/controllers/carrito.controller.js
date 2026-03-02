/**
 * controlador de carrito de compras 
 * Gestion de carrito
 * require autenticacion 
 */

//importar modelos
const Carrito= require ('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Subcategoria = require('../models/Subcategoria');

/**
 * obteber carrito de usuario autenticando
 * GET / api /carrito
 * @param {Object} req request de express
 *@param {Object} res response de express
 usuario del  middleware
 *@param {Object} next funcion de express
 */

 const getCarrito = async (req, res) => {
        try{
            //obtener items del carrito de los productos relacionados
            const itemsCarrito = await Carrito.findAll({ 
                where: { usuario: req.usuario._id },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['Id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
                    include: [
                        {
                            model: Categoria,
                            as: 'categoria',
                            attributes:[ 'id', 'nombre']
                        },
                        {
                            model: Subcategoria,
                            as: 'subcategoria',
                            attributes: ['id', 'nombre']

                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        //calcular total del carrito
        let totalCarrito = 0;
        itemsCarrito.forEach(item => {
            totalCarrito += item.cantidad * item.producto.precio;
        });

        //respuesta exitosa
        req.json ({
            succes: true,
            data: {
                items : itemsCarrito,
                resume: {
                    totalItems:itemsCarrito.length,
                    cantidadtotal: itemsCarrito.reduce
                    ((sum, item) => sum + item.cantidad, 0),
                    totalCarrito: totalCarrito.toFixed
                }
            }
        });   
    } catch (error) {
        console.error ('Error en getCarrito', error);
        res.status(500).json({
            succes: false,
            message: 'Error al obtener carrito',
            error: error.message
        })
    }
};

/**
 * Agregar producto a carrito
 * POST/ api /carrito
 * 
 * @param {Object} req request de express
 * @param {Onject} res respose de express
 */

const agregarAlCarrito = async (req, res) =>{
    try{
        const {productoId, cantidad=1} = req.body;

        //Validacion 1: campos requeridos
        if(!productoId) {
            return res.status(400).json({
                succes:false,
                message: 'El productoId es requerido'
            });
        }

        // Validacion 2: Cantidad validad
        const cantidadNum = parseInt (cantidad);
        if (cantidadNum < 1) {
            return res.status (400).json({
                succes: false,
                message: 'La cantidad debe ser menos 1'
            });
        }

        //Validacion3: Producto ecistente y esta activo
        const producto = await Producto.findByPk (productoId);

        if(!producto) {
            return res.status(404).json({
                succes:false,
                message: 'Producto no encontrado'
            });
        }

        if (!producto.activo) {
            return res.status(400).json({
                succes:false,
                message: 'El producto no est disponible'
            });
        }

        //Validacion 4: Varificar si ya existe el prodcuto en el carrito
        const itemExistente = await Carrito.findOne({
            where:{
                usuarioId: res.usuario.id,
                productoId,
            }
        });

        if(itemExistente){
            //Actualizar cantidad
            const nuevaCantidad = itemExistente.cantidad + cantidadNum;

            // Validar stock disponible
            if (nuevaCantidad > producto.stock) {
                return res.status(400).json ({
                    succes: false,
                    message: `Stock insuficiente disponible: ${producto.stock}, en carrito: ${itemExistente.cantidad}`
                })
            }

            itemExistente.cantidad = nuevaCantidad;
            await itemExistente.save();

            //Recargar producto 
            await itemExistente.relod({
                include:[{
                    model: Producto,
                    as: 'producto',
                    attributes:['id', 'nombre', 'precio', 'stock', 'imagen']
                }]
            });

            return res.json ({
                succes: true,
                message:` Cantidad actualizada en el carrito`,
                data: { 
                    item: itemExistente}
            });

        }

        // validacion 5: stock disponible
        if (cantidadNum > producto.stock) {
            return res.status(400).json({
                succes: false,
                message: `Stock insuficiente, Disponiblr ${producto.stock}`
            });
        }

        //crear un nuevo item en el carrito
        const nuevoItem = await Carrito.create({
            usuarioId: res.usuario.id,
            productoId,
            cantidad: cantidadNum,
            precioUnitario: producto.precio
        });

        // recargar con producto
        await nuevoItem.reload({
            include: [{
             model: Producto,
                as :'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']

            }]
        });

        // respuesta exitosa
        res.status(201).json({
            succes: true,
            message: 'Producto agreado al carrito',
            data: {
                item: nuevoItem
            }
        });


    } catch (error){
        console.error ('Error en agregarAlCarrito', error);
        res.status(500).json ({
            succes: false,
            message: 'Error al agregar producto al carrito',
            error: error.message
        });
    }
};


/**
 * Actualizar cantidad de item del carrito
 * 
 * PUT/ api /carrito/ :id
 * body {cantidad}
 * @param {Object} req request  de express
 * @param {Object} res respose de express
 */
const actualizarItemCarrito = async (req, res) => {
    try{
        const {id} = req.params;
        const {cantidad} = req.body;

        //VAlidar cantidad
        const cantidadNum =parseInt(cantidad);
        if (cantidadNum < 1) {
            return res.status (400).json ({
                succes: false,
                message: ' la cantidad debe se al menos 1'
            });
        }

        // Buscar item del carrito
        const item = await Carrito.findOne({
            where:{
                id,
                usuarioId: res.usuario.id // solo puede modificar su carrito
            },
            include :[{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock']
            }]
        });

        if(!item) {
            return res.status(404).json({
                succes: false,
                message: ' item del carrito no encontrado'
            });
        }
        //Validar stock disponible
        if( cantidadNum > item.producto.stock) {
            return res.status(400).json({
                succes: false,
                message: `Stock insuficiente, Disponible: ${item.producto.stock}`
            });
        }

        //actualizar cantidad
        item.cantidad = cantidadNum;
        await item.save();

        // respuesta exitosa
        res.json({
            succes: true,
            message:'cantidad actualizada',
            data: {
                item
            }
        });

    
    } catch (error) {
        console.error ('Error en  actualizarItemCarrito', error);
        return res.status(500).json({
            succes: false,
            message: 'error al actualizar item del carrito',
            error: error.message
        });
    }
};

/**
 * Eliminar item del carrito
 * DELETE /api / carrito/:id
 */

const eliminarItemCarrito = async (req, res) => {
    try{
        const {id} = req.param;

        //Buscar item
        const item = await Carrito.findOne({
            where:{
                id,
                usuarioId: res.usuario.id
            }
        });

        if (!item) {
            return res.status(404).json({
                succes: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        //eliminar
        await item.destroy()

        //respuesta exitosa
        res.json ({
            succes: true,
            message: 'item eliminado del caarrito'
        })

    } catch (error) {
        console.error('Error en eliminarItemCarrito',error);
        return res.status(500).json({
            succes: false,
            message: 'Error al eliminar item del carrito',
            error: error.message
        });
    }
};

