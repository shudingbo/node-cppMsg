/**
 * Created by sdb on 2/25/16.
 */

var cppMsg = require('./cppMsg.js');

var msg_def = {
    msgHead: [
        ['mainType', 'int32'],
        ['subType', 'int32']
    ]
};


var msg = new cppMsg.msg(
    [
        ['reg', 'int32'],
        ['chkCode', 'int32'],
        ['iType', 'int32'],
        ['bMonitor', 'bool'],
        ['workPath', 'string', 10, 'gb2312'],
        ['processID', 'uint32'],
        ['testObj', 'object', msg_def.msgHead],
        ['testint64', 'int64'],
        ['floatArray3', 'float', , , 3],
        ['alert', 'string', 10, 'gb2312', 2]
    ]
);
//msg.push_int32(2);  // reg
//msg.push_int32(0);  // chkCode
//msg.push_int32(2);  // iType

//msg.push_uint8(0);  // bMonitor
//msg.push_string('no worker path',256);
//msg.push_string('no worker path',256);
//msg.push_string('no worker path',10);
//msg.push_string('no worker path',20);
//msg.push_string('brnn-20',20);
//msg.push_uint32( 1234 ); // processID
//msg.push_uint32( 123 ); // nameID
//msg.push_uint32( 12 ); // roomID
//msg.push_uint32( 1 ); // ip
//msg.push_uint32( 14 ); // port
//msg.push_uint32( 12340 ); // uParentIP

var buff = msg.encodeMsg({
    reg: 2,
    chkCode: 0,
    iType: 2,
    bMonitor: false,
    workPath: 'no 你 work',
    processID: 1234,

    testObj: {
        mainType: 0x01020304,
        subType: 0x0A0B0C0D
    },

    testint64: 8888321499136,
    floatArray3: [1.1, 2.2, 9.7],
    alert: ['quick fox', 'lazy dog']
});

console.log(buff);

// var foo = 1;
// if(!Array.isArray(foo)) foo = [foo];
// foo.map(console.log);

var data = msg.decodeMsg(buff);
console.log(data);