var stream = require('stream'),
	sys = require('sys'),
	util = require('util');

/**
 * Create instance of MemoryStream.
 * 
 * @constructor
 * @param ondata
 * @returns
 */

function MemoryStream(data, options) {
	
	stream.Stream.call(this);
	
	if(data && ! Array.isArray(data))
		data = [data];
	
	this.queue = data || [];
	this.paused = false;
	this.reachmaxbuf = false;
	
	options = options || {};
	
	this.readable = options.hasOwnProperty('readable') ? options.readable : true;
	this.writable = options.hasOwnProperty('writable') ? options.writable : true;
	this.maxbufsize = options.hasOwnProperty('maxbufsize') ? options.maxbufsize : null;
	this.bufoverflow = options.hasOwnProperty('bufoveflow') ? options.bufoveflow : null;
	
	var self = this;
	process.nextTick(function(){
		self._next();
	});
}
module.exports = MemoryStream;

util.inherits(MemoryStream, stream.Stream);


MemoryStream.prototype._next = function() {
	var self = this;
	function next(){
		if( self.flush() && self.readable)
				process.nextTick(next);
	}
	next();
};

MemoryStream.prototype.pipe = function(destination, options) {
	
	var pump = sys.pump || util.pump;
	
	pump(this, destination);
};

MemoryStream.prototype.pause = function() {
		
	this.paused = true;
};
	
MemoryStream.prototype.resume = function() {
		
	this.paused = false;
		
	this._next();
};
	
MemoryStream.prototype.end = function(chunk, encoding) {
	
	if (typeof chunk !== 'undefined') {
		
		this.write(chunk, encoding);
	}	
	
	this.writable = false;
	
	if (this.queue.length === 0) {
		
		this.readable = false;
	}
	
	this.emit('end');
};

MemoryStream.prototype._getQueueSize = function() {
	var queuesize = 0;
	for(var i = 0; i < this.queue.length; i++ ){
		queuesize += Array.isArray(this.queue[i]) ? this.queue[i][0].length : this.queue[i].length;
	}
	return queuesize;
};

MemoryStream.prototype.flush = function() {

	if ( ! this.paused && this.readable && this.queue.length > 0) {
		var data = this.queue.shift();
		var cb;
		
		if(Array.isArray(data)){
			cb = data[1];
			data = data[0];
		}
		
		this.emit('data', data);
		
		if(cb) cb(null);
		
		if(this.reachmaxbuf && this.maxbufsize >= this._getQueueSize()){
			this.reachmaxbuf = false;
			this.emit('drain');
		}
		
		return true;
	}
	
	if(!this.writable && !this.queue.length){
		this.emit('end');
	}
	
	return false;
};
	
MemoryStream.prototype.write = function(chunk, encoding, callback) {
	
	if ( ! this.writable) {
	
		throw new Error('The memory stream is no longer writable.');
	}
	
	if (typeof encoding === 'function') {
		
		callback = encoding;
		encoding = undefined;
	}
	
	if ( ! chunk instanceof Buffer) {
		
		chunk = new Buffer(chunk, encoding);
	}
	
	var queuesize = chunk.length;
	if(this.maxbufsize || this.bufoverflow){
		queuesize += this._getQueueSize();
		if(this.bufoveflow && queuesize > this.bufoveflow){
			this.emit('error',"Buffer overflowed (" + this.bufoverflow + "/"+ queuesize + ")");
			return;
		}
	}
	
	if(typeof callback === 'function'){
		this.queue.push([chunk,callback]);
	}else{
		this.queue.push(chunk);
	}
	
	this._next();
	
	if(this.maxbufsize && queuesize > this.maxbufsize){
		this.reachmaxbuf = true;
		return false;
	}
	
	return true;
};

MemoryStream.prototype.destroy = function() {
	
	this.end();
	
	this.queue = [];
	
	this.readable = false;
	this.writable = false;
};
