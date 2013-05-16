Suckit
======

Suck up a data stream and store it in LevelDB.

Overview
--------

Suckit exposes LevelDB (via [level-store](https://github.com/juliangruber/level-store))
over HTTP. It's really that simple.

Super Quickstart
----------------

In one terminal:

```
➜  suckit git:(master) mkdir data
➜  suckit git:(master) suckit 3000 ./data
["2013-05-16T02:53:33.537Z","INFO","started",{"session":"1368672813532-41998","dataPath":"/Users/conrad/work/seriousbusiness/suckit/data","port":3000}]
["2013-05-16T02:53:59.619Z","INFO","request",{"session":"1368672813532-41998","request":"1368672839619-66909","method":"POST","url":"/my-bucket/my-file"}]
["2013-05-16T02:53:59.622Z","INFO","opening bucket",{"session":"1368672813532-41998","name":"my-bucket"}]
["2013-05-16T02:53:59.624Z","INFO","asked to write to file",{"session":"1368672813532-41998","request":"1368672839619-66909","bucket":"my-bucket","file":"my-file","append":true}]
["2013-05-16T02:53:59.712Z","INFO","beginning to write to file",{"session":"1368672813532-41998","request":"1368672839619-66909","bucket":"my-bucket","file":"my-file","append":true,"newFile":true}]
["2013-05-16T02:53:59.716Z","INFO","finished writing to file",{"session":"1368672813532-41998","request":"1368672839619-66909","bucket":"my-bucket","file":"my-file","append":true,"newFile":true}]
```

In another:

```
➜  suckit git:(master) curl -v -X POST http://127.0.0.1:3000/my-bucket/my-file -d 'this is some content!'
* About to connect() to 127.0.0.1 port 3000 (#0)
*   Trying 127.0.0.1... connected
* Connected to 127.0.0.1 (127.0.0.1) port 3000 (#0)
> POST /my-bucket/my-file HTTP/1.1
> User-Agent: curl/7.21.4 (universal-apple-darwin11.0) libcurl/7.21.4 OpenSSL/0.9.8r zlib/1.2.5
> Host: 127.0.0.1:3000
> Accept: */*
> Content-Length: 21
> Content-Type: application/x-www-form-urlencoded
>
< HTTP/1.1 201 Created
< location: /my-bucket/my-file
< Date: Thu, 16 May 2013 02:53:59 GMT
< Connection: keep-alive
< Transfer-Encoding: chunked
<
* Connection #0 to host 127.0.0.1 left intact
* Closing connection #0
```

Installation
------------

Available via [npm](http://npmjs.org/):

> $ npm install suckit -g

Or via git:

> $ npm install git://github.com/deoxxa/suckit.git -g

License
-------

3-clause BSD. A copy is included with the source.

Contact
-------

* GitHub ([deoxxa](http://github.com/deoxxa))
* Twitter ([@deoxxa](http://twitter.com/deoxxa))
* ADN ([@deoxxa](https://alpha.app.net/deoxxa))
* Email ([deoxxa@fknsrs.biz](mailto:deoxxa@fknsrs.biz))
