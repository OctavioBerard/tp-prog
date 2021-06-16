const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const { json } = require('express');


const app = express();
const port = process.env.port || 3050;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); 

// MySql

//Listener 
app.listen(port, () => console.log('Server running on port ${port}', port))

const connection = mysql.createConnection({

    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'tp-prog'
});


//Route

app.get('/', (rep, res) => {
    res.send('Welcome to my API');
})



const queryDB = (req, sql, args) => new Promise((resolve, reject) => {
    connection.query(sql, args, (err, rows) => {
        console.log("sql:", sql);
        console.log("arg: ", args)
        if (err)
            return reject(err);
        //console.log(rows);
        if (rows.insertId) {
            resolve(rows.insertId)
        } else {
            resolve(rows)
        }
        //rows.changedRows  rows.affectedRows  rows.insertId ? resolve(rows) : resolve(rows);
    });
});


//VER USUARIO POR /ID

app.get('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM usuarios WHERE id_Usuario = ${ id }`; 
    connection.query(sql, (error, result) => {
        if (error) throw error;
        if (result.length > 0) {
            res.json(result);
        } else {
            res.send('No hubo resultados');
        }
    }); 
});

//VER USUARIOS

app.get('/usuarios', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM usuarios `;
    connection.query(sql, (error, result) => {
        if (error) throw error;
        if (result.length > 0) {
            res.json(result);
        } else {
            res.send('No hubo resultados');
        }
    });
});


//VER COMPRAS DE X USUARIO
app.get('/compras/user/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT compra.idCompra, compra.total, productos.Nombre, productos.Descripcion, productos.Precio, productos.Categoria, productos.Nacionalidad FROM compra INNER JOIN compra_producto ON compra_producto.id_compra = compra.idCompra INNER JOIN productos ON productos.idProducto = compra_producto.id_producto WHERE idUsuario = ${id} ORDER BY compra.idCompra`;
    connection.query(sql, (error, result) => {
        if (error) throw error;
        if (result.length > 0) {
            res.json(result);
        } else {
            res.send('No hubo resultados');
        }
    });
});


//ACA AGREGO USUARIOS

app.post('/add', (req, res) => {
    const sql = 'INSERT INTO usuarios SET ?';

    const usuarioObjeto = {
        Nombre: req.body.Nombre,
        Apellido: req.body.Apellido,
        Puntos: req.body.Puntos,
        Contrasenia: req.body.Contrasenia,
        Email: req.body.Email
    };

    connection.query(sql, usuarioObjeto, error => {
        if (error) throw error;
        res.status(200);
        res.send(' Usuario: ' + usuarioObjeto.Nombre + ' ' + usuarioObjeto.Apellido + 'Creado');
    });
});


//-------------------------------------------------------------------------------//

app.get('/verProducto', (req, res) => {
    const sql = `SELECT * FROM productos`;

    connection.query(sql, (error, results) => {
        if (error) throw error;
        if (results.length > 0) {
            res.json(results);
        } else {
            res.send('No hay productos disponibles');
        }
    });
});


app.post('/addProducto', (req, res) => {
    const sql = 'INSERT INTO productos SET ?';

    const productoObjeto = {
        Nombre: req.body.Nombre,
        Descripcion: req.body.Descripcion,
        Precio: req.body.Precio,
        Categoria: req.body.Categoria,
        Nacionalidad: req.body.Nacionalidad
    };

    connection.query(sql, productoObjeto, error => {
        if (error) throw error;
        res.status(200);
        res.send('Producto Creado');
    });
});

app.patch('/updateProducto', (req, res) => {
    const idProducto = req.body.idProducto

    const sql = 'UPDATE productos SET ? WHERE idProducto =' + idProducto;

    const productoObjeto = {
        Nombre: req.body.Nombre,
        Descripcion: req.body.Descripcion,
        Precio: req.body.Precio,
        Categoria: req.body.Categoria,
        Nacionalidad: req.body.Nacionalidad
    };

    connection.query(sql, productoObjeto, error => {
        if (error) throw error;
        res.status(200);
        res.send('Producto Modificado');
    });
});



app.post('/compra',async function (req, res) {


    var total_ = 0
        await queryDB(req, "select sum(precio) AS total from productos where idProducto in ('" + req.body.products.join("','") + "')").then((data) => {
        const p = { ...data[0] };
            total_ = p.total
        })

    var puntos = 0
    await queryDB(req, "SELECT Puntos FROM usuarios where id_Usuario = " + req.body.user).then((data) => {
        const p = { ...data[0] };
        puntos = p.Puntos
    })
    console.log(puntos)

    if (puntos < total_) {
        res.send({ mensaje: "No posee la cantidad de puntos necesarios para realizar la cuenta", puntos: puntos, total: total_ })
    } else {

        let resta = puntos - total_ 

        await queryDB(req, "Update usuarios SET Puntos = "+ resta + " where id_Usuario = " + req.body.user).then((data) => {
            const p = { ...data[0] };
        })

        var id_compra = 0

        const Compra = {
            idUsuario: req.body.user,
            total: total_
        };


        await queryDB(req, "INSERT INTO compra SET ?", Compra).then((data) => {
            id_compra = data
        })

        for (var i = 0; i < req.body.products.length; i++) {
            const Compra_producto = {
                id_compra: id_compra,
                id_producto: req.body.products[i]
            }
            await queryDB(req, "INSERT INTO compra_producto SET ?", Compra_producto).then((data) => {
                const p = { ...data[0] };

            })

        }
        res.send("Compra realizada")
        //res.send({ mensaje: "Si posee la cantidad de puntos necesarios para realizar la cuenta", puntos: puntos, total: total_ })
    }
    
})





//Check connect
connection.connect(error => {
    if (error) throw error;
    console.log('Database server running');
})

