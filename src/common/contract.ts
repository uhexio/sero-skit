import BigNumber from "bignumber.js";
// @ts-ignore
import seropp from 'sero-pp'
const serojs = require("serojs");

class Contract {

    contract:any

    constructor(abi:string,address:string) {
        this.contract = serojs.callContract(abi, address);
    }

    async callMethod(method:string, from:string, args:any) {
        const that = this;
        let packData = this.contract.packData(method, args,true);
        let callParams = {
            from: from,
            to: this.contract.address,
            data: packData
        };
        return new Promise((resolve, reject) => {
            seropp.call(callParams, function (callData:any,err:any) {
                if(err){
                    reject(err)
                }else{
                    if (callData !== "0x") {
                        const res = that.contract.unPackDataEx(method, callData);
                        resolve(res);
                    } else {
                        resolve('');
                    }
                }
            });
        })
    }

    async executeMethod(method:string, pk:string, mainPKr:string, args:any, cy:string, value:BigNumber) {
        let packData = this.contract.packData(method, args,true);
        let executeData:any = {
            from: pk,
            to: this.contract.address,
            value: "0x" + value.toString(16),
            data: packData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };
        let estimateParam:any = {
            from: mainPKr,
            to: this.contract.address,
            value: "0x" + value.toString(16),
            data: packData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };

        return new Promise((resolve, reject) => {
            seropp.estimateGas(estimateParam, function (gas:any, error:any) {
                if (error) {
                    reject(error)
                } else {
                    executeData["gas"] = gas;
                    seropp.executeContract(executeData, function (res:any, error:any) {
                        if(error){
                            reject(error)
                        }else {
                            resolve(res)
                        }
                    })
                }
            });
        });

    }

    async deploy(pk:string, mainPKr:string, cy:string, value:BigNumber,abi:any,data:string,...inputs:string[]){
        const createContract = serojs.createContract(abi,data)
        const createData= createContract.encodeConstructorParams(...inputs)
        let executeData:any = {
            from: pk,
            value: "0x" + value.toString(16),
            data: createData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };
        let estimateParam:any = {
            from: mainPKr,
            value: "0x" + value.toString(16),
            data: createData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };

        return new Promise((resolve, reject) => {
            seropp.estimateGas(estimateParam, function (gas:any, error:any) {
                if (error) {
                } else {
                    executeData["gas"] = gas;
                    seropp.executeContract(executeData, function (res:any, error:any) {
                        if(error){
                            // throw new Error(error)
                            reject(error)
                        }else {
                            resolve(res)
                        }
                    })
                }
            });
        });
    }

}

export default Contract