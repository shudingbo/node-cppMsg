# Binary data structure transformation for JavaScript

## Installation

Using npm:

    $ npm install cppmsg

To run the tests:

    $ node test.js

## Description
You can use this module, parse binary data from the c + +, can also be generate binary data(from json object) that c/c++ can phrase.
This module provides follow function:
  - Encode json data to binary data
  - Decode binary data to json
  - support more data type: int8/16/32/64, uint8/16/32, float,double,bool,string
  - support msg nested;
  
  You can phrase C++ binary data sturct from network to json.
  Note: c/c++ data struct must one bit algin.  

## cppMsg.msg constructor overloads
- `new cppMsg.msg()` create empty cppMsg;
- `new cppMsg.msg( ds )` ds is data struct define Array
- `new cppMsg.msg( ds, data)` ds is data struct define Array. data(optional) is init json data.
- `new cppMsg.msg( ds, null, opts)` ds is data struct define Array. data(optional) is init json data. 
  * opts, {useIconv: true } ,useIconv `boolean`,  maybe use iconv-lite convert code

## cppMsg.msg methods
- encodeMsg( data ) : json data object;
- encodeMsg2( data ) : json data object( use msg internal buffer, return internal buffer ); 
- decodeMsg( buf )  : decode Buffer to json data object; 

next methods using stream mode:
- push_uint8
- push_int8
- push_uint16
- push_int16
- push_uint32
- push_int32
- push_string
- push_char
- encode( data ) : data is json data stream.

## Examples

### Normal Mode
Assume this for all examples below

C++ Code:
```c++
//C++ struct define Must one byte algin
struct head{
	int mainType;
    int subType;
};

struct msg{
	int reg;
    int chkCode;
    int iType;
    bool bMonitor;
    char workPath[10];
    unsigned int processID;
    struct head testObj;
    long long testin64;
	float floatArray3[3];
};
```
Nodejs code:
```js
	var cppMsg = require('./cppMsg.js');

	var msg_def = {
		msgHead:[
					['mainType','int32'],
					['subType', 'int32']
				]
	};


	var msg = new cppMsg.msg(
		[
			['reg','int32'],
			['chkCode','int32'],
			['iType','int32'],
			['bMonitor', 'bool'],
			['workPath','string',10],
			['processID','uint32'],
			['testObj','object', msg_def.msgHead], // nested other
			['testint64','int64'],
			['floatArray3', 'float', , , 3]
		],null, {useIconv: false}
		);

	var buff = msg.encodeMsg2( {
			reg     : 2,
			chkCode : 0,
			iType   : 2,
			bMonitor : false,
			workPath : 'no 你 work',
			processID : 1234,
			testObj  :{
				mainType : 0x01020304,
				subType  : 0x0A0B0C0D
			},
			testint64 : 0xCDEF,
			floatArray3: [1.1, 2.2, 9.7]
		}  );

	console.log( buff );

	var data = msg.decodeMsg( buff );
	console.log( data );
```

### stream mode
```js
	msg.push_int32(2);  // reg
	msg.push_int32(0);  // chkCode
	msg.push_int32(2);  // iType

	msg.push_uint8(0);  // bMonitor
	msg.push_string('no worker path',10);
	msg.push_string('no worker path',20);
	msg.push_string('brnn-20',20);
	msg.push_uint32( 1234 ); // processID

	console.log( msg.encode());
```
## Changelog
### 1.2.0
 1. add method `encodeMsg2`, Improve performance 1x
 1. optimize performance encodeMsg
 1. optimize performance decodeMsg, Improve performance 1x
 1. change msg construct add params `opts`
	* opts, `{useIconv: true }`
		* useIconv, `boolean`, true(default): use iconv-lite convert code.( false, __Improve performance__)
 1. Default string code,change to `utf8`

### 1.1.0
 1. Using ES6 syntax
 2. optimize performance encodeMsg

### 1.0.3
 1. fix int64 decode/encode error( Works only for numbers <= Number.MAX_SAFE_INTEGER ).
 2. fix object decode error.
### 1.0.2
 1. merge darnold79 change,add array support.

### 1.0.1
 1. string type add encode support(using iconv-lite). 

### 1.0.0
 1. init.
   
   
## LICENSE

The MIT License (MIT)

Copyright (c) 2017 Shudingbo
Copyright (c) 2017 darnold79 (node-cppMsg-dynamic)
