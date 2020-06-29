import * as React from 'react';
import {
    IonContent,
    IonPage,
    IonLabel,
    IonList,
    IonItem,
    IonText,
    IonInput,
    IonToolbar,
    IonButtons,
    IonBackButton, IonTitle, IonHeader, IonItemDivider, IonTextarea, IonButton, IonSelect, IonSelectOption
} from "@ionic/react";
import dao, {ContractModel} from "../common/db/Dao";
import service from "../common/service";
import Contract from "../common/contract";
import i18n from "../i18n";
import utils from "../common/utils";
import BigNumber from "bignumber.js";


interface Param {
    name:string
    type:string
}

interface State {
    contract?:ContractModel
    paramValue:Map<string,any>
    queryValue:Map<string,any>
    contractService?:Contract
    contractMap:Map<string,any>
    accounts?:any
    balanceMap?:Map<string,string>
    balance?:string
    selectAccount:any
    selectCurrency:string
}


class Load extends React.Component<State, any>{

    state:State = {
        paramValue:new Map<string,any>(),
        queryValue:new Map<string,any>(),
        contractMap:new Map(),
        selectAccount:{},
        selectCurrency:''

    }

    componentDidMount(): void {

        this.getAccounts().catch();
        this.getContract();
    }

    getContract(){
        const that = this;
        // @ts-ignore
        const address = this.props.match.params.address;
        dao.detail(address).then((rest:any)=>{
            console.log(rest);
            const abiObj = JSON.parse(rest.abi);
            const contractMap:Map<string,any> = new Map();
            for(let item of abiObj){
                contractMap.set(item.name,item);
            }
            that.setState({
                contract:rest,
                contractService:new Contract(abiObj,rest.address),
                contractMap:contractMap
            })
        })
    }

    setValue(method:string,name:string,value:any){
        const {paramValue} = this.state;
        paramValue.set(this.paramKey(method,name),value)
        this.setState({
            paramValue:paramValue
        })
    }

    paramKey = (method:string,name:string)=>{
        return method + ":" + name;
    }

    renderContract(){
        const {contract,queryValue,paramValue} = this.state;
        const aHtml:Array<any> = [];
        if(contract){
            const abiStr = contract.abi;
            const address = contract.address;
            const name = contract.name;

            const abi:Array<any> = JSON.parse(abiStr);
            for(let data of abi){
                if(data.type !== "function"){
                    continue;
                }
                const method:string = data.name;
                aHtml.push(
                    <IonItemDivider>{method}</IonItemDivider>
                )

                const inputs:Array<Param> = data.inputs;
                console.log("inputs>>",inputs);
                const params:Array<any> = [];
                for(let input of inputs){
                    const arg:any = input.name;
                    const key = this.paramKey(method,arg);
                    const value:any = paramValue.has(key)?paramValue.get(key):""
                    if(input.type.indexOf("uint")>-1){
                        params.push(
                            <IonItem>
                                <IonLabel>{arg}</IonLabel>
                                <IonInput value={value} placeholder={input.type} onIonChange={e => this.setValue(method,arg,e.detail.value!)}/>
                            </IonItem>
                        )
                    }else{
                        params.push(
                            <IonItem>
                                <IonLabel>{arg}</IonLabel>
                                <IonInput value={value} placeholder={input.type} onIonChange={e => this.setValue(method,arg,e.detail.value!)}/>
                            </IonItem>
                        )
                    }

                }
                if(data.stateMutability.indexOf("payable")>-1){
                    if(data.stateMutability === "payable"){
                        const arg:any = "payable";
                        const key = this.paramKey(method,arg);
                        const value:any = paramValue.has(key)?paramValue.get(key):""
                        params.push(
                            <IonItem>
                                <IonLabel>Payable</IonLabel>
                                <IonInput value={value} placeholder={"uint256"} onIonChange={e => this.setValue(method,arg,e.detail.value!)}/>
                            </IonItem>
                        )
                    }
                    aHtml.push(params)
                    aHtml.push(<IonText color="tertiary">{queryValue.get(method)}</IonText>)
                    aHtml.push(
                        <div style={{float:"right"}}><IonButton onClick={()=>{this.execute(method)}} size={"small"}>Execute</IonButton></div>
                    )
                }else{
                    aHtml.push(params)
                    aHtml.push(<IonText color="tertiary">{queryValue.get(method)}</IonText>)
                    aHtml.push(
                        <div style={{float:"right"}}><IonButton onClick={()=>{this.query(method)}} size={"small"}>View</IonButton></div>
                    )
                }
            }
        }
        return aHtml
    }

    convertValue(value:any,inputType:any):any{
        if(inputType && inputType.indexOf("[]")>-1){
            value = JSON.parse(value)
        }
        return value
    }

    query(method:string){
        const {contractService,paramValue,contractMap,queryValue,selectAccount} = this.state;
        if(contractService){
            const inputs:Array<Param> = contractMap.get(method).inputs;
            let args:Array<any> = [];
            for(let item of inputs){
                const value = paramValue.get(this.paramKey(method,item.name));
                args.push(this.convertValue(value,item.type))
            }
            contractService.callMethod(method,selectAccount.MainPKr,args).then((rest:any)=>{
                console.log("query rest>>>",rest, JSON.stringify(rest));
                // const outputs = contractMap.get(method).outputs;

                queryValue.set(method,JSON.stringify(rest))
                this.setState({
                    queryValue:queryValue
                })
            })
        }
    }

    // convertOutputs(method:string,outputs:Array<any>,outputType:any){
    //     const rest:any = {};
    //     for(let item of outputs){
    //         if(typeof item === "string"){
    //
    //         }
    //     }
    // }

    execute(method:string){
        const {contractService,paramValue,contractMap,queryValue,selectAccount,selectCurrency} = this.state;
        if(contractService){
            const inputs:Array<Param> = contractMap.get(method).inputs;
            let args:Array<any> = [];
            for(let item of inputs){
                const value = paramValue.get(this.paramKey(method,item.name));
                args.push(this.convertValue(value,item.type))
            }
            let value:BigNumber = new BigNumber(0)
            const key = this.paramKey(method,"payable");
            if(paramValue.has(key)){
                const decimal = service.getDecimalCache(selectCurrency)
                value = utils.toValue(paramValue.get(key),decimal)
            }
            contractService.executeMethod(method,selectAccount.PK,selectAccount.MainPKr,args,selectCurrency,value).then(rest=>{
                queryValue.set(method,rest)
                this.setState({
                    queryValue:queryValue
                })
            })
        }
    }

    async getAccounts(){
        const rest:any = await service.getAccounts();
        this.setState({
            accounts:rest
        })
    }

    async setAccount (pk:any){
        const that = this;
        const rest:any = await service.getAccount(pk);
        const balances:any = rest.Balance;
        let balanceMap:Map<string,string> = new Map()
        if(balances instanceof Map){
            // @ts-ignore
            for(let [k,v] of balances){
                const decimal = await service.getDecimal(k);
                balanceMap.set(k,utils.fromValue(v,decimal).toString(10))
            }
        }else {
            let keys = Object.keys(balances);
            for(let k of keys){
                const v = balances[k];
                const decimal = await service.getDecimal(k);
                balanceMap.set(k,utils.fromValue(v,decimal).toString(10))
            }
        }

        that.setState({
            selectAccount:rest,
            balanceMap:balanceMap,
            balance:'',
            selectCurrency:''
        })
    }

    setCurrency = (cy:any)=>{
        const that = this;
        const {balanceMap} = this.state;
        that.setState({
            // @ts-ignore
            balance:balanceMap.get(cy),
            selectCurrency:cy
        })
    }

    getBalance=(balance:any,cy:string)=>{
        if(balance && balance.has(cy)){
            return utils.fromValue(balance.get(cy),18).toFixed(6)
        }
        return "0"
    }

    renderAccountsOp=(accounts:any)=>{
        let ops = [];
        if(accounts && accounts.length>0){
            for(let i=0;i<accounts.length;i++){
                const act = accounts[i];
                ops.push(<IonSelectOption value={act.PK}>{act.Name}({act.MainPKr})</IonSelectOption>)
            }
        }
        return ops
    }

    renderBalanceOp(balanceMap:any){
        let ops:Array<any> = [];
        if(balanceMap && balanceMap.size>0){
            // @ts-ignore
            for(let [k,v] of balanceMap){
                ops.push(<IonSelectOption value={k}>{k}</IonSelectOption>)
            }
        }
        return ops

    }

    render(): React.ReactNode {
        const {selectAccount,selectCurrency,accounts,balanceMap,balance} = this.state;
        const pHtml:any = this.renderContract();
        const options = this.renderAccountsOp(accounts);
        const balancesOptions = this.renderBalanceOp(balanceMap);

        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton defaultHref="#/" />
                        </IonButtons>
                        <IonTitle>Excute Contract</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonList>
                        <IonItemDivider>
                            <IonLabel>Account</IonLabel>
                        </IonItemDivider>
                        <IonItem>
                            <IonLabel>{i18n.t('account')}</IonLabel>
                            <IonSelect value={selectAccount.PK} placeholder={i18n.t('selectOne')} onIonChange={e => this.setAccount(e.detail.value)}>
                                {options}
                            </IonSelect>
                        </IonItem>
                        <IonItem>
                            <IonLabel>{i18n.t('currency')}</IonLabel>
                            <IonSelect value={selectCurrency} placeholder={i18n.t('selectOne')} onIonChange={e => this.setCurrency(e.detail.value)}>
                                {balancesOptions}
                            </IonSelect>
                        </IonItem>
                        <IonItem>
                            <IonLabel>{i18n.t('balance')}</IonLabel>
                            <IonText>
                                {balance}
                            </IonText>
                        </IonItem>

                        {pHtml}
                    </IonList>
                </IonContent>
            </IonPage>
        )
    }
}

export default Load