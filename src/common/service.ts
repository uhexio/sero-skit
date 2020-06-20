import axios from 'axios'
import BigNumber from "bignumber.js";
// @ts-ignore
import seropp from 'sero-pp'
import i18n from "../i18n";
import {storage} from "./storage";

export interface Tx {
    from:string
    mainPKr:string
    value:BigNumber
    poolId?:string
}

class Service {

    id: number

    constructor() {
        this.id = 0;
    }

    async jsonRpc(method: string, args: any) {
        const data: any = {
            id: this.id++,
            method: method,
            params: args
        }
        const host = localStorage.getItem("rpcHost");
        return new Promise((resolve, reject) => {
            if(!host){
                reject(new Error("rpc host required!"))
            }else{
                axios.post(host, data).then((resp: any) => {
                    if(resp.data && resp.data.error){
                        reject(new Error(resp.data.error.message))
                    }else if(resp.data && resp.data.result){
                        resolve(resp.data.result)
                    }
                }).catch(e => {
                    reject(e)
                })
            }
        })
    }

    async getDecimal(currency: string): Promise<any> {
        if (currency == 'SERO') {
            return new Promise(resolve => resolve(18));
        }
        const cache: any = storage.get(storage.keys.decimal(currency));
        if (cache) {
            return new Promise(resolve => resolve(cache));
        } else {
            const data:any = await this.jsonRpc('sero_getDecimal', [currency]);
            const decimal = new BigNumber(data, 16).toNumber();
            storage.set(storage.keys.decimal(currency), decimal);
            return new Promise(resolve => resolve(decimal));
        }
    }

    getDecimalCache(currency: string): any {
        if (currency == 'SERO') {
            return 18;
        }
        const cache: any = storage.get(storage.keys.decimal(currency));
        return cache;
    }

    async initApp(){
        return new Promise(resolve=>{
            const dapp = {
                name: "Doraemon",
                contractAddress: "Doraemon",
                github: "https://github.com/uhexio/sero-skit",
                author: "uhexio",
                url: window.location.href,
                logo: window.location.origin+window.location.pathname +"assets/icon/icon.png",
            }

            seropp.init(dapp,function (rest:any) {
                console.log("init result >>> " , rest);
                seropp.getInfo(function (data:any) {
                    if(data){
                        localStorage.setItem("language",data.language);
                        localStorage.setItem("rpcHost",data.rpc)
                        i18n.changeLanguage(data.language).then(() => {});
                    }
                    resolve()
                })
            })
        })
    }

    async getAccounts(){
        await this.initApp()
        return new Promise((resolve,reject) => {
            seropp.getAccountList((data:any,err:any)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(data)
                }
            })
        })
    }

    async getAccount(pk:string){
        await this.initApp()

        return new Promise((resolve,reject) => {
            seropp.getAccountDetail(pk,(data:any,err:any)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(data)
                }
            })
        })
    }
}

const service:Service = new Service()
export default service