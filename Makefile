all : check test

test : 
	expresso test/*.test.js

check :
	jslint index.js

.PHONY : test