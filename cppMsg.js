/**
 * Created by shudingbo on 2/25/16.
 * This module using encode/decode c/c++ Binary data structure data struct as json;
 * support message nested.
 * support data type:
            int8
            uint8
            int16
            uint16
            int32
            uint32
            int64
            float
            double
            bool
            string
            object
 */


var cppMsg = module.exports;



///////////// cppString defined
function CppString(str,len){

    this.str = "";
    if(str.length > len-1){
        this.str = str.slice(0,len-1);
    }else{
        this.str = str;
    }
    this.str += "\0";

    this.byteLen = len;
    this.buffer = new Buffer(this.byteLen);
    this.length = this.buffer.length;

    this.process();
}

CppString.prototype.toString = function(){
    return this.buffer.toString();
};


CppString.prototype.getLength = function(){
    return this.buffer.length;
};

CppString.prototype.process = function(){
    this.buffer.fill(0);
    this.buffer.write(this.str);
    /*for(var i=this.str.length;i < this.buffer.length;i++){
     this.buffer[i] = 0x00;
     }*/
};




function CppNum(num,intType){

    this.num = num;

    this.buffer = null;
    this.value = null;
    this.numArray = null;
    this.byteLen = null;
    this.intType = intType;

    switch(this.intType){
        case "uint8":
            this.numArray = new Uint8Array([num]);
            this.byteLen = 1;
            break;
        case "uint16":
            this.numArray = new Uint16Array([num]);
            this.byteLen = 2;
            break;
        case "uint32":
            this.numArray = new Uint32Array([num]);
            this.byteLen = 4;
            break;
        case "int8":
            this.numArray = new Int8Array([num]);
            this.byteLen = 1;
            break;
        case "int16":
            this.numArray = new Int16Array([num]);
            this.byteLen = 2;
            break;
        case "int32":
            this.numArray = new Int32Array([num]);
            this.byteLen = 4;
            break;
        default:
            break;
    }
    this.process();
}


CppNum.prototype.process = function(){

    this.value = this.numArray[0];
    this.buffer = new Buffer(this.byteLen);
    this.buffer.fill(0);//clear all the buffer

    switch(this.intType){
        case "uint8"://uint8
            this.buffer.writeUInt8(this.value,0);//little endian （按小端对齐）
            break;
        case "uint16"://uint16
            this.buffer.writeUInt16LE(this.value,0);//little endian （按小端对齐）
            break;
        case "uint32"://uint32
            this.buffer.writeUInt32LE(this.value,0);//little endian （按小端对齐）
            break;
        case "int8"://int8
            this.buffer.writeInt8(this.value,0);//little endian （按小端对齐）
            break;
        case "int16"://int16
            this.buffer.writeInt16LE(this.value,0);//little endian （按小端对齐）
            break;
        case "int32"://int32
            this.buffer.writeInt32LE(this.value,0);//little endian （按小端对齐）
            break;
        default:break;
    }
};


function isArray( obj ){
    return (Object.prototype.toString.call(obj) === '[object Array]');
}

function isObject( obj ){
    return (Object.prototype.toString.call(obj) === '[object Object]');
}


// 基本数据类型定义
var DataType={
    int8    : 0,
    uint8   : 1,
    int16   : 2,
    uint16  : 3,
    int32   : 4,
    uint32  : 5,
    int64   : 6,
    float   : 7,
    double  : 8,
    bool    : 9,
    string  : 10,
    object  : 11
};

var DataTypeLen = [1,1,2,2,4,4,8,4,8,1,0];

/**
ds = [{<name>:[<type>,[len]]}]
    [ 
        [ 'reg','int32'],
        [ 'workPath','string',250 },
    ]

*/
cppMsg.msg = function( ds, data){
    this.listBuffer = [];  // 数据 Buffer
    this.length = 0;       // 已放入Buffer的数据长度

    this.dsEncode = {};  // 编码使用结构 { name:[<dataType>,<offset>,[len]] }
    this.dsDecode = [];  // 解码使用的结构 [<offset>,<datalen>,<dataType>,<name>]
    this.dsLen    = 0;

    var ret = this.phraseDS(ds);
    if( ret !== false ){
        this.dsLen = ret[0];
        this.dsEncode = ret[1];
        this.dsDecode = ret[2];
    }


    //console.log( this.dsEncode);
    //console.log( this.dsDecode);
    //console.log( this.dsLen );


    if( isObject(data) ){
        this.encodeMsg( data );
    }
};

cppMsg.msg.prototype.phraseDS = function( ds ){
    if( isArray( ds ) )
    {
        var len    = ds.length;
        var offset = 0;    
        var i = 0;
        var it = null;
        var dataType = DataType.int8;
        var dataLen  = 1;

        var dsLen = 0;
        var dsEncode = {};  // 编码使用结构 { name:[<dataType>,<offset>,[len]] }
        var dsDecode = [];  // 解码使用的结构 [<offset>,<datalen>,<dataType>,<name>]

        for( i=0;i<len; i++ ){
            var it = ds[i];
            
            if( isArray(it) && it.length >=2 ){
                switch( it[1] ){
                    case 'int8' :   dataType = DataType.int8;   break;
                    case 'uint8':   dataType = DataType.uint8;  break;
                    case 'int16':   dataType = DataType.int16;  break;
                    case 'uint16':  dataType = DataType.uint16; break;
                    case 'int32':   dataType = DataType.int32;  break;
                    case 'uint32':  dataType = DataType.uint32; break;
                    case 'int64':   dataType = DataType.int64;  break;
                    case 'float':   dataType = DataType.float;  break;
                    case 'double':  dataType = DataType.double;  break;
                    case 'bool' :   dataType = DataType.bool;  break;
                    case 'string' :   dataType = DataType.string;  break;
                    case 'object' : dataType = DataType.object; break;
                    default: dataType = -1; break;
                }

                var enAddin = null;
                var deAddin = null;
                if( dataType === -1 ){
                    throw Error(' cppType.msg ds phrase error ');
                }else{
                    if( dataType === DataType.string ){  // 字符串
                        if( it.length !== 3 ) {
                            throw Error(' cppType.msg ds phrase error: [string] ');
                        }
                        dataLen = parseInt( it[2] );
                    }
                    else if( dataType === DataType.object ){ // 对象
                        dataLen = -1;
                        var ret = this.phraseDS( it[2]); 
                        if( ret !== false ){
                            //console.log('ret-------- testObj', ret );
                            dataLen = ret[0];
                            enAddin = ret[1];
                            deAddin = ret[2];
                        }
                    }
                    else{
                        dataLen = DataTypeLen[ dataType ];
                    }
                }


                dsEncode[ it[0] ] = [ dataType, offset, dataLen,enAddin ];
                dsDecode.push( [ offset, dataLen, dataType, it[0],deAddin ]);

                offset += dataLen;
                dsLen += dataLen;
            }else{
                throw Error('data struct parseError!');
            }
        }

        return [dsLen,dsEncode,dsDecode];
    }
    else{
        return false;
    }
};


cppMsg.msg.prototype.push_uint8 = function(value){
    var uint8Value = new CppNum(value,"uint8");
    this.listBuffer.push(uint8Value.buffer);
    this.length += uint8Value.byteLen;
};

cppMsg.msg.prototype.push_int8 = function(value){
    var int8Value = new CppNum(value,"int8");
    this.listBuffer.push(int8Value.buffer);
    this.length += int8Value.byteLen;
};

cppMsg.msg.prototype.push_uint16 = function(value){
    var uint16Value = new CppNum(value,"uint16");
    this.listBuffer.push(uint16Value.buffer);
    this.length += uint16Value.byteLen;
};

cppMsg.msg.prototype.push_int16 = function(value){
    var int16Value = new CppNum(value,"int16");
    this.listBuffer.push(int16Value.buffer);
    this.length += int16Value.byteLen;
};

cppMsg.msg.prototype.push_uint32 = function(value){
    var uint32Value = new CppNum(value,"uint32");
    this.listBuffer.push(uint32Value.buffer);
    this.length += uint32Value.byteLen;
};

cppMsg.msg.prototype.push_int32 = function(value){
    var int32Value = new CppNum(value,"int32");
    this.listBuffer.push(int32Value.buffer);
    this.length += int32Value.byteLen;
};

cppMsg.msg.prototype.push_string = function(strValue,len){
    var strValue1 = new CppString(strValue,len);
    this.listBuffer.push(strValue1.buffer);
    this.length += strValue1.byteLen;
};

cppMsg.msg.prototype.push_char = function(strChar){
    var strValue = new CppString(strValue,2);
    this.listBuffer.push(strValue.buffer);
    this.length += strValue.byteLen;
};

cppMsg.msg.prototype.encode = function( data ){

    if( isObject( data) ){
        var msgBuf = this.encodeMsg( data);
        this.listBuffer.push(msgBuf);
        this.length += this.listBuffer.length;
    }

    if(this.listBuffer.length > 0){
        return Buffer.concat(this.listBuffer);
    }

    return false;
};


/** decode message as object
*/
cppMsg.msg.prototype.decodeMsg = function( buf ){
    return decodeObject( buf, 0, this.dsDecode );
};


/** encode message as Buffer */
cppMsg.msg.prototype.encodeMsg = function( data ) {
    return encodeObject( data, this.dsLen, this.dsEncode );
}

function decodeObject(buf, offset,dsDecode){
    var data = {};  
    // [<offset>,<datalen>,<dataType>,<name>]
    var len = dsDecode.length;
    var i = 0,off = 0;
    var info = null;
    for( i=0; i<len ;i++ ){
        info = dsDecode[i];
        off = info[0] + offset;
        key = info[3];
        switch( info[2] ){
            case DataType.int8:
                data[key]  = buf.readInt8( off);
            break;
            case DataType.int16:
                data[key]  = buf.readInt16LE( off);
            break;
            case DataType.int32:
                data[key]  = buf.readInt32LE( off);
            break;
            case DataType.int64:
            {
                var high = buf.readUInt32LE( off);
                var low  = buf.readUInt32LE( off+4);
                data[key]  = (high << 8) | low;
            }
            break;
            case DataType.uint8:
                data[key]  = buf.readUInt8( off);
            break;
            case DataType.uint16:
                data[key]  = buf.readUInt16LE( off);
            break;
            case DataType.uint32:
                data[key]  = buf.readUInt32LE( off);
            break;
            case DataType.float:
                data[key]  = buf.readFloatLE( off);
            break;
            case DataType.double:
                data[key]  = buf.readDoubleLE( off);
            break;
            case DataType.bool:
            {
                data[key]  = (buf.readUInt8( off)!== 0);
            }
            break;
            case DataType.string:
            {
                data[key]  = buf.toString(undefined, off, off+info[1]-1 );
            }
            break;
            case DataType.object:
            {
                data[key] = decodeObject(buf, off, info[4] );
            }
            break;
        }
    }

    return data;
}


function encodeObject( data, dsLen, dsEncode ){
    var key = '';
    var keyInfo = null;

    var msgBuf = new Buffer( dsLen);
    msgBuf.fill(0);

    for(var p in data){
        key = p;
        keyInfo = dsEncode[ key ]; // { name:[<dataType>,<offset>,[len]] }
        if( keyInfo === undefined ) { continue; }
        switch( keyInfo[0]){
            case DataType.int8:
                msgBuf.writeInt8( data[p], keyInfo[1]);
            break;
            case DataType.int16:
                msgBuf.writeInt16LE( data[p], keyInfo[1]);
            break;
            case DataType.int32:
                msgBuf.writeInt32LE( data[p], keyInfo[1]);
            break;
            case DataType.int64:
            {
                msgBuf.writeUInt32LE(data[p] >> 8, keyInfo[1]); //write the high order bits (shifted over)
                msgBuf.writeUInt32LE(data[p] & 0x00ff, keyInfo[1]+4); //write the low order bits
            }
            break;
            case DataType.uint8:
                msgBuf.writeUInt8( data[p], keyInfo[1]);
            break;
            case DataType.uint16:
                msgBuf.writeUInt16LE( data[p], keyInfo[1]);
            break;
            case DataType.uint32:
                msgBuf.writeUInt32LE( data[p], keyInfo[1]);
            break;
            case DataType.float:
                msgBuf.writeFloatLE( data[p], keyInfo[1]);
            break;
            case DataType.double:
                msgBuf.writeDoubleLE( data[p], keyInfo[1]);
            break;
            case DataType.bool:
            {
                msgBuf.writeUInt8( data[p]?1:0, keyInfo[1]);
            }
            break;
            case DataType.string:
            {
                var strLen = keyInfo[2];
                var str = '';
                if(data[p].length > strLen-1){
                    str = data[p].slice(0,strLen-1);
                }else{
                    str = data[p];
                }

                msgBuf.write( str, keyInfo[1] );
            }
            break;
            case DataType.object:
            {
                var tmpBuf = encodeObject(data[p], keyInfo[2], keyInfo[3]);
                tmpBuf.copy(msgBuf,keyInfo[1],0,keyInfo[2]);
            }
            break;
        }
    }

    return msgBuf;
}





