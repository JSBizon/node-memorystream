var MemoryStream = require('../index.js'),
	should = require('should');

var stream = require('stream'),
	fs = require('fs');

module.exports = {
	"test MemoryStream only read" : function(beforeExit){
		var loaded = false;
		
		var memStream = new MemoryStream(['data1','data2'],{
			writable : false
		});
		
		var data = '';
		memStream.on('data',function(chunk){
			data+=chunk;
		});
		
		memStream.on('end',function(){
			data.should.be.eql('data1data2');
			loaded  = true;
		});
		
		beforeExit(function(){
			loaded.should.be.true;
		});
	},
	
	"test MemoryStream write/read" : function(beforeExit){
		var loaded = false;
		var memStream = new MemoryStream();
		
		var data = '';
		memStream.on('data',function(chunk){
			data+=chunk;
		});
		
		memStream.on('end',function(){
			data.should.be.eql('test1test2test3');
			loaded  = true;
		});
		
		memStream.write('test1');
		setTimeout(function(){
			memStream.write('test2');
			memStream.end('test3');
		},500);
		
		beforeExit(function(){
			loaded.should.be.true;
		});
	},
	
	"test MemoryStream readable/writable" : function(beforeExit){
		var memStream = new MemoryStream(['data'],{
			writable : false
		});
		should.throws(function(){
			memStream.write('test');
		});
		
		memStream = new MemoryStream('data',{
			readable : false
		});
		var data = '';
		memStream.on('data',function(chunk){
			data += chunk;
		});
		memStream.write('test');
		
		beforeExit(function(){
			data.should.be.eql('');
		});
	},
	
	"test MemoryStream buffering" : function(beforeExit){
		var memStream = new MemoryStream();
		memStream.readable = false;
		
		memStream.write('data1');
		memStream.write('data2');
		
		beforeExit(function(){
			memStream.setEncoding('utf8');
			memStream.toString().should.be.eql('data1data2');
		});
	},
	
	"test MemoryStream pipe" : function(beforeExit){
		var loaded = false;
		
		var srcStream = new MemoryStream('data1');
		var dstStream = new MemoryStream();
		
		srcStream.pipe(dstStream);
		
		var data = '';
		dstStream.on('data',function(chunk){
			data+=chunk;
		});
		
		dstStream.on('end',function(){
			data.should.be.eql('data1data2data3');
			loaded = true;
		});
		
		srcStream.write('data2');
		
		setTimeout(function(){
			srcStream.write('data3');
			srcStream.end();
		},500);
		
		beforeExit(function(){
			loaded.should.be.true;
		});
	},
	
	"test MemoryStream bufsize" : function(beforeExit){
		var memStream = new MemoryStream('data1',{
			readable : false,
			maxbufsize : 10
		});
		
		memStream.write('data2').should.be.true;
		memStream.write('data3').should.be.false;
	},
	
	"test MemoryStream pause/resume" : function(beforeExit){
		var memStream = new MemoryStream('data1');
		memStream.pause();
		var data = '';
		memStream.on('data',function(chunk){
			data += chunk;
		});
		memStream.write('data2');
		
		setTimeout(function(){
			data.should.be.eql('');
			memStream.resume();
		},500);
		
		beforeExit(function(){
			data.should.be.eql('data1data2');
		});
	},
	
	"test MemoryStream setEncoding" : function(beforeExit){
		var memStream = new MemoryStream('data');
		memStream.on('data',function(chunk){
			chunk.should.be.instanceof(Buffer);
		});
		
		var memStream2 = new MemoryStream('data');
		memStream2.setEncoding('utf8');
		memStream2.on('data',function(chunk){
			chunk.should.be.a('string');
		});
	},
	
	"test MemoryStream destroy" : function(beforeExit){
		var memStream = new MemoryStream('data1');
		memStream.write('data2').should.be.true;
		
		memStream.destroy();
		should.throws(function(){
			memStream.write('data3');
		});
	},
	
	"test MemoryStream destroySoon" : function(beforeExit){
		var memStream = new MemoryStream('data1');
		var data = '';
		memStream.on('data', function(chunk){
			data += chunk;
		});
		
		memStream.write('data2').should.be.true;
		memStream.write('data3').should.be.true;
		
		memStream.on('end', function(){
			data.should.equal('data1data2data3');
		});
		
		memStream.destroySoon();
		should.throws(function(){
			memStream.write('data4');
		});
	},
	
	"test MemoryStream createReadStream" : function(beforeExit){
		var done = false;
		var memStream = MemoryStream.createReadStream(['hello',' ','world']);
		var data = '';
		
		memStream.on('data', function(chunk){
			data += chunk;
		});
		
		memStream.on('end', function(){
			data.should.equal('hello world');
			done = true;
		});
		beforeExit(function(){
			done.should.be.true;
		});
	},
	
	"test MemoryStream createWriteStream" : function(beforeExit){
		var memStream = MemoryStream.createWriteStream();
		memStream.write('hello');
		memStream.write(' ');
		memStream.write('world');
		memStream.end();
		
		memStream.toString().should.equal('hello world');
	},
	
	"test MemoryStream frequence" : function(beforeExit){
		var memStream = MemoryStream.createReadStream(['hello',' ','world'],{frequence : 500});
		var last = Date.now();
		var done = false;
		var data = '';
		memStream.on('data',function(chunk){
			var now = Date.now();	
			((now - last) > 400).should.be.ok;
			last = now;
			data += chunk;
		});
		
		memStream.on('end', function(){
			done = true;
		});
		
		
		beforeExit(function(){
			done.should.be.true;
		});
	}
};