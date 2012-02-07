# Introduction
node-memorystream - this module allow create streams in memory. It's can be used for emulating file streams, as a buffer for incoming data that you want to pipe to another stream, the gap between two data/network streams of variable rates, etc. MemoryStream support read/write states or only read state or only write state. The API is meant to follow node's Stream implementation.

Original module is here git://github.com/ollym/memstream.git was remaked and improved. 

## Installation
If you have npm installed, you can simply type:

	npm install memorystream
	
Or you can clone this repository using the git command:

	git clone git://github.com/JSBizon/node-memorystream.git
	
## Usage
Some examples how to use memorystream module.

#### Basic IO Operation
In this example i illustrate the basic IO operations of the memory stream.

	var MemoryStream = require('memorystream');
	var memStream = new MemoryStream(['Hello',' ']);
	
	var data = '';
	memStream.on('data',function(chunk){
		data += chunk.toString();
	});
	
	memStream.write('World');
	
	memStream.on('end',function(){
		console.log(data);//output 'Hello World!'
	});
	memStream.end('!');
	
#### Piping
In this example i'm piping all data from the memory stream to the process' stdout stream.

	var MemoryStream = require('memorystream');
	var memStream = new MemoryStream();
	memStream.pipe(process.stdout, { end: false });
	
	memStream.write('Hello World!');
	
#### Pumping
In this example i'm pumping all data from the response stream to the memorystream. Memorystream works like buffer.

	var http = require('http'),
		MemoryStream = require('memorystream'),
		util = require('util');

	var options = {
		host: 'google.com'
	};
	var memStream = new MemoryStream(null,{
		readable : false
	});

	var req = http.request(options, function(res) {
		util.pump(res, memStream);
		res.on('end',function(){
			console.log(memStream.toString());
		});
	});
	req.end();

#### Delayed Response
In the example below, we first pause the stream before writing the data to it. The stream is then resumed after 1 second, and the data is written to the console.

	var MemoryStream = require('memorystream');

	var memStream = new MemoryStream('Hello');
	var data = '';
	memStream.on('data',function(chunk){
		data += chunk;
	});
	
	memStream.pause();
	memStream.write('World!');
	
	setTimeout(function() {
		stream.resume();
	}, 1000);

## Documentation
The memory stream adopts all the same methods and events as node's Stream implementation.
Documentation is [available here](http://github.com/JSBizon/node-memorystream/wiki/API/ "Documentation").



	