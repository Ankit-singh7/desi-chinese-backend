const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const http = require('http');
const base64 = require('base64topdf');
const appConfig = require('./config/appConfig');
const logger = require('./libs/loggerLib');
const routeLoggerMiddleware = require('./middlewares/routeLogger.js');
const globalErrorMiddleware = require('./middlewares/appErrorHandler');
const mongoose = require('mongoose');
const morgan = require('morgan');
var cors = require('cors');
const cron = require('node-cron');
const libs = require('./libs/timeLib');
app.use(cors());
const time = require('./libs/timeLib');
const check = require('./libs/checkLib')
const model = require('./models/SessionModel')
const sessionModel = mongoose.model('session')
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req,file,cb) {
    cb(null,'./uploads');
  },
  filename:(req,file,cb) => {
    cb(null,new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
})
const destination = multer({storage:storage})
let billUrl = `${appConfig.apiVersion}/bill`;
let dir = './uploads'
if (!fs.existsSync(dir)){
  fs.mkdirSync(dir);
}
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(routeLoggerMiddleware.logIp);
app.use(globalErrorMiddleware.globalErrorHandler);

app.use('/uploads',express.static('uploads'))
app.use(express.static(path.join(__dirname, 'client')));


cron.schedule('0 0 0 * * *', function() {
  console.log('running a task every minute');
  sessionModel.find({session_status:'true'}).exec((err,result) => {
    if(err) {
      console.log(err)
    }else if (check.isEmpty(result)) {
      console.log('No active session')
    } else {
      let option = {
        session_status: 'false'
      }

      sessionModel.updateOne({'session_id':result[0].session_id},option,{multi:true}).exec((err,result) => {
        if(err) {
          console.log(err)
        }else {
          console.log('updated successfully')
        }
      })
    }
  })
});


// app.post(`${billUrl}/upload`, multipartMiddleware, (req, res) => {
//   res.json({
//       'message': 'File uploaded successfully'
//   });
// });

app.post(`${billUrl}/upload`,destination.single('pdf'),(req,res) => {
  console.log(req)
  // let decodedBase64 = base64.base64Decode(req.body.base64, 'bill.pdf');
  res.json({message:'file saved',
            path: req.file.path
          })
  
})







const modelsPath = './models';
const controllersPath = './controllers';
const libsPath = './libs';
const middlewaresPath = './middlewares';
const routesPath = './routes';

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    next();
});



//Bootstrap models
fs.readdirSync(modelsPath).forEach(function (file) {
  if (~file.indexOf('.js')) require(modelsPath + '/' + file)

});
// end Bootstrap models

// Bootstrap route
fs.readdirSync(routesPath).forEach(function (file) {
  if (~file.indexOf('.js')) {
    let route = require(routesPath + '/' + file);
    route.setRouter(app);
  }
});
// end bootstrap route


// calling global 404 handler after route

app.use(globalErrorMiddleware.globalNotFoundHandler);

// end global 404 handler

/**
 * Create HTTP server.
 */

const server = http.createServer(app);
// start listening to http server
console.log(appConfig);
server.listen(process.env.PORT || appConfig.port);
server.on('error', onError);
server.on('listening', onListening);
console.log(time.getNormalTime())

// end server listening code


// socket io connection handler 
// const socketLib = require("./libs/socketLib");
// const socketServer = socketLib.setServer(server);


// end socketio connection handler



/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    logger.error(error.code + ' not equal listen', 'serverOnErrorHandler', 10)
    throw error;
  }


  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(error.code + ':elavated privileges required', 'serverOnErrorHandler', 10);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(error.code + ':port is already in use.', 'serverOnErrorHandler', 10);
      process.exit(1);
      break;
    default:
      logger.error(error.code + ':some unknown error occured', 'serverOnErrorHandler', 10);
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  ('Listening on ' + bind);
  logger.info('server listening on port' + addr.port, 'serverOnListeningHandler', 10);
  console.log()
  // let db = mongoose.connect(process.env.MONGODB_URI || appConfig.db.localUri ,{useNewUrlParser:true, useUnifiedTopology: true});
  let db = mongoose.connect(appConfig.db.localUri ,{useNewUrlParser:true, useUnifiedTopology: true});
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});


/**
 * database connection settings
 */
mongoose.connection.on('error', function (err) {
  console.log('database connection error');
  console.log(err)
  logger.error(err,
    'mongoose connection on error handler', 10)
  //process.exit(1)
}); // end mongoose connection error

mongoose.connection.on('open', function (err) {
  if (err) {
    console.log("database error");
    console.log(err);
    logger.error(err, 'mongoose connection open handler', 10)
  } else {
    console.log("database connection open success");
    //console.log(libs.isSameDayAsToday(Date()))

    logger.info("database connection open",
      'database connection open handler', 10)
  }
  //process.exit(1)
}); // enr mongoose connection open handler



module.exports = app;