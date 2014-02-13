var stream = require('stream'),
    util = require('util');

function MemoryStream(data, options) {
	
	stream.Stream.call(this);
	var self = this;
	
	this.queue = [];
	
	if(data){
		if(!Array.isArray(data)){
			data = [data];
		}
		
		data.forEach(function(chunk){
			if ( ! (chunk instanceof Buffer)) {
				chunk = new Buffer(chunk);
			}
			
			self.queue.push(chunk);
		});
	}
	
	this.paused = false;
	this.reachmaxbuf = false;
	
	options = options || {};
	
	this.readableVal = options.hasOwnProperty('readable') ? options.readable : true;
	
	this.__defineGetter__("readable", function(){
		return self.readableVal;
	});
	
	this.__defineSetter__("readable", function(val){
		self.readableVal = val;
		if(val){
			self._next();
		}
	});
	
	this.writable = options.hasOwnProperty('writable') ? options.writable : true;
	this.maxbufsize = options.hasOwnProperty('maxbufsize') ? options.maxbufsize : null;
	this.bufoverflow = options.hasOwnProperty('bufoveflow') ? options.bufoveflow : null;
	this.frequence = options.hasOwnProperty('frequence') ? options.frequence : null;
	
	process.nextTick(function(){
		self._next();
	});
}
module.exports = MemoryStream;

util.inherits(MemoryStream, stream.Stream);

MemoryStream.createReadStream = function(data, options) {
	options = options || {};
	options.readable = true;
	options.writable = false;
	
	return new MemoryStream(data,options);
};

MemoryStream.createWriteStream = function(data, options){
	options = options || {};
	options.readable = false;
	options.writable = true;
	
	return new MemoryStream(data,options);
};


MemoryStream.prototype._next = function() {
	var self = this;
	function next(){
		function dodo(){
			if( self.flush() && self.readable){
				process.nextTick(next);
			}
		}
		if(self.frequence){
			setTimeout(dodo,self.frequence);
		}else{
			dodo();
		}
	}
	if( ! this.paused){
		next();
	}
};

MemoryStream.prototype.toString = MemoryStream.prototype.getAll = function() {
	var self = this;
	var ret = '';
	this.queue.forEach(function(data){
		if (self._decoder) {
			var string = self._decoder.write(data);
			if (string.length){
				ret += string;
			}
		} else {
			ret+=data;
		}
	});
	return ret;
};

MemoryStream.prototype.toBuffer = function () {
    var buffer = new Buffer(this._getQueueSize());
    var currentOffset = 0;

    this.queue.forEach(function (data) {
        data.copy(buffer, currentOffset);
        currentOffset += data.length;
    });

    return buffer;
};

MemoryStream.prototype.setEncoding = function(encoding) {
	var StringDecoder = require('string_decoder').StringDecoder;
	this._decoder = new StringDecoder(encoding);
};


MemoryStream.prototype.pause = function() {
	if(this.readable){	
		this.paused = true;
	}
};
	
MemoryStream.prototype.resume = function() {
	if(this.readable){	
		this.paused = false;
		
		this._next();
	}
};
	
MemoryStream.prototype.end = function(chunk, encoding) {
	
	if (typeof chunk !== 'undefined') {
		
		this.write(chunk, encoding);
	}	
	
	this.writable = false;
	
	if (this.queue.length === 0) {
		
		this.readable = false;
	}
	
	if (!this.queue.length) {
		this._emitEnd();
	}
};

MemoryStream.prototype._emitEnd = function(){
	if(! this._ended){
		this._ended = true;
		this.emit('end');
	}
};


MemoryStream.prototype._getQueueSize = function() {
	var queuesize = 0, i = 0;
	for(i = 0; i < this.queue.length; i++ ){
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
		
		if (this._decoder) {
			var string = this._decoder.write(data);
			if (string.length){
				this.emit('data', string);
			}
		} else {
			this.emit('data', data);
		}
		
		if(cb){
			cb(null);
		}
		
		if(this.reachmaxbuf && this.maxbufsize >= this._getQueueSize()){
			this.reachmaxbuf = false;
			this.emit('drain');
		}
		
		return true;
	}
	
	if(!this.writable && !this.queue.length){
		this._emitEnd();
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
	
	if ( ! (chunk instanceof Buffer)) {
		
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


MemoryStream.prototype.destroySoon = function() {
	this.writable = false;
	
	this._destroy = true;
	
	if ( ! this.readable || this.queue.length === 0) {
		this.destroy();
	}
	
};
