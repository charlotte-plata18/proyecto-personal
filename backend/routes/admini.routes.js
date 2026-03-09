/**Rutas del administrador
 * agrupas tods las rutas de gestion del admin
 */

const express = require ( 'express');
const router = express.Router();

//importar los middleware

const {verificarAuth} = require ('../middleware/auth');
const {esAministrador, esAdminOAuxliar, soloAdiministrador} = require ('../middleware/checkRole');

//importar configuracion de multer para la subida de imagenes 
const {update} = require ('../config/multer');

//importar controles

const categoriaController = require ('../controllers/categoria.controller');
const subcategoriaController = require ('../controllers/subcategoria.controller');
const usuarioController = require ('../controllers/usuario.controller');
const productoController = require ('../controllers/productos.controller');
const pedidoController = require ('../controllers/pedido.controller');



 // restriccion de acceso de las rutas del admin
 router.use (verificarAuth, esAdminOAuxliar);

 // rutas de categorias
 //Get /api/ admin/categoria
 router.get ('/categorias', categoriaController.getCategorias);

 //get/ api/admi/categoria:id
 router.get('/categorias/:id', categoriaController.getCategoriasById);

 //get/api/*admin/categorias/:id/stats
 router.get('/categorias:id/stats', categoriaController.getEstadisticaCategoria);

  //post /api/ admin/categoria
 router.post ('/categorias/:id', categoriaController.crearCategoria);

  //PUT /api/ admin/categoria
 router.put ('/categorias/:id', categoriaController.actualizaCategoria);

  //patch/api/ admin/categoria:id/toggle desactivar o activar categoria
 router.patch ('/categorias/:id/toggle', categoriaController.toggleCategoria);

  //delete/api/ admin/categoria
router.delete ('/categorias', soloAdiministrador, categoriaController.eliminarCategoria);

 // rutas de subcategorias
 //Get /api/ admin/categoria
 router.get ('/subcategorias', subcategoriaController.getSubcategorias);

 //get/ api/admi/subcategoria:id
 router.get('/subcategorias/:id', subcategoriaController.getSubcategoriasById);

 //get/api/*admin/subcategorias/:id/stats
 router.get('/subcategorias:id/stats', subcategoriaController.getEstadisticaSubcategoria);

  //post /api/ admin/subcategoria
 router.post ('/subcategorias/:id', subcategoriaController.crearSubcategoria);

  //PUT /api/ admin/subcategoria
 router.put ('/subcategorias/:id', subcategoriaController.actualizaSubcategoria);

  //patch/api/ admin/subcategoria:id/toggle desactivar o activar subcategoria
 router.patch ('/subcategorias/:id/toggle', subcategoriaController.toggleSubcategoria);

  //delete/api/ admin/subcategoria
router.delete ('/subcategorias', soloAdiministrador, subcategoriaController.eliminarSubcategoria);

 // rutas de usuario
 //Get /api/ admin/usuario
 router.get ('/usuario', usuarioController.getUsuarios);

 //get/ api/admi/usuario:id
 router.get('/usuario/:id', usuarioController.getUsuarioById);

 //get/api/*admin/usuario/:id/stats
 router.get('/usuario:id/stats', usuarioController.getEstadisticaUsuarios);

  //post /api/ admin/usuario
 router.post ('/usuario/:id', usuarioController.crearUsuario);

  //PUT /api/ admin/usuario
 router.put ('/usuario/:id', usuarioController.actualizaUsuario);

  //patch/api/ admin/usuario:id/toggle desactivar o activar categoria
 router.patch ('/usuario/:id/toggle', usuarioController.toggleUsuario);

  //delete/api/ admin/usuario
router.delete ('/usuario', soloAdiministrador, usuarioController.eliminarUsuario);



 // rutas de productos
 //Get /api/ admin/productos
 router.get ('/producto', productoController.getProductos);

 //get/ api/admin/producto/:id
 router.get('/producto/:id', productoController.getProductoById);

 //get/api/admin/productos/:id/stats
 router.get('/productos/:id/stats', productoController.getEstadisticaProducto);

    //post /api/admin/producto
 router.post('/productos', productoController.crearProducto);

    //PUT /api/admin/producto
 router.put('/productos/:id', productoController.actualizaProducto);

    //patch/api/admin/producto/:id/toggle desactivar o activar producto
 router.patch('/productos/:id/toggle', productoController.toggleProducto);

    //delete/api/admin/producto
router.delete('/productos', soloAdiministrador, productoController.eliminarProducto);