const http = require('http');
const url = require("url");
const path = require("path");
const fs = require("fs");

const hostname = '127.0.0.1';
const port = 8080;
const wd = process.cwd();

var ServeStatic = {
	exists: function(path, callback){
		fs.access(path, fs.constants.F_OK, (err) => {
			if(err){
				callback(err);
			} else {
				callback(null);
			}
		});
	},
	readContent: function(path, callback){
		fs.readFile(path, "binary", callback);
    },
    
    isDirectory: async function(path) {
        return new Promise((resolve, reject) => {
            fs.lstat(path, (err, stats) => {
                if(err) {
                    reject(err);
                } else {
                    if(stats.isDirectory()) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            });
        });
    },

    readDirectory: async function(path) {
        return new Promise((resolve, reject) => {
            fs.readdir(path, (err, dir) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(dir);
                }
            })
        })
    }
}

function processFile(res, filePath) {
    ServeStatic.readContent(filePath, (err, data) => {
        if(err){
            res.statusCode = 400;
            res.end();
        } else {
            res.statusCode = 200;
            res.write(data, "binary");
            res.end();
        }
    });
}

function processDirectory(res, filePath) {
    ServeStatic.readDirectory(filePath)
        .then((dirContent) => {
            dirContent.forEach(element => {
                res.write(` - ${element}\n`);
            });
            res.statusCode = 200;
            res.end();
        })
        .catch((err) => {
            res.statusCode = 400;
            res.end();
        })
}


http.createServer((req, res) => {
  var pathName = url.parse(req.url).pathname;
  var filePath = path.join(wd, pathName);

  ServeStatic.exists(filePath, async (err) => {
  	if(err){
  		res.statusCode = 404;
  		res.end();
  	} else {
          try {
            const isDir = await ServeStatic.isDirectory(filePath);
            if(isDir) {
                processDirectory(res, filePath);
            } else {
                processFile(res, filePath);
            }
          } catch (error) {
            res.statusCode = 400;
            res.end();
          }
          
  	}
  });

}).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});