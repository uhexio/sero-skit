import BigNumber from 'bignumber.js'
import service from "./service";
const bs58 = require('bs58');
const stringifyObject = require('stringify-object');

export default {

    ellipsis:(str: string): string => {
        const splet:number = 10;
        if (str && str.length > splet) {
            str = str.substr(0, splet) + '...' + str.substr(str.length - splet);
        }
        return str;
    },

    toHex(value: string | BigNumber | number):string{
        return "0x"+new BigNumber(value).toString(16)
    },

    toValue(value: string | BigNumber | number, decimal: number): BigNumber {
        return new BigNumber(value).multipliedBy(new BigNumber(10).pow(decimal));
    },

    fromValue(value: string | BigNumber | number, decimal: number): BigNumber {
        if(!value){
            value = 0;
        }
        return new BigNumber(value).dividedBy(new BigNumber(10).pow(decimal));
    },

    hexToString(v:string|number|BigNumber){
        if(!v){
            return "0";
        }
        return new BigNumber(v).toString(10)
    },

    async convertShotAddress(shotAddress:Array<string>){
        const rest:any = await service.jsonRpc("sero_getFullAddress",[shotAddress]);
        const resultArr:Array<string> = [];
        for(let addr of shotAddress){
            resultArr.push(rest[addr])
        }
        return resultArr.join(",");
    },

    convertResult(result: any) {
        if (result instanceof Array) {
            const resultArray: any = [];
            result.forEach(function (res: any, i: any) {
                if (isFinite(i))
                    resultArray.push(res);
            });
            const convert = function (resultArray: any) {
                return resultArray.map(function (res: any) {
                    if (res.constructor.name === 'BN') {
                        res = res.toString(10);
                    } else if (res instanceof Array) {
                        res = convert(res);
                    }
                    return res;
                });
            };
            return convert(resultArray);
        }
        return result
    }
    ,

    async convertAddress(address:string){
        const rest:any = await service.jsonRpc("sero_getCode",[address,"latest"]);
        if(rest){
            // is contract address
            let hexStr = bs58.decode(address).toString("hex");
            const rightZeroStr = "0000000000000000000000000000000000000000000000000000000000000000";
            const hex = "0x"+hexStr + rightZeroStr;

            return bs58.encode(this.hexToBytes(hex))
        }
        return "";
    },

    hexToBytes(hex:string) {
        hex = hex.replace(/^0x/i, '');
        for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    },

    async convertAddresses(addresses:Array<string>){
        const retnArray:Array<string> = [];
        if(addresses && addresses.length>0){
            for(let address of addresses){
                const addr = await this.convertAddress(address);
                if(addr){
                    retnArray.push(addr);
                }
            }
        }
        return retnArray;
    },

    async verifyAddress(addresses:Array<string>){
        if(addresses && addresses.length>0){
            for(let address of addresses){
                if(this.isPKr(address)){
                    const rest:any = await this.convertAddress(address);
                    if(!rest){
                        return false;
                    }
                }
            }
        }
        return true;
    },

    isPKr(address:string){
        const b = bs58.decode(address);
        if ( b.length != 96 ){
            return false;
        }
        return true;
    },

    formatJson(json:any) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json);
        }
        const pretty = stringifyObject(json, {
            indent: '  ',
            singleQuotes: true,
            inlineCharacterLimit: 12
        });
        return pretty;
    }
}

