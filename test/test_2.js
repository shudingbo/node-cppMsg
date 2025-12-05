
const cppMsg = require('../cppMsg.js');
const {test} = require('node:test');
const assert = require('node:assert/strict');


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
const testData = {
    moo: 2,
    foo: 4,
};

const testData2 = {
    foobar: 0x63,
    moobar: 0xff,
};

let buff = msg.encodeMsgToBuff(testData, my_buff, 8);
let buff2 = msg2.encodeMsgToBuff(testData2, my_buff, 0);

test('test encodeMsgToBuff', () => {
    
    let data = msg.decodeMsg(buff, 8);
    assert.deepStrictEqual(data, testData);
});

test('test encodeMsgToBuff', () => {
    
    let data2 = msg2.decodeMsg(buff2, 0);
    assert.deepStrictEqual(data2, testData2);
});
