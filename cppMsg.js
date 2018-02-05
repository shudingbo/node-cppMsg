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

 * Modified by darnold79 on 2/14/17
 * Added support for arrays of any supported data type.

 * Modified by darnold79 on 2/28/17
 * Added support for dynamic array length (if specified as last element in struct).
 */


let cppMsg = module.exports;
const iconv = require('iconv-lite');


///////////// cppString defined
function CppString(str, len) {

    this.str = "";
    if (str.length > len - 1) {
        this.str = str.slice(0, len - 1);
    } else {
        this.str = str;
    }
    this.str += "\0";

    this.byteLen = len;
    this.buffer = Buffer.alloc(this.byteLen);
    this.length = this.buffer.length;

    this.process();
}

CppString.prototype.toString = function () {
    return this.buffer.toString();
};


CppString.prototype.getLength = function () {
    return this.buffer.length;
};

CppString.prototype.process = function () {
    this.buffer.fill(0);
    this.buffer.write(this.str);
    /*for(let i=this.str.length;i < this.buffer.length;i++){
     this.buffer[i] = 0x00;
     }*/
};


function CppNum(num, intType) {

    this.num = num;

    this.buffer = null;
    this.value = null;
    this.numArray = null;
    this.byteLen = null;
    this.intType = intType;

    switch (this.intType) {
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


CppNum.prototype.process = function () {

    this.value = this.numArray[0];
    this.buffer = Buffer.alloc(this.byteLen);

    switch (this.intType) {
        case "uint8"://uint8
            this.buffer.writeUInt8(this.value, 0);//little endian （按小端对齐）
            break;
        case "uint16"://uint16
            this.buffer.writeUInt16LE(this.value, 0);//little endian （按小端对齐）
            break;
        case "uint32"://uint32
            this.buffer.writeUInt32LE(this.value, 0);//little endian （按小端对齐）
            break;
        case "int8"://int8
            this.buffer.writeInt8(this.value, 0);//little endian （按小端对齐）
            break;
        case "int16"://int16
            this.buffer.writeInt16LE(this.value, 0);//little endian （按小端对齐）
            break;
        case "int32"://int32
            this.buffer.writeInt32LE(this.value, 0);//little endian （按小端对齐）
            break;
        default:
            break;
    }
};


function isObject(obj) {
    return (Object.prototype.toString.call(obj) === '[object Object]');
}


// 基本数据类型定义
const DataType = {
    int8: 0,
    uint8: 1,
    int16: 2,
    uint16: 3,
    int32: 4,
    uint32: 5,
    int64: 6,
    float: 7,
    double: 8,
    bool: 9,
    string: 10,
    object: 11
};

const DataTypeLen = [1, 1, 2, 2, 4, 4, 8, 4, 8, 1, 0];

/**
 ds = [{<name>:[<type>,[len],[arraylen]]}]
 [
 [ 'reg','int32'],
 [ 'workPath','string',250 },
 [ 'someArray','uint32',,16 },
 ]

 */
cppMsg.msg = function (ds, data) {
    this.listBuffer = [];  // 数据 Buffer
    this.length = 0;       // 已放入Buffer的数据长度

    this.dsEncode = {};  // 编码使用结构 { name:[<dataType>,<offset>,[len]] }
    this.dsDecode = [];  // 解码使用的结构 [<offset>,<datalen>,<dataType>,<name>]
    this.dsLen = 0;

    const ret = this.phraseDS(ds);
    if (ret !== false) {
        this.dsLen = ret[0];
        this.dsEncode = ret[1];
        this.dsDecode = ret[2];
    }


    //console.log( this.dsEncode);
    //console.log( this.dsDecode);
    //console.log( this.dsLen );


    if (isObject(data)) {
        this.encodeMsg(data);
    }
};

cppMsg.msg.prototype.phraseDS = function (ds) {
    if (Array.isArray(ds)) {
        let len = ds.length;
        let offset = 0;
        let it = null;
        let dataType = DataType.int8;
        let dataLen = 1;
        let arrayLen = 1;

        let dsLen = 0;
        let dsEncode = {};  // 编码使用结构 { name:[<dataType>,<offset>,[len]] }
        let dsDecode = [];  // 解码使用的结构 [<offset>,<datalen>,<dataType>,<name>]

        for (let i = 0; i < len; i++) {
            let it = ds[i];

            if (Array.isArray(it) && it.length >= 2) {
                switch (it[1]) {
                    case 'int8' :
                        dataType = DataType.int8;
                        break;
                    case 'uint8':
                        dataType = DataType.uint8;
                        break;
                    case 'int16':
                        dataType = DataType.int16;
                        break;
                    case 'uint16':
                        dataType = DataType.uint16;
                        break;
                    case 'int32':
                        dataType = DataType.int32;
                        break;
                    case 'uint32':
                        dataType = DataType.uint32;
                        break;
                    case 'int64':
                        dataType = DataType.int64;
                        break;
                    case 'float':
                        dataType = DataType.float;
                        break;
                    case 'double':
                        dataType = DataType.double;
                        break;
                    case 'bool' :
                        dataType = DataType.bool;
                        break;
                    case 'string' :
                        dataType = DataType.string;
                        break;
                    case 'object' :
                        dataType = DataType.object;
                        break;
                    default:
                        dataType = -1;
                        break;
                }

                let enAddin = null;
                let deAddin = null;
                if (dataType === -1) {
                    throw Error(' cppType.msg ds phrase error ');
                } else {
                    if (dataType === DataType.string) {  // 字符串
                        if (it.length < 3) {
                            throw Error(' cppType.msg ds phrase error: [string] ');
                        }
                        dataLen = parseInt(it[2]);

                        if (it.length > 3 && it[3] != undefined) {
                            deAddin = it[3];
                            enAddin = it[3];
                        } else {
                            enAddin = 'gb2312';
                            deAddin = 'gb2312';
                        }
                    }
                    else if (dataType === DataType.object) { // 对象
                        dataLen = -1;
                        let ret = this.phraseDS(it[2]);
                        if (ret !== false) {
                            //console.log('ret-------- testObj', ret );
                            dataLen = ret[0];
                            enAddin = ret[1];
                            deAddin = ret[2];
                        }
                    }
                    else {
                        dataLen = DataTypeLen[dataType];
                    }
                    if (it.length > 4) {
                        arrayLen = parseInt(it[4]);
                    } else {
                        arrayLen = 1;
                    }
                }


                dsEncode[it[0]] = [dataType, offset, dataLen, enAddin, arrayLen];
                dsDecode.push([offset, dataLen, dataType, it[0], deAddin, arrayLen]);

                offset += dataLen * arrayLen;
                dsLen += dataLen * arrayLen;
            } else {
                throw Error('data struct parseError!');
            }
        }

        return [dsLen, dsEncode, dsDecode, arrayLen];
    }
    else {
        return false;
    }
};


cppMsg.msg.prototype.push_uint8 = function (value) {
    let uint8Value = new CppNum(value, "uint8");
    this.listBuffer.push(uint8Value.buffer);
    this.length += uint8Value.byteLen;
};

cppMsg.msg.prototype.push_int8 = function (value) {
    let int8Value = new CppNum(value, "int8");
    this.listBuffer.push(int8Value.buffer);
    this.length += int8Value.byteLen;
};

cppMsg.msg.prototype.push_uint16 = function (value) {
    let uint16Value = new CppNum(value, "uint16");
    this.listBuffer.push(uint16Value.buffer);
    this.length += uint16Value.byteLen;
};

cppMsg.msg.prototype.push_int16 = function (value) {
    let int16Value = new CppNum(value, "int16");
    this.listBuffer.push(int16Value.buffer);
    this.length += int16Value.byteLen;
};

cppMsg.msg.prototype.push_uint32 = function (value) {
    let uint32Value = new CppNum(value, "uint32");
    this.listBuffer.push(uint32Value.buffer);
    this.length += uint32Value.byteLen;
};

cppMsg.msg.prototype.push_int32 = function (value) {
    let int32Value = new CppNum(value, "int32");
    this.listBuffer.push(int32Value.buffer);
    this.length += int32Value.byteLen;
};

cppMsg.msg.prototype.push_string = function (strValue, len) {
    let strValue1 = new CppString(strValue, len);
    this.listBuffer.push(strValue1.buffer);
    this.length += strValue1.byteLen;
};

cppMsg.msg.prototype.push_char = function (strChar) {
    let strValue = new CppString(strValue, 2);
    this.listBuffer.push(strValue.buffer);
    this.length += strValue.byteLen;
};

cppMsg.msg.prototype.encode = function (data) {

    if (isObject(data)) {
        let msgBuf = this.encodeMsg(data);
        this.listBuffer.push(msgBuf);
        this.length += this.listBuffer.length;
    }

    if (this.listBuffer.length > 0) {
        return Buffer.concat(this.listBuffer);
    }

    return false;
};


/** decode message as object
 */
cppMsg.msg.prototype.decodeMsg = function (buf) {
    return decodeObject(buf, 0, this.dsDecode);
};


/** encode message as Buffer */
cppMsg.msg.prototype.encodeMsg = function (data) {
    return encodeObject(data, this.dsLen, this.dsEncode);
}

function readFunc(f, arrayLen, off, datalen) {
    let res = [];
    if (arrayLen <= 1)
        res = f(off);
    else
        for (let i = 0; i < arrayLen; i++) {
            res.push(f(off));
            off += datalen;
        }
    return res;
}

function decodeObject(buf, offset, dsDecode) {
    let data = {};
    // [<offset>,<datalen>,<dataType>,<name>]
    let len = dsDecode.length;
    for (let i = 0; i < dsDecode.length; i++) {
        let info = dsDecode[i];
        let off = info[0] + offset;
        let key = info[3];
        let arrayLen = info[5];
        let values = [];
        for (let arri = 0; arri < arrayLen; arri++) {
            if(off >= buf.length) continue;
            switch (info[2]) {
                case DataType.int8:
                    values.push(buf.readInt8(off));
                    break;
                case DataType.int16:
                    values.push(buf.readInt16LE(off));
                    break;
                case DataType.int32:
                    values.push(buf.readInt32LE(off));
                    break;
                case DataType.int64:
                    let high = buf.readUInt32LE(off);
                    let low = buf.readUInt32LE(off + 4);
                    values.push(low * 0x100000000 + high);
                    break;
                case DataType.uint8:
                    values.push(buf.readUInt8(off));
                    break;
                case DataType.uint16:
                    values.push(buf.readUInt16LE(off));
                    break;
                case DataType.uint32:
                    values.push(buf.readUInt32LE(off));
                    break;
                case DataType.float:
                    values.push(buf.readFloatLE(off));
                    break;
                case DataType.double:
                    values.push(buf.readDoubleLE(off));
                    break;
                case DataType.bool: {
                    values.push(buf.readUInt8(off) !== 0);
                }
                    break;
                case DataType.string: {
                    //values  = buf.toString(undefined, off, off+info[1]-1 );
                    let val = iconv.decode(buf.slice(off, off + info[1] - 1), info[4]);
                    values.push(val.replace(/\0[\s\S]*/g, ''));
                }
                    break;
                case DataType.object: {
                    values.push(decodeObject(buf, off, info[4]));
                }
                    break;
            }
            off += info[1];
        }
        data[key] = arrayLen <= 1 ? values[0] : values;
    }

    return data;
}

function encodeObject(data, dsLen, dsEncode) {
    let keyInfo = null;
    let msgBuf = Buffer.alloc(dsLen);

    for (let p in data) {
        keyInfo = dsEncode[p]; // { name:[<dataType>,<offset>,[len],[arraylen]] }
        if (keyInfo === undefined) {
            continue;
        }
        let out = Array.isArray(data[p]) ? data[p] : [data[p]];
        let off = keyInfo[1];

        for(let idx=0; idx< out.length;idx++)
        {
            let x = out[idx];
            switch (keyInfo[0]) {
                case DataType.int8:
                    msgBuf.writeInt8(x, off);
                    break;
                case DataType.int16:
                    msgBuf.writeInt16LE(x, off);
                    break;
                case DataType.int32:
                    msgBuf.writeInt32LE(x, off);
                    break;
                case DataType.int64:
                    let high = ~~(x / 0xFFFFFFFF);
                    let low = (x % 0xFFFFFFFF) - high;

                    msgBuf.writeUInt32LE(low, off);
                    msgBuf.writeUInt32LE(high, (off+4));
                    break;
                case DataType.uint8:
                    msgBuf.writeUInt8(x, off);
                    break;
                case DataType.uint16:
                    msgBuf.writeUInt16LE(x, off);
                    break;
                case DataType.uint32:
                    msgBuf.writeUInt32LE(x, off);
                    break;
                case DataType.float:
                    msgBuf.writeFloatLE(x, off);
                    break;
                case DataType.double:
                    msgBuf.writeDoubleLE(x, off);
                    break;
                case DataType.bool:
                    msgBuf.writeUInt8(x ? 1 : 0, off);
                    break;
                case DataType.string:
                    let strLen = keyInfo[2];
                    let str = '';
                    if (x.length > strLen - 1) {
                        str = iconv.encode(x.slice(0, strLen - 1), keyInfo[3]);
                    } else {
                        str = iconv.encode(x, keyInfo[3]);
                    }

                    str.copy(msgBuf, off);
                    break;
                case
                DataType.object:
                    let tmpBuf = encodeObject(x, keyInfo[2], keyInfo[3]);
                    tmpBuf.copy(msgBuf, off, 0, keyInfo[2]);
                    break;
            }
            off += keyInfo[2];
        }
    }

    return msgBuf;
}
