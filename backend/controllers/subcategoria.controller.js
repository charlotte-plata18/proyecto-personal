/**
 * Controlador de subcategoria
 * maneja las operaciones crudy activa y/o desactiva subcategorias
 * solo para administrador
 */

/**
 * importar modelos
 */

const Subcategoria = require ('../models/Subcategoria');
const Categoria = require ('../models/Categoria');
const Producto = require ('../models/Producto');


/**
 * obtener todas las subcategorias
 * query params
 * categoriaId: Id de la categoria
 * Activo true/false (filtar por estado)
 * incluir categoria true / false (incluir categorias relacionadas)
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const getSubategorias = async (req, res) => {
    try {
        const {categoriaId,activo, incluirCategoria }= req.query;
        
        // Opciones de consulta
        const opciones = {
            order:[['nombre', 'ASC']] // ordenar de manera alfabetica

        };

        //filtro
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (activo !==undefined) where.activo = activo === 'true';

        if (Object.keys(where).length > 0) {
            opciones.where = where;
        }
        

        // incluir categorias si se solicita

        if (incluirCategorias === 'true'){
            opciones.include == [{
                model: Categoria,
                as: 'categoria', //campos del alias para la relacion
                attributes: ['id','nombre', 'activo'] // campos de incluir de la categoria
            }]
        };

        //Obtener subcategorias
        const subcategorias = await Subcategoria.findAll
        (opciones);

        // respuesta exitosa
        res.json({
            success: true,
            count: subcategorias.length,
            data:{
                subcategorias
            }

        });
    } catch (error){
        console.error('Error en getSubcategorias', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener las Subcategorias',
            error: error.message,
        })
    }
};

/**
 * obtener todas las subcategorias por id
 * GET/ api/subcategoria/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getSubcategoriasById = async (req, res) => {
    try {
        const {id}= req.params;
        
        // Buscar subcategorias con categoria y contar productos
        const subcategoria = await Subcategoria.findByPk (id,{
            include:[
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre','activo']
                },
                {
                    model : Producto,
                    as: 'productos',
                    attributes: ['id']
                }
            ]
        });
        
        if (!subcategoria){
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

        //agregar contador de productos
        const subcategoriaJSON = subcategoria.toJSON();
        subcategoriaJSON.totalProductos = subcategoriaJSON.productos.length;
        delete subcategoriaJSON.productos;// no enviar la lista completa solo el contador

        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                subcategoria: subcategoriaJSON
            }
        });

    } catch (error){
        console.error('Error en getSubcategoriaById', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener la Subcategoria',
            error: error.message,
        })
    }
};

/**
 * Crear una subcategoria
 * POST / api/admin/subcategoria
 * Body: { nombre,descripcion,categoriaId}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearSubcategoria = async (req, res) =>{
    try{

        const {nombre,descripcion,categoriaId} = req.body;
        //validacion 1: nombre obligatorio        
        if(!nombre || !categoriaId) {
            return res.status(400).json({
                success:false,
                message: 'El nombre y la categoria son requeridos'
            });

        }
         //validar si la categoria existe
         const categoria = await Categoria.findByPk(categoriaId);
         if (!categoria) {
            return res.status(400).json({
                success:false,
                message: `La categoria con id ${categoriaId} no existe`
            });
         }

        // Validacion 2: categoria duplicada
        const categoriaExistente = await categoria.findOne({where: (nombre)});
        if (categoriaExistente){
            return res.status(400).json({
                success:false,
                message: `Ya existe una categoria con el nombre"${nombre}`
            });
        }

        // crear categoria
        const nuevaCategoria = await Categoria.create({
            nombre,
            descripcion: descripcion || null, // si no se proporciona la descripcion se establece como null
            activo:true
        });

        //Respuesta exitosa
        res.status(201).json({
            success:true,
            message: ' Categoria creada exitosmente',
            data:{
                categoria: nuevaCategoria
            }
        });
    } catch (error){
        if(error.name === 'SequelizeValidationError'){
        return res.status(400).json({
            success: false,
            message:'Error de validacion',
            errors: error.errors.map(e => e.message)
        
        });
    }
    res.status(500).json({
        success:false,
        message: 'Error al crear categoria',
        error:error.message
    })
}
};

/**
 * Actualiza categoria
 * PUT/ api/ admin/ categoria/:id
 * body:{ nombre, descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizaCategoria = async (req, res) =>{
    try{
        const{id} = req.param;
        const {nombre, descripcion} =req.body;

        //buscar categoria
        const categoria = await Categoria.findByPk(id);
        
        if(!categoria) {
            return res.status(404).json({
                success : false,
                message: 'Categoria no encontrada',
            })
        }
        
        // validacion 1 si se camabia el nombre verificar que no exista
        if (nombre && nombre !== categoria.nombre){
            const categoriaConMismoNombre = await categoria.findOne({ where:{nombre}});
            if ( categoriaConMismoNombre) {
                return res.status(400).json({
                    success:false,
                    message:`ya existe una categoria con el nombre"${nombre}"`,
                });
            }
        } 

        // Actualizar campos
        if (nombre!==undefined) categoria.nombre = nombre;
        if (descripcion!==undefined) categoria.descripcion = descripcion;
        if (activo!==undefined) categoria.activo = activo;

        // guardar cambios
        await categoria.save();

        // respuesta exitosa
        res.json({
            success: true,
            message: 'Categoria actualizada exitosamente',
            data:{
                categoria
            }
        });
    }catch (error){
        console.error('Error en actualizar categoria:', error);

        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success:false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            success:false,
            message :'Error al actualizar categoria',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar categoria
 * PATCH/api/admin/categorias/:id/estado
 * 
 * Al desactivar una categoria se desacctican tosa las subcategorias relacionadas
 * al desactivar una subcategoria se desactivan todos los productos
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleCategoria = async (req, res) => {
    try{
        const {id} =req.params;

        // Buscar categoria
        const categoria = await Categoria.findByPk(Id);

        if(!categoria) {
            return res.status(404).json ({
                success: false,
                message: 'Categoria no encontrada'
            });
        }
        
        //Alternaar estado activo
        const nuevoEstado = !categoria.activo;
        categoria.activo = nuevoEstado;

        // Guardar cambios
        await categoria.save();

        //contar cuantos registros se afectaron
        const subcategoriaAfectadas = await
        Subcategoria.count ({where:{categoriaId:id}
        });

        const productoAfectadas = await producto.count ({where:{categoriaId:id}
        });

        //Respuesta exitosa
        res.json({
            success:true,
            message: `Categoria ${nuevoEstado ? 'activada': 'desactivada'} exitosamente`,
            data:{
                categoria,
                afectados:{
                    Subcategoria:
                    subcategoriaAfectadas,
                    productos: productoAfectadas
                }
            }
        });
    } catch (error){
        console.error('Error en toggleCategoria:', error);
        res.status(500).json({
            success:false,
            message:'Error al cambiar estado de categoria',
            error: error.message
        });
    }
};

/**
 * Eliminar categoria
 * DELETE /api/admin/categoria/:id
 * Solo permite eliminsr si no tiene subcategorias 
 * ni productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
*/

const eliminarCategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar categoria
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // Validacion varifica que no tenga subcategoria
        const subcategorias = await Subcategoria.count({
            where: {categoriaId: id}
        });
         if (subcategorias > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoria por que tiene ${subcategorias} 
                subcategorias asociadas usa PATCH/api/admin/categoria/:id/ toogle para desactivarla en lugar de eliminarla`
            });
         }
          // Validacion varifica que no tenga productos
        const productos = await Producto.count({
            where: {categoriaId: id}
        });
         if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoria por que tiene ${productos} 
                productos asociados usa PATCH/api/admin/categoria/:id/ toogle para desactivarla en lugar de eliminarla`
            });
         }
        
        // Eliminar categoria
            await categoria.destroy();
        // Respuesta exitosa
        res.json({
                success: true,
                message: 'Categoria eliminada exitosamente'
            });
        } catch (error){
        console.error('Error al eliminar categoria:', error);
        res.status(500).json({
            success:false,
            message: 'Error al eliminar categoria',
            error: error.message
        });

    }
};

/**
 * Obtener una estadistica de un categoria
 * GET /api/admin/categoria/:id/estadistica
 * retorna
 * Total de subcategorias activas/ incativas
 * total de productos activos / inactivos
 * valor total de inventario 
 * stock total
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getEstadisticaCategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //verificar que la categoria exista
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message:'categoria no encontrada'
            });
        }

        //contar subcategorias activas e inactivas
        const totalSubcategorias = await Subcategoria.count({
            where:{categoriaId: id,}
        });
        const subcategoriasActivas = await Subcategoria.count({
            where:{categoriaId: id, activo: true}
        });
        
        //contar productos incativos y activos
        const totalProductos = await Producto.count({
            where:{categoriaId: id}
        });
        const productosActivos = await Producto.count({
            where:{categoriaId: id, activo: true}
        });

        //obtener prodcutos para calcular estadisticas de inventario
        const productos = await Producto.findAll({
            where:{categoriaId: id},
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de invetario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
            stockTotal += producto.stock;
        });

        //respuesta exitosa
        res.json({
            success:true,
            data:{
                categoria:{
                    id: categoria.id,
                    nombre: categoria.nombre,
                    activo: categoria.activo,
                },
                estadisticas:{
                    subcategorias: {
                        total: totalSubcategorias,
                        activas: subcategoriasActivas,
                    },
                    productos: {
                        total: totalProductos,
                        activos: productosActivos,
                    },
                    inventario: {
                        stockTotal,
                        valorTotal: valorTotalInventario.toFixed(2) // quitar decimales 
                    }
                }
            }
        });
    }catch (error){
        console.error('Error en getEstadisticaCategoria:', error);
        res.status(500).json({
            success:false,
            message: 'Error al obtener estadisticas de la categoria',
            error: error.message
        })
    }
};


//Exportar todos los controladores
module.exports = {
    getCategorias,
    getCategoriasById,
    crearCategoria,
    actualizaCategoria,
    toggleCategoria,
    eliminarCategoria,
    getEstadisticaCategoria
};