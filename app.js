const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors')
require('dotenv/config');
const authJwt = require('./helpers/jwt')
const errorHandler = require('./helpers/errHandler')

app.use(cors());
app.options('*', cors())

const productRouter = require('./routers/products');
const categoryRouter = require('./routers/categorries')
const usersRoutes = require('./routers/users')
const orderRoute = require('./routers/order')

const api = process.env.API_URL;

//middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler)

//router
app.use(`${api}/products`, productRouter);
app.use(`${api}/category`, categoryRouter);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, orderRoute)


//Database connection
mongoose.connect(
    process.env.CONNECTION_STRING,
    )
.then(()=> {
    console.log('Connected to database')
})
.catch((err) => {
    console.log(err);
})

app.listen(3000, () => {
    console.log(`server is running http://localhost:3000`);
})