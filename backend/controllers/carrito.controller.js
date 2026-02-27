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
        
    } 

}

