/**
 * Asociaciones entre modelos
 * este archivo define todaslas relaciones entre los 
 * modelos sequqlize
 * deje ejecutarse despues de importar los modelos
 */

//Impotar todos los modelos

const Usuario = require('./Usuario');
const Categoria = require ('./Categoria');
const Subcategoria = require ('./Subcategoria');
const Producto = require ('./Producto');
const Carrito = require ('./Carrito');
const Pedido = require ('./Pedido');
const DetallePedido = require ('./DetallePedido');

/**
 * Definir asociaciones
 * Tippos de relaciones sequelize:
 * hasone 1 - 1
 * belongst 1 - 1
 * hasmany 1 - N
 * belongsTomany N - N
 */

/**
 * Categoria - Subcategoria
 * una categoria tiene muchas subcategorias
 * una subcategoria pertenece a una categoria
 */

Categoria.hasMany(Subcategoria,{
    foreignKey: 'categoriaId', // campo que conecta las tablas
    as: 'subcategoria', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina categoria elimina subcategoria
    onUpdate: 'CASCADE' // si se actualiza categoria actualizar subcategoria
});

Subcategoria.belongsTo(Categoria,{
    foreignKey: 'categoriaId', // campo que conecta las tablas
    as: 'categoria', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina categoria elimina subcategoria
    onUpdate: 'CASCADE' // si se actualiza categoria actualizar subcategoria
});

/**
 * Categoria - Producto
 * una categoria tiene muchos productos
 * un producto pertenece a una categoria
 */

Categoria.hasMany(Producto,{
    foreignKey: 'categoriaId', // campo que conecta las tablas
    as: 'producto', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina categoria elimina producto
    onUpdate: 'CASCADE' // si se actualiza categoria actualizar el producto
});

Producto.belongsTo(Categoria,{
    foreignKey: 'categoriaId', // campo que conecta las tablas
    as: 'categoria', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina categoria elimina producto
    onUpdate: 'CASCADE' // si se actualiza categoria actualizar el producto
});

/**
 * Subcategoria y Producto
 * Una subcaategoria tiene muchos productos
 * un producto pertenece una subcategoria
 */

Subcategoria.hasMany(Producto,{
    foreignKey: 'subcategoriaId', // campo que conecta las tablas
    as: 'producto', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina subcategoria eliminar el producto
    onUpdate: 'CASCADE' // si se actualiza subcategoria actualizar el producto
});

Producto.belongsTo(Subcategoria,{
    foreignKey: 'subcategoriaId', // campo que conecta las tablas
    as: 'subcategoria', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina subcategoria eliminar el producto
    onUpdate: 'CASCADE' // si se actualiza subcategoria actualizar el producto
});

/**
 * Usuario - carrito
 * Un usuario tiene muchos carritos
 * un carrito pertence a un usuario
 */

Usuario.hasMany(Carrito,{
    foreignKey: 'usuarioId', // campo que conecta las tablas
    as: 'carrito', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina un usuario eliminar el carrito
    onUpdate: 'CASCADE' // si se actualiza un usuario actualizar el carrito
});

Carrito.belongsTo(Usuario,{
    foreignKey: 'usuarioId', // campo que conecta las tablas
    as: 'usuario', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina un usuario eliminar el carrito
    onUpdate: 'CASCADE' // si se actualiza un usuario actualizar el carrito
});

/**
 * Producto - Carrito
 * Una producto tiene muchos carritos
 * un carrito pertence a un produto
 */

Producto.hasMany(Carrito,{
    foreignKey: 'ProductoId', // campo que conecta las tablas
    as: 'carrito', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina un producto eliminar el carrito
    onUpdate: 'CASCADE' // si se actualiza un producto actualizar el Carrito
});

Carrito.belongsTo(Producto,{
    foreignKey: 'ProductoId', // campo que conecta las tablas
    as: 'producto', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina un producto eliminar el carrito
    onUpdate: 'CASCADE' // si se actualiza un producto actualizar el Carrito
});

/**
 * Usuario - pedido
 * un usuario tiene muchos pedidos
 * un pedido pertence a un usuario
 */

Usuario.hasMany(Pedido,{
    foreignKey: 'usuarioId', // campo que conecta las tablas
    as: 'pedido', //Alias para relacion
    onDelete: 'RESTRICT', // Si se elimina un usuario no eliminar pedidos
    onUpdate: 'CASCADE' // si se actualiza un usuario actualizar el pedido
});

Pedido.belongsTo(Usuario,{
    foreignKey: 'usuarioId', // campo que conecta las tablas
    as: 'usuario', //Alias para relacion
    onDelete: 'RESTRICT', // si se elimina un usuario no eliminar pedidos
    onUpdate: 'CASCADE' // si se actualiza usuario actualizar el pedidos
});

/**
 * Pedido - DetallePedido
 * Un pedido tiene muchos detalles de productos
 * un detalle de pedido pertenece a un pedido
 */

Pedido.hasMany(DetallePedido,{
    foreignKey: 'pedidoId', // campo que conecta las tablas
    as: 'detalles', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina un pedido  se elimina un detalle
    onUpdate: 'CASCADE' // si se actualiza subcategoria actualizar el producto
});

DetallePedido.belongsTo(Pedido,{
    foreignKey: 'pedidoId', // campo que conecta las tablas
    as: 'pedido', //Alias para relacion
    onDelete: 'CASCADE', // si se elimina un pedido se elimina detalles de pedido
    onUpdate: 'CASCADE' // si se actualiza un pedido actualizar el detalles de pedido
}); 

/**
 * Producto - detalle pedido 
 * Un producto puede estar en muchos detalles de pedido
 * Un detalle tiene un producto
 */

Producto.hasMany(DetallePedido,{
    foreignKey: 'productoId', // campo que conecta las tablas
    as: 'detallePedido', //Alias para relacion
    onDelete: 'RESTRICT', // NO se elimina un producto si este en un detalle pedido
    onUpdate: 'CASCADE' // si se actualiza un producto actualizar detalle pedido
});

DetallePedido.belongsTo(Producto,{
    foreignKey: 'subcategoriaId', // campo que conecta las tablas
    as: 'subcategoria', //Alias para relacion
    onDelete: 'RESTRICT', // NO se elimina un producto si este en un detalle pedido
    onUpdate: 'CASCADE' // si se actualiza un producto actualizar detalle pedido
});

/**
 * relacion muchos a muchos
 * pedido y producto tiene un relacion muchos a muchos atravez de detalle de pedido
 */

Pedido.hasMany(Producto,{
    through: DetallePedido, // tabal intermedia
    foreignKey:'pedidoId', //campo que conecta las tablas
    otherKey: 'productoId', //campo que conecta las tablas
    as: 'productos', //Alias para relacion
});

Producto.hasMany(Pedido,{
    through: DetallePedido, // tabal intermedia
    foreignKey:'productoId', //campo que conecta las tablas
    otherKey: 'pedidoId', //campo que conecta las tablas
    as: 'pedidos', //Alias para relacion
});

/**
 * Exportar funcion de inializacion
 * funcion para inicializar todas las asociacines
 * se llama desde server.js despues de cargar los modelos
 */
const initAssociations = () =>{
    console.log ('Asociaciones entre los modelos establecias correctamente');
};

//Exportar los modelos 
module.exports = {
    Usuario,
    Categoria,
    Subcategoria,
    Producto,
    Carrito,
    Pedido,
    DetallePedido,
    initAssociations
};