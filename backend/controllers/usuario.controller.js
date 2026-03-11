/**
 * Controlador de usuario ADMIN
 * maneja las gestiones de usuarios de administrador
 * lista de usuarios activa/ y desactiva
 */

/**
 * importar modelos
 */

const Usuario = require ('../models/Usuario');


/**
 * obtener todas los usuarios
 * GET/api/usuariros
 * query params:
 * Activo true/false (filtar por estado)
 * 
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const getUsuarios   = async (req, res) => {
    try {
        const {rol, activo, buscar, pagina = 1, limite = 10 }= req.query;

        //Construir los filtros
        const where = {}; // una array tiene dos condiciones por rol o por activo
        if(rol) where.rol = rol;
        if (activo !== undefined) where.activo = activo === 'true';

        //Busqueda por texto
        if(buscar){
            const {Op} = require('sequelize');
            where[Op.or] = [
                {nombre: { [Op.like]: `%${buscar}%`}},
                {apellido: { [Op.like]: `%${buscar}%`}}, //OP.like lo va autocompletando
                {email: { [Op.like]: `%${buscar}%`}},
            ];
        }

        //paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        //obtener usuarios sin password
        const {count, row:usuarios} = await Usuario.findAndCountAll({
            where,
            attributes: {exclude: ['password']},
            limit:parseInt(limite),
            offset,
            order:[['createdAt','DESC']]
        });

        // respuesta exitosa
        res.json({
            success: true,
            data: {
                usuarios,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt (limite),
                    totalPaginas: Math.ceil(count / parseInt (limite)),
                }
            }
        })
    }catch (error){
        console.error('Error en getUsuarios:', error),
        res.status(500).json({
            success:false,
            message: 'Error en al obtener el usuario',
            error: message.error
        })
    }
}
/**
 * obtener todas las usuario por id
 * GET/ api/usuario/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getUsuarioById = async (req, res) => {
    try {
        const {id}= req.params;
        
        // Buscar usuarios con subusuario y contar productos
        const usuario = await usuario.findByPk (id,{
            attributes:{exclude: ['password']}
        });
        
        if (!usuario){
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrada'
            });
        }


        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                usuario
            }
        });

    } catch (error){
        console.error('Error en getUsuarioById', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener el usuario',
            error: error.message,
        })
    }
};

/**
 * Crear nuevo usuario
 * POST / api/admin/usuario
 * Body: { nombre, apellido, email, password, rol, telefono, direccion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearUsuario = async (req, res) =>{
    try{

        const {nombre, apellido, email, password, rol, telefono, direccion} = req.body;
        if(!nombre || !apellido  || !email || !password || !rol) {
            return res.status(400).json({
                success:false,
                message: 'Faltan campos requeridos: nombre, apellido, email, password, rol'
            });
        }
        //validar rol
        if (!['cliente', 'auxiliar', 'administradores'].includes(rol)){
            return res.status(400).json({
                success: false,
                message: 'Rol invalido debe ser cliente, auxiliar o administrador'
            });
        }

        //validar email unico
        const usuarioExistente = await Usuario.findOne({where: {email}});
        if (usuarioExistente){
            return res.status(400).json({
                success: false,
                message: `ya existe un usuario con ese email: ${email}`
            });
        }
        
        // crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            rol,
            telefono: telefono || null,
            direccion: direccion || null, // si no se proporciona se establece como null
        });

        // respuesta exitosa
        res.status(201).json({
            success:true,
            message: ' Usuario creado exitosamente',
            data:{
                usuario:nuevoUsuario.tojson() // convertir en Json para excluir campos sensibles y es el formato para las api rest
            }
        });

    } catch (error){
        console.error('Error en crearUsuario', error);
        if(error.name === 'SequelizeValidationError'){
        return res.status(400).json({
            success: false,
            message:'Error de validacion',
            errors: error.errors.map(e => e.message)
        
        });
    }
    res.status(500).json({
        success:false,
        message: 'Error al crear usuario',
        error:error.message
    })
}
};

/**
 * Actualiza Usuario
 * PUT/ api/ admin/usuario/:id
 * body:{ nombre, apellido, email, password, rol, telefono, direccion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizaUsuario = async (req, res) =>{
    try{
        const{id} = req.params;
        const {nombre, apellido, telefono, direccion, rol} =req.body;

        //buscar usuario
        const usuario = await Usuario.findByPk(id);
        
        if(!usuario) {
            return res.status(404).json({
                success : false,
                message: 'Usuario no encontrada',
            })
        }
        
        // validacion rol si se proporciona
        if (rol && !['cliente', 'administrador'].includes(rol)){
            return res.status(400).json({
                success:false,
                message:`rol invalido`
            });
        }

        // Actualizar campos
        if (nombre!==undefined) usuario.nombre = nombre;
        if (apellido!==undefined) usuario.apellido = apellido;
        if (telefono!==undefined) usuario.telefono= telefono;
        if (direccion!==undefined) usuario.direccion = direccion;
        if (rol!==undefined) usuario.rol = rol;
    

        // guardar cambios
        await usuario.save();

        // respuesta exitosa
        res.json({
            success: true,
            message: 'usuario actualizada exitosamente',
            data:{
                usuarios: usuario.toJSON()
            }
        });
    
         }catch (error){
            console.error('Error en actualizarUsuario:', error);
            return res.status(500).json({
                success:false,
                message: 'Error al actulizar usuario',
                errors: error.message
            });
        }
    };


/**
 * Activar/Desactivar usuario
 * PATCH/api/admin/usuarios/:id/estado
 * 
 * Al desactivar una usuario se desacctican tosa las subusuarios relacionadas
 * al desactivar una subusuario se desactivan todos los productos
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleUsuario = async (req, res) => {
    try{
        const {id} =req.params;

        // Buscar usuario
        const usuario = await Usuario.findByPk(Id);

        if(!usuario) {
            return res.status(404).json ({
                success: false,
                message: 'usuario no encontrado'
            });
        }

        // no permitir desactivar el propio admin 
        if(usuario.id === req.usuario.id){
            return res.status(400).json({
                success: false,
                message: `no puedes desactivar tu propia cuenta`
            });
        }
        

        usuario.activo = !usuario.activo;
        await usuario.save();

        res.json({
            success: true,
            message: `Usuario ${usuario.activo ? 'activado': 'desactivado'} exitosamente`,
            date:{
                usuario: usuario.toJSON()
            }
        });

    }catch(error){
        console.error('Error en toogleUsurario:', error);
        res.status(500).json({
            success:false,
            message:' Error al cambiar esatdo del usuario',
            error:error.message
        });
    }
};
/**
 * Eliminar usuario
 * DELETE /api/admin/usuario/:id
 * @param {Object} req request express
 * @param {Object} res response express
*/

const eliminarUsuario = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'usuario no encontrado'
            });
        }

        // no permitir al promio Admin
        if(usuario.id === req.usuario.id) {
            return res.status(400).json({
                success: false,
                message: 'no puedes eliminar tu propia cuenta'
            });
       }
       await usuario.destroy();

        // Respuesta exitosa
        res.json({
                success: true,
                message: 'usuario eliminada exitosamente'
            });
        } catch (error){
        console.error('Error al eliminarUsuario:', error);
        res.status(500).json({
            success:false,
            message: 'Error al eliminar usuario',
            error: error.message
        });

    }
};

/**
 * Obtener una estadistica de un usuario
 * GET /api/admin/usuario/:id/estadistica
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getEstadisticaUsuarios = async (req, res) => {
    try {
        //datos de ususario
        const totalUsuarios = await Usuario.count();
        const totalClientes = await Usuario.count({where:{rol: 'cleinte'}});
        const totalAdmins = await Usuario.count({where: {ro:'adiministrador'}});
        const usuariosActivos= await Usuario.count({where:{activo: true}});
        const usuariosInactivo = await Usuario.count({where: { activo: false}});

        

        //respuesta exitosa
        res.json({
            success:true,
            data:{
                total:totalUsuarios,
                porRol:{
                   cliente: totalClientes,
                   administrador: totalAdmins,
                },
                porEstado:{
                    activos:usuariosActivos,
                    incativos:usuariosInactivo
                },
            }
        })
    }catch (error){
        console.error('Error en getEstadisticausuario:', error);
        res.status(500).json({
            success:false,
            message: 'Error al obtener estadisticas de la usuario',
            error: error.message
        })
    }
};


//Exportar todos los controladores
module.exports = {
    getUsuarios,
    getUsuarioById,
    crearUsuario,
    actualizaUsuario,
    toggleUsuario,
    eliminarUsuario,
    getEstadisticaUsuarios
};