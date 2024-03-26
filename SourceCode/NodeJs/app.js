const express = require("express");
const cors = require("cors");
const handleErrors = require('./middlewares/handle-errors.middleware');
require('dotenv').config();
const app = express();
const { logger } = require('./utils/logger.utils')
const db = require("./models");
const PORT = process.env.PORT ? process.env.PORT : 5000;
const { NotFound, BadRequest } = require('./utils/errors')
const bodyParser = require('body-parser');
const apiLog = require("./middlewares/apiLogger.middleware");
const errorCodeUtils = require("./utils/error-code.utils");
const corsOptions = {};

app.use(cors(corsOptions));
// connect to mongodb
dbConnect()
function dbConnect() {
    db.mongoose
        .connect(db.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .then(() => {
            console.log("Connected to database!");
        })
        .catch(error => {
            console.log("Cannot connect to database! Retrying...");
            console.error("Error connecting DB: ", error)
            logger.error("Error connecting to DB: ", error)
            dbConnect()
        });
}

app.use(bodyParser.json({
    limit: '50mb'
}));

app.use(bodyParser.urlencoded({
    limit: '50mb',
    parameterLimit: 100000,
    extended: true
}));

app.use(apiLog);

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return next(new BadRequest(err.message, errorCodeUtils.Invalid_body))
    }
});
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
//validate against double slash in urll
app.use('*', function (req, res, next) {
    if (req.originalUrl.includes('//')) {
        logger.error(`${404} - 'error' - ${"API NOT FOUND"} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
        return next(new NotFound("API not found", 404));
    }
    else
        next();
});
// simple route
app.get("/", (req, res) => {
    res.send({ message: "shopbyeth" });
});
app.get("/api", (req, res) => {
    res.send({ message: "shopbyeth" });
});
require("./routes/user.routes")(app);
require("./routes/admin.routes")(app);
require("./routes/auth.routes")(app);
require("./routes/public.routes")(app);
require("./batch/updateTransactionStatus")(app);

app.get('*', function (req, res, next) {
    logger.error(`${404} - 'error' - ${"API NOT FOUND"} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    return next(new NotFound("API not found", 404));
});

app.use(handleErrors);
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
    logger.info(`Server listening on port ${PORT}`)
})


