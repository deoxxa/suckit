var http = require("http"),
    level = require("level"),
    os = require("os"),
    path = require("path"),
    store = require("level-store"),
    url = require("url");

function generateId() {
  return [Date.now(), Math.round(Math.random() * 100000)].join("-");
};

var Suckit = module.exports = function Suckit(options) {
  http.Server.call(this);

  this.sessionId = generateId();
  this.dataPath = options.dataPath || os.tmpdir();
  this.buckets = {};

  this.timeout = 0;

  this.on("request", this.onRequest.bind(this));
};
Suckit.prototype = Object.create(http.Server.prototype);

Suckit.prototype.getBucket = function getBucket(name) {
  if (!this.buckets[name]) {
    this.emit("log", "info", "opening bucket", {session: this.sessionId, name: name});

    this.buckets[name] = {};
    this.buckets[name].db = level(path.join(this.dataPath, name), {valueEncoding: "binary"});
    this.buckets[name].store = store(this.buckets[name].db);
  }

  return this.buckets[name];
};

Suckit.prototype.onRequest = function onRequest(req, res) {
  var requestId = generateId();

  this.emit("log", "info", "request", {session: this.sessionId, request: requestId, method: req.method, url: req.url});

  if (req.method !== "GET" && req.method !== "PUT" && req.method !== "POST") {
    res.writeHead(406);
    return res.end();
  }

  var uri = url.parse(req.url, true);

  var bits = uri.pathname.replace(/^\//, "").split("/");

  var bucketName = bits.shift(),
      fileName = bits.shift();

  if (!bucketName) {
    res.writeHead(406);
    return res.end();
  }

  var bucket = this.getBucket(bucketName);

  if (req.method === "GET" && bucketName && !fileName) {
    this.emit("log", "info", "getting list", {session: this.sessionId, request: requestId, bucket: bucketName});

    var keyStream = bucket.db.createKeyStream();

    keyStream.on("error", function(err) {
      this.emit("log", "error", "error getting list", {session: this.sessionId, request: requestId, bucket: bucketName, err: err.message});
      res.writeHead(500);
      return res.end();
    });

    var writtenHead = false,
        seen = {};

    keyStream.on("data", function(key) {
      if (!writtenHead) {
        this.emit("log", "info", "serving list", {session: this.sessionId, request: requestId, bucket: bucketName});
        res.writeHead(200, {"content-type": "text/plain"});
        writtenHead = true;
      }

      var f = key.split(" ").shift();
      if (!seen[f]) {
        seen[f] = true;
        res.write(f + "\n");
      }
    });

    keyStream.on("end", function() {
      res.end();
    });

    return;
  }

  if (req.method === "GET" && bucketName && fileName) {
    this.emit("log", "info", "getting entry", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName});

    return bucket.store.exists(fileName, function(err, exists) {
      if (err) {
        this.emit("log", "error", "error checking if file exists", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName, err: err.message});
        res.writeHead(500);
        return res.end();
      }

      if (!exists) {
        this.emit("log", "warn", "file doesn't exist", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName});
        res.writeHead(404);
        return res.end();
      }

      this.emit("log", "info", "beginning to serve file", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName, live: !!uri.query.live});

      var file = bucket.store.createReadStream(fileName, {live: !!uri.query.live});
      file.on("end", function() {
        this.emit("log", "info", "finished serving file", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName});
      }.bind(this));

      res.writeHead(200, {"content-type": "application/octet-stream"});
      file.pipe(res);
    }.bind(this));
  }

  if (req.method === "POST" && bucketName && !fileName) {
    fileName = generateId();

    this.emit("log", "info", "generated file name", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName});
  }

  if ((req.method === "POST" || req.method === "PUT") && bucketName && fileName) {
    var append = req.method === "POST";

    this.emit("log", "info", "asked to write to file", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName, append: append});

    return bucket.store.exists(fileName, function(err, exists) {
      if (err) {
        this.emit("log", "error", "error checking if file exists", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName, err: err.message});
        res.writeHead(500);
        return res.end();
      }

      var newFile = !exists;

      this.emit("log", "info", "beginning to write to file", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName, append: append, newFile: newFile});

      var file = bucket.store.createWriteStream(fileName, {append: append});

      req.pipe(file);

      req.on("end", function() {
        this.emit("log", "info", "finished writing to file", {session: this.sessionId, request: requestId, bucket: bucketName, file: fileName, append: append, newFile: newFile});
        res.writeHead(newFile ? 201 : 200, {location: ["", bucketName, fileName].join("/")});
        res.end();
      }.bind(this));
    }.bind(this));
  }

  this.emit("log", "warn", "unrecognised request", {session: this.sessionId, request: requestId, method: req.method, bucket: bucketName, file: fileName});

  res.writeHead(406);
  res.end();
};

Suckit.createServer = function createServer(options) {
  return new Suckit(options);
};
