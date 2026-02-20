/**
 * Controlador de categoria
 * maneja las operaciones crudy activa y/o desactiva categorias
 * solo para administrador
 */

/**
 * importar modelos
 */

const Categoria = require ('../models/Categoria');
const Subcategoria = require ('../models/Subcategoria');
const Producto = require ('../models/Producto');


/**
 * obtener todas las categorias
 * query params
 * Activo true/false (filtar por estado)
 * incluir subcategoria true / false (incluir subcategorias relacionadas)
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const getCategorias = async (req, res) => {
    try {
        const {activo, IncluirSubcategorias }= req.query;
        
        // Opciones de consulta
        const opciones = {
            orde:[['nombre', 'ASC']] // ordenar de manera alfabetica

        };
        
        //filtrar por estado activo si es especifica
        if (activo !==undefined){
            opciones.where = {activo: activo === 'true'};
        }

        // incluir Subcategorias si se solicita

        if (IncluirSubcategorias = 'treu'){
            opciones.include == [{
                model: Subcategoria,
                as: 'subcategorias', //campos del alias para la relacion
                attributes: ['id','nombre','descripcion', 'activo'] // campos de incluir de la subcategoria
            }]
        }

        //Obtener categorias
        const categorias = await Categoria.findAll
        (opciones);

        // respuesta exitosa
        res.json({
            success: true,
            count: categorias.length,
            data:{
                categorias
            }

        });
    } catch (error){
        console.error('Error en getCategoria', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener la Categoria',
            error: error.message,
        })
    }
};

/**
 * obtener todas las categorias por id
 * GET/ api/categoria/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getCategoriasById = async (req, res) => {
    try {
        const {id}= req.param;
        
        // Buscar categorias con subcategoria y contar productos
        const categoria = await Categoria.findByPk (id,{
            include:[
                {
                    model:Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id','nombre,',
                        'descripcion', 'activo']
                },
                {
                    model : Producto,
                    as: 'productos',
                    attributes: ['id']
                }
            ]
        });
        
        if (!categoria){
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //agregar contador de productos
        const categoriaJSON = categoria.toJSON();
        categoriaJSON.totalProductos = categoriaJSON.producto.length;
        delete categoriaJSON.producto;// no enviar la lista completa solo el contador

        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                categoria: categoriaJSON
            }
        });

    } catch (error){
        console.error('Error en getCategoriaById', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener la Categoria',
            error: error.message,
        })
    }
};

/**
 * Crear una categoria
 * POST / api/admin/categoria
 * Body: { nombre,descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearCategoria = async (req, res) =>{
    try{

        const {nombre,descripcion} = res.body;
        if(!nombre) {
            return res.status(400).json({
                success:false,
                message: 'El nombre es obligatorio'
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
        })
    }
}