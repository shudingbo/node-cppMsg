/**
 * Created by sdb on 2/25/16.
 */

const cppMsg = require('./cppMsg.js');
let testCnt = 10000000;
let testEncode = true;
let testDecode = true;

console.log('start Test...');

let msg_def = {
    msgHead: [
        ['mainType', 'int32'],
        ['subType', 'int32']
    ]
};

let sTime = Date.now();
let msgTest = new cppMsg.msg(
    [
        ['reg', 'int32'],
        ['chkCode', 'int32'],
        ['iType', 'int32'],
        ['bMonitor', 'bool'],
        ['workPath', 'string', 32],
        ['processID', 'uint32'],
        ['testObj', 'object', msg_def.msgHead],
        ['testint64', 'int64'],
    //    ['floatArray3', 'float', , , 3],
        ['alert', 'string', 10, 'gb2312', 2]
    ], null, {useIconv: false}
);


console.log(`parse Test: consume time ${Date.now() - sTime} ms`);

let testObj = {
    reg: testCnt,
    chkCode: 0,
    iType: 2,
    bMonitor: false,
    workPath: 'no 你好 work',
    processID: 1234,

    testObj: {
        mainType: 0x01020304,
        subType: 0x0A0B0C0D
    },

    testint64: 8888321499136,
    //floatArray3: [1.1, 2.2, 9.7],
    alert: ['quick fox', 'lazy dog']
};

let buffTest = msgTest.encodeMsg( testObj );
let dataTestOut = msgTest.decodeMsg(buffTest);
if(JSON.stringify(testObj) === JSON.stringify(dataTestOut)){
    console.log('encode is equ? ', true);
} else {
    console.log('encode not equ', dataTestOut);
}

if( msgTest.encodeMsg2 ) {
    let buffTest = msgTest.encodeMsg2( testObj );
    let dataTestOut = msgTest.decodeMsg(buffTest);
    if(JSON.stringify(testObj) === JSON.stringify(dataTestOut)){
        console.log('encode2 is equ? ', true);
    } else {
        console.log('encode2 not equ', dataTestOut);
    }

}

let msg = new cppMsg.msg(
    [
        ['reg', 'int32'],
        ['chkCode', 'int32'],
        ['iType', 'int32'],
        ['bMonitor', 'bool'],
        ['workPath', 'string', 32, 'gb2312'],
        ['processID', 'uint32'],
        ['testObj', 'object', msg_def.msgHead],
        ['testint64', 'int64'],
        ['floatArray3', 'float', , , 3],
        ['alert', 'string', 10, 'gb2312', 2]
    ],
    null, {useIconv: false}
);

if( testEncode === true ) {
    sTime = Date.now();
    for( let i=0;i<testCnt;i++ )
    {
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

        let buff = msg.encodeMsg({
            reg: testCnt,
            chkCode: 0,
            iType: 2,
            bMonitor: false,
            workPath: 'no 你好 work',
            processID: Math.round(Math.random() * 10000),
            testObj: {
                mainType: 0x01020304,
                subType: 0x0A0B0C0D
            },

            testint64: 8888321499136,
            floatArray3: [1.1, 2.2, 9.7],
            alert: ['quick fox', 'lazy dog']
        });

        //let data = msg.decodeMsg(buff);
        //console.log( data );
    }
    console.log(`encode ${testCnt} Test: consume time ${Date.now() - sTime} ms`);

    if( msg.encodeMsg2 ){
        sTime = Date.now();
        for( let i=0;i<testCnt;i++ )
        {
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

            let buff = msg.encodeMsg2({
                reg: testCnt,
                chkCode: 0,
                iType: 2,
                bMonitor: false,
                workPath: 'no 你好 work',
                processID: Math.round(Math.random() * 10000),

                testObj: {
                    mainType: 0x01020304,
                    subType: 0x0A0B0C0D
                },

                testint64: 8888321499136,
                floatArray3: [1.1, 2.2, 9.7],
                alert: ['quick fox', 'lazy dog']
            });
        }
        console.log(`encode2 ${testCnt} Test: consume time ${Date.now() - sTime} ms`);
    }
}

if( testDecode ){

    let buff = msg.encodeMsg({
        reg: testCnt,
        chkCode: 0,
        iType: 2,
        bMonitor: false,
        workPath: 'no 你好 work',
        processID: Math.round(Math.random() * 10000),
        testObj: {
            mainType: 0x01020304,
            subType: 0x0A0B0C0D
        },

        testint64: 8888321499136,
        floatArray3: [1.1, 2.2, 9.7],
        alert: ['quick fox', 'lazy dog']
    });

    sTime = Date.now();
    for( let i=0;i<testCnt;i++ )
    {
        // let foo = 1;
        // if(!Array.isArray(foo)) foo = [foo];
        // foo.map(console.log);

        let data = msg.decodeMsg(buff);
        //console.log(data);
    }
    console.log(`decode ${testCnt} Test: consume time ${Date.now() - sTime} ms`);
}