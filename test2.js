const cppMsg = require('./cppMsg.js');

let msg = new cppMsg.msg(
    [
        ['foo', 'int32'],
        ['moo', 'int32'],
    ]
);

let msg2 = new cppMsg.msg(
    [
        ['foobar', 'int32'],
        ['moobar', 'int32'],
    ]
);

let my_buff = Buffer.alloc(16, 0);
// let my_buff2 = Buffer.alloc(16, 0);
console.log("my_buff", my_buff);

let buff = msg.encodeMsgToBuff({
    moo: 2,
    foo: 4,
}, my_buff, 8);

let buff2 = msg2.encodeMsgToBuff({
    foobar: 99,
    moobar: 100,
}, my_buff, 0);

console.log("my_buff", buff);

let data = msg.decodeMsg(buff, 8);
let data2 = msg2.decodeMsg(buff2, 0);

console.log("my_buff", buff);
console.log("my_buff2", buff2);

console.log(data);
console.log(data2);