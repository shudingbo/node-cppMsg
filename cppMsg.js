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


const iconv = require('iconv-lite');


///////////// cppString defined
class CppString {
    constructor( str, len ){
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

    toString () {
        return this.buffer.toString();
    }
    
    
    getLength () {
        return this.buffer.length;
    }
    
    process () {
        this.buffer.fill(0);
        this.buffer.write(this.str);
        /*for(let i=this.str.length;i < this.buffer.length;i++){
         this.buffer[i] = 0x00;
         }*/
    }
}


class CppNum {
    constructor(num, intType) {
        this.num = num;
    
        this.buffer = null;
        this.value = null;
        this.numArray = null;
        this.byteLen = null;
        this.intType = intType;
    
        switch (this.intType) {
            case DataType.uint8:
                this.numArray = new Uint8Array([num]);
                this.byteLen = 1;
                break;
            case DataType.uint16:
                this.numArray = new Uint16Array([num]);
                this.byteLen = 2;
                break;
            case DataType.uint32:
                this.numArray = new Uint32Array([num]);
                this.byteLen = 4;
                break;
            case DataType.int8:
                this.numArray = new Int8Array([num]);
                this.byteLen = 1;
                break;
            case DataType.int16:
                this.numArray = new Int16Array([num]);
                this.byteLen = 2;
                break;
            case DataType.int32:
                this.numArray = new Int32Array([num]);
                this.byteLen = 4;
                break;
            default:
                break;
        }
        this.process();
    }
    
    
    process () {
        this.value = this.numArray[0];
        this.buffer = Buffer.alloc(this.byteLen);
    
        switch (this.intType) {
            case DataType.uint8://uint8
                this.buffer.writeUInt8(this.value, 0);//little endian （按小端对齐）
                break;
            case DataType.uint16://uint16
                this.buffer.writeUInt16LE(this.value, 0);//little endian （按小端对齐）
                break;
            case DataType.uint32://uint32
                this.buffer.writeUInt32LE(this.value, 0);//little endian （按小端对齐）
                break;
            case DataType.int8://int8
                this.buffer.writeInt8(this.value, 0);//little endian （按小端对齐）
                break;
            case DataType.int16://int16
                this.buffer.writeInt16LE(this.value, 0);//little endian （按小端对齐）
                break;
            case DataType.int32://int32
                this.buffer.writeInt32LE(this.value, 0);//little endian （按小端对齐）
                break;
            default:
                break;
        }
    }
}




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

class msg {
    
    /**
     ds = [{<name>:[<type>,[len],[arraylen]]}]
    [
    [ 'reg','int32'],
    [ 'workPath','string',250 },
    [ 'someArray','uint32',,16 },
    ]

    */
    constructor (ds, data ,opts) {
        this.listBuffer = [];  // 数据 Buffer
        this.length = 0;       // 已放入Buffer的数据长度
    
        this.dsEncode = {};  // 编码使用结构 { name:[<dataType>,<offset>,[len]] }
        this.dsDecode = [];  // 解码使用的结构 [<offset>,<datalen>,<dataType>,<name>]
        this.dsLen = 0;

        let defOpt = { useIconv: true };

        this.opts = isObject(opts) ? opts : defOpt;
        if( this.opts.useIconv === undefined ){
            this.opts.useIconv = true;
        }
        
        const ret = this.phraseDS(ds);
        if (ret !== false) {
            this.dsLen = ret[0];
            this.dsEncode = ret[1];
            this.dsDecode = ret[2];
        }
    
        this.encodeBuf = Buffer.alloc(this.dsLen);
    
        if (isObject(data)) {
            this.encodeMsg(data);
        }
    }

    
   phraseDS (ds) {
        if (Array.isArray(ds)) {
            let len = ds.length;
            let offset = 0;
            let dataType = DataType.int8;
            let dataLen = 1;
            let arrayLen = 1;

            let dsLen = 0;
            let dsEncode = {};  // 编码使用结构 { name:[<dataType>,<offset>,[len]] }
            let dsDecode = [];  // 解码使用的结构 [<offset>,<datalen>,<dataType>,<name>]

            for (let i = 0; i < len; i++) {
                let it = ds[i];

                if (Array.isArray(it) && it.length >= 2) {
                    dataType = DataType[ it[1] ];
                    if( dataType === undefined ) {
                        dataType = -1;
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
                                enAddin = 'utf8';
                                deAddin = 'utf8';
                            }
                        } else if (dataType === DataType.object) { // 对象
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
    }


    push_uint8 (value) {
        let uint8Value = new CppNum(value, DataType.uint8);
        this.listBuffer.push(uint8Value.buffer);
        this.length += uint8Value.byteLen;
    }

    push_int8 (value) {
        let int8Value = new CppNum(value, DataType.int8);
        this.listBuffer.push(int8Value.buffer);
        this.length += int8Value.byteLen;
    }

    push_uint16 (value) {
        let uint16Value = new CppNum(value, DataType.uint16);
        this.listBuffer.push(uint16Value.buffer);
        this.length += uint16Value.byteLen;
    }

    push_int16 (value) {
        let int16Value = new CppNum(value, DataType.int16);
        this.listBuffer.push(int16Value.buffer);
        this.length += int16Value.byteLen;
    }

    push_uint32 (value) {
        let uint32Value = new CppNum(value, DataType.uint32);
        this.listBuffer.push(uint32Value.buffer);
        this.length += uint32Value.byteLen;
    }

    push_int32 (value) {
        let int32Value = new CppNum(value, DataType.int32);
        this.listBuffer.push(int32Value.buffer);
        this.length += int32Value.byteLen;
    }

    push_string (strValue, len) {
        let strValue1 = new CppString(strValue, len);
        this.listBuffer.push(strValue1.buffer);
        this.length += strValue1.byteLen;
    };

    push_char (strChar) {
        let strValue = new CppString(strValue, 2);
        this.listBuffer.push(strValue.buffer);
        this.length += strValue.byteLen;
    };

    encode (data) {
        if (isObject(data)) {
            let msgBuf = this.encodeMsg(data);
            this.listBuffer.push(msgBuf);
            this.length += this.listBuffer.length;
        }

        if (this.listBuffer.length > 0) {
            return Buffer.concat(this.listBuffer);
        }

        return false;
    }


    /** decode message as object
     * @param {Buffer} buf data buffer
     * @return {object} the data object
     */
    decodeMsg (buf) {
        return decodeObject(buf, 0, this.dsDecode, this.opts);
    }


    /** encode message as Buffer 
     * @param {object} data the encode object
     * @return {Buffer} The Buffer ( new Buffer )
    */
    encodeMsg (data) {
        return encodeObject(data, this.dsLen, this.dsEncode, this.opts);
    }

    /** encode message use internal buffer
     * @param {object} data the encode object
     * @return {Buffer} The internal Buffer
    */
    encodeMsg2 (data) {
        return encodeObject2(data, this.encodeBuf, this.dsEncode, 0, this.opts);
    }
}


/** encode msg( new Buffer)
 * 
 * @param {Buffer} buf the Buffer
 * @param {number} offset  the Buffer offset
 * @param {object} dsEncode encode struct 
 * @param {{useIconv：boolean}?} opts
 * 
 * @return {object} the decode object
 */
function decodeObject(buf, offset, dsDecode,opts) {
    let data = {};
    // [<offset>,<datalen>,<dataType>,<name>]
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
                case DataType.bool:
                    values.push(buf.readUInt8(off) !== 0);
                    break;
                case DataType.string: {
                    //values  = buf.toString(undefined, off, off+info[1]-1 );
                    if( opts.useIconv === true ){
                        let val = iconv.decode(buf.slice(off, off + info[1] - 1), info[4]);
                        values.push(val.replace(/\0[\s\S]*/g, ''));
                    } else {
                        let val = buf.slice(off, off + info[1] - 1).toString();
                        values.push(val.replace(/\0[\s\S]*/g, ''));
                    }
                } break;
                case DataType.object:
                    values.push(decodeObject(buf, off, info[4],opts));
                    break;
            }
            off += info[1];
        }
        data[key] = arrayLen <= 1 ? values[0] : values;
    }

    return data;
}

/** encode msg( new Buffer)
 * 
 * @param {object} data the encode object 
 * @param {number} dsLen  the Buffer len
 * @param {object} dsEncode encode struct 
 * @param {{useIconv：boolean}?} opt
 * 
 * @return {Buffer} 
 */
function encodeObject(data, dsLen, dsEncode, opt) {
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
                    if( opt.useIconv === true ) {
                        iconv.encode((x.length > keyInfo[2] - 1)?x.slice(0, keyInfo[2] - 1):x, keyInfo[3]).copy(msgBuf, off);
                    } else {
                        Buffer.from( (x.length > keyInfo[2] - 1)?x.slice(0, keyInfo[2] - 1):x ).copy(msgBuf, off);
                    }
                    msgBuf[off + keyInfo[2]-1] = 0;
                    break;
                case
                DataType.object:
                    encodeObject2(x, msgBuf, keyInfo[3], off, opt);
                    //encodeObject(x, keyInfo[2], keyInfo[3]).copy(msgBuf, off, 0, keyInfo[2]);
                    break;
            }
            off += keyInfo[2];
        }
    }

    return msgBuf;
}

/** encode msg use internal buff
 * 
 * @param {object} data the encode object 
 * @param {Buffer} msgBuf  the internal Buffer
 * @param {object} dsEncode encode struct 
 * @param {number} offS buffer offset 
 * @param {{useIconv：boolean}?} opt
 * 
 * @return {Buffer} internal buff
 */
function encodeObject2(data, msgBuf, dsEncode,offS = 0, opt) {
    let keyInfo = null;
    for (let p in data) {
        keyInfo = dsEncode[p]; // { name:[<dataType>,<offset>,[len],[arraylen]] }
        if (keyInfo === undefined) {
            continue;
        }
        let out = Array.isArray(data[p]) ? data[p] : [data[p]];
        let off = keyInfo[1] + offS;

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
                    if( opt.useIconv === true ) {
                        iconv.encode((x.length > keyInfo[2] - 1)?x.slice(0, keyInfo[2] - 1):x, keyInfo[3]).copy(msgBuf, off);
                    } else {
                        Buffer.from( (x.length > keyInfo[2] - 1)?x.slice(0, keyInfo[2] - 1):x ).copy(msgBuf, off);
                    }
                    msgBuf[off + keyInfo[2]-1] = 0;
                    break;
                case DataType.object:
                    encodeObject2(x, msgBuf, keyInfo[3], off, opt);
                    break;
            }
            off += keyInfo[2];
        }
    }

    return msgBuf;
}

module.exports = { msg, DataType };
