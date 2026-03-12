/**
 * MODE SUBCAREGORIA
 * define la tabla SubCategoria en la base de datos
 * almacena las Subcategorias principales de los productos
 */

//importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importae instancia de sequelize
const { sequelize } = require('../config/database');
const { before } = require('node:test');

 /**
  * Definir el modelo de la Subcategoria
  */
const Subcategoria = sequelize.define('Subcategoria', {
    //Campos de la tabla
    //Id Identificador unico (PRYMARY KEY)
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        uautoIncrement: true, 
        allowNull: false 
    },

    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Ya existe una subcategoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la subcategoria no puede estar vacio  '
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2y 100 caracteres'
            }
                
        }
    },

    /**
     * Descripcion de la subcategoria 
     */
    desripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * categoriaId - ID de la categoria a la que pertenece (FOREIGNKEY)
     * Esta es la relacion con la tabla categoria
     */
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias', // nombr de la tabla relacionada
            Key: 'id' // campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', // Si se actualiza el id, actualizar aca 
        // tambien
        onDelete: 'CASCADE',// si se elimina la categoria eliminar de   
        // las subcategoria
        validate: {
            notNull: {
                msg: 'Debe selecionar una categoria'
            }
        }
    },

    /**
     * activo estado de la subcategoria
     * si es false los productos de esta subcategoria se ocultan
     */
    activo:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    //Opciones del modelo
    
    tableName: 'subcategorias',
    timestamps: true, // Agrega campos createdAt y updatedAt

    /** 
     * indice compuestos para optimizar busquedas
     */
    indexes: [
        {
            // indice para buscar subcategorias por categorias
            fields: [ 'categoriaId']
        },
        {
            // Indice compuesto: nombre unico por categoria
            //permite que dos categorias direntes tengan subcategorias con el mismo nombre
            unique: true,
            fields :[ 'nombre', 'categoriaId'],
            name: 'nombre_categoria_unique'
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

                const Producto = require('./Producto');

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
    const Producto = require('./Producto');
    return await Producto.count ({
        where: {subcategoriaId: this.id}});

};
/**
 * Metodo para obtener la categoria padre
 * 
 * @returns { Promise<Categoria>} - categoria padre
 */

Subcategoria.prototype.obtenerCategoria = async function () {
    const Categoria = require ('./Categoria');
    return await Categoria.findByPk(this.categoriaId)
}


 
// exportar modelo Categoria 
module.exports = Subcategoria;
