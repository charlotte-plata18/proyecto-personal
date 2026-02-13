/**
 * MODE CAREGORIA
 * define la tabla Carrito en la base de datos
 * almacena los productos que cada usuario ha agregado a su carrito
 */

//importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importae instancia de sequelize
const { sequelize } = require('../config/database');
const { table } = require('console');

 /**
  * Definir el modelo de la Carrito
  */
const Carrito = sequelize.define('Carrito', {
    //Campos de la tabla
    //Id Identificador unico (PRYMARY KEY)
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },

    // UsuarioId ID del usuario dueño del carrito
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', //si se elimina el usuario se elimina su carrito
        validate:{
            notNull: {
                msg: 'debe especificar usuario'
            }
        }
    },

    // ProductoId ID del producto que se agrega al carrito
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // se elimina el producto se elimina del carrito
        validate:{
            notNull: {
                msg: 'Debe especificar producto'
            }
        }
    },

    // Cantidad del producto en el carrito
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        delfaultvalue: 1,
        validate:{
            isInt: {
                msg: 'La cantidad debe ser un numero entero'
            },
            min: {
                args: [1],
                msg: 'La cantidad debe ser al menos 1'
            }
        }
    },


    /**
     * Precio Unitario del producto al monento de agregar al carrito
     * se guarda para mantener el precio aunque el producto cambie de precio
     */
    precioUnitario: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate :{
            isDecimal: {
                msg: 'El precio unitario debe ser un numero decimal valido'
            },
            min:{
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }
    }
}, {
    //Opciones del modelo
    tableName: 'carritos',
    timestamps: true,
    //indices compuestos para optimizar busquedas
    indexes: [
        {
            //indice para buscar por usuario y producto
            fields: ['usuarioId',]
        },
        {
            //Indice compuesto: un usuario no puede tener el mismo producto
            //duplicado
            unique: true,
            fields: ['usuarioId', 'productoId'],
            name: 'usuario_producto_unico'
        }
        
    ],

    /**
     * Hooks Acciones de automaticas
     */

    hooks:{
        /**
         * beforeCreate - se ejecuta antes de crear una subcategoria
         * verifica que la categoria padre este activa
         */
        beforeCreate: async (subcategoria) =>{
            const Categoria = require ('./Categoria');

            // Buscar categoria padre
            const categiria = await Categoria.findByPk (subcategoria.categoriaId);

            if (!categoria) {
                throw  new Error ( 'La categoria seleccionada noo existe');
            }

            if (!categoria.activo) {
                throw new Error ('No se puede crear una subcategoria  en una categoria inactiva')
            }
        },

        /**
         * afterUpdate: se ejecuta despues de actualizar una subcategoria
         * si se desactiva una subcategoria se desactivan todos sus productos
         */


        afterupdate: async (subcategoria, options) => {
            //Verificar si el campo activo cambio
            if (subcategoria.changed('activo') && !subcategoria.activo) {
                console.log(`Desactivado subcategoria: ${subcategoria.nombre}`);

                // Importar modelos (aqui para evitar dependecias circulares)

                const Producto = require('./producto');

                try {
                    //Paso 1 desactivar las subcategoria de esta categoria
                    const producto= await Producto.findAll({
                        where:{subcategoriaId: subcategoria.id}
                    });

                    for (const producto of productos){
                        await producto.update({activo:false
                        }, {transaction:options.transaction}),
                        console.log(`Producto desactivadas: ${producto.nombre}`);
                    };
                    console.log ('Subcategoria y productos relacionados correctamente');
                } catch(error) {
                    console.error(
                        `Error al desactivar productos a la subcategoria:`,
                        error.message,
                    );
                    throw error; 
                    
                }


            }
            // si se activa una categoria no se activa automaticament las subcategorias y productos
        }
    }
});

//METODOS DE INSTANCI
/**Metodos para contar rproductos de esta categoria
 * 
 * @returns {Promise<number>} - numero de productos
 */
Subcategoria.prototype.contarproductos = async function() {
    const Producto = require('./producto');
    return await Producto.count ({
        where: {subcategoriaId: this.id}});

};
}
);