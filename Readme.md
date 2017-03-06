# Binary data structure transformation for JavaScript
## Forked from node-cppMsg because it lacked support for arrays.

## Installation

Using npm:

    $ npm install cppMsg-dynamic

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
- `new cppMsg.msg() create empty cppMsg;
- `new cppMsg.msg( ds ) ds is data struct define Array
- `new cppMsg.msg( ds, data) ds is data struct define Array. data(optional) is init json data. 

## cppMsg.msg methods
- encodeMsg( data ) : json data object;
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
		]
		);

	var buff = msg.encodeMsg( {
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
### 1.0.0
   1. forked from node-cppMsg and added array support.
  
   
## LICENSE

The MIT License (MIT)

Copyright (c) 2016 Shudingbo (node-cppMsg)
Copyright (c) 2017 darnold79 (node-cppMsg-dynamic)


