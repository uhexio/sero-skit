import * as React from 'react';
import {
    IonContent,
    IonPage,
    IonLabel,
    IonList,
    IonItem,
    IonInput,
    IonToolbar,
    IonButtons,
    IonBackButton, IonTitle, IonHeader, IonTextarea,IonItemDivider,IonButton,IonSelectOption,IonSelect,IonText,IonToast
} from "@ionic/react";
import Contract from "../common/contract";
import i18n from '../i18n'
import service from "../common/service";
import utils from "../common/utils";
import BigNumber from "bignumber.js";
import dao from "../common/db/Dao";


interface Param {
    name:string
    type:string
}

interface State {
    name:string
    data:string
    abi:any
    constructInputs?:Array<Param>
    inputsMap:Map<string,string>
    accounts?:any
    balanceMap?:Map<string,string>
    balance?:string
    selectAccount:any
    selectCurrency:string
    showToast:boolean
    value:any
    payable:boolean
    toastMsg:any
}

class Deploy extends React.Component<State, any>{

    state:State = {
        name:'',
        data:'',
        abi:[],
        inputsMap:new Map<string,string>(),
        selectCurrency:'',
        showToast:false,
        toastMsg:'',
        value:new BigNumber(0),
        payable:false,
        selectAccount:{}
    }

    componentDidMount(): void {
        this.getAccounts().catch();
    }

    setName = (value:string)=>{
        this.setState({
            name:value
        })
    }

    setData = (value:string)=>{
        this.setState({
            data:value
        })
    }

    setAbi = (value:string)=>{
        console.log(JSON.parse(value));
        this.setState({
            abi:value
        })
        const datas = JSON.parse(value);
        for(let data of datas){
            if(data.type === "constructor"){
                this.setState({
                    constructInputs:data.inputs,
                    payable:data.payable
                })
            }
        }
    }

    setInputs = (name:string,value:any)=>{
        const {inputsMap} = this.state;
        inputsMap.set(name,value)
        this.setState({
            inputsMap:inputsMap
        })
    }

    setValue =(v:any)=>{
        this.setState({
            value:v
        })
    }

    renderInputs = ()=>{
        const {constructInputs,inputsMap} = this.state;
        const inputHtml:Array<any> = [];
        if(constructInputs){
            for(let data of constructInputs){
                inputHtml.push(
                    <IonItem>
                        <IonLabel>{data.name}</IonLabel>
                        <IonInput value={inputsMap.get(data.name)} placeholder={data.type} onIonChange={e => this.setInputs(data.name,e.detail.value!)}/>
                    </IonItem>
                )
            }
        }
        return inputHtml;
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

    async confirm(){
        const that = this;
        const {data,abi,inputsMap,selectAccount,selectCurrency,value,name} = this.state;
        const abiObj:any = JSON.parse(abi);
        const contract = new Contract(abiObj,'');
        const decimal = service.getDecimalCache(selectCurrency);
        const conValue:Array<any> = [];
        for(let data of abiObj){
            if(data.type === "constructor"){
                const inputs:Array<Param> = data.inputs;
                for(let input of inputs){
                    let val:any = inputsMap.get(input.name);
                    if(input.type ==="address"){
                        val = await utils.convertAddress(val);
                    }else if(input.type ==="address[]"){
                        val = await utils.convertAddresses(JSON.parse(val));
                    }else if(input.type.indexOf("[]")>-1){
                        val = JSON.parse(val);
                    }
                    conValue.push(val)
                }
            }
        }
        contract.deploy(selectAccount.PK,selectAccount.MainPKr,selectCurrency,utils.toValue(value,decimal),abiObj,data,...conValue).then((rest:any)=>{
            dao.add({
                address:rest,
                type:'deploy',
                abi:abi,
                name:name,
                createdAt:new Date().getTime(),
                hash:rest
            }).then(()=>{
                window.location.href = "#/";
            }).catch(e=>{
                const err:any = typeof e === 'string'?e:e.message;
                that.toast(err)
            })
        }).catch(e=>{
            const err:any = typeof e === 'string'?e:e.message;
            that.toast(err)
        })
    }

    toast=(msg:string)=>{
        this.setState({
            showToast:true,
            toastMsg:msg
        })
    }

    hideToast=()=>{
        this.setState({
            showToast:false,
            toastMsg:''
        })
    }

    render(): React.ReactNode {
        const {name,data,abi,accounts,balanceMap,balance,selectAccount,selectCurrency,value,payable,showToast,toastMsg} = this.state;
        const inputsHtml:any = this.renderInputs();
        const options = this.renderAccountsOp(accounts);
        const balancesOptions = this.renderBalanceOp(balanceMap);

        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton defaultHref="#/" />
                        </IonButtons>
                        <IonTitle>Deploy Contract</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent style={{padding:'0 0 45px 0'}}>
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

                        <IonItemDivider>
                            <IonLabel>Name</IonLabel>
                        </IonItemDivider>
                        <IonItem lines={"none"}>
                            <IonTextarea rows={1} value={name} placeholder="Customer Contract name" onIonChange={e => this.setName(e.detail.value!)}/>
                        </IonItem>

                        <IonItemDivider>
                            <IonLabel>Abi</IonLabel>
                        </IonItemDivider>
                        {inputsHtml}
                        {payable?<IonItem>
                            <IonLabel>{i18n.t('payable')}</IonLabel>
                            <IonInput type="number" value={value} placeholder="Value" onIonChange={e => this.setValue(parseInt(e.detail.value!, 10))}/>
                        </IonItem>:""}
                        <IonItem lines={"none"}>
                            <IonTextarea rows={5} value={abi} placeholder="Contract Abi" onIonChange={e => this.setAbi(e.detail.value!)}/>
                        </IonItem>
                        <IonItemDivider>
                            <IonLabel>Data</IonLabel>
                        </IonItemDivider>
                        <IonItem lines={"none"}>
                            <IonTextarea rows={3} value={data} placeholder="data" onIonChange={e => this.setData(e.detail.value!)}/>
                        </IonItem>
                    </IonList>
                </IonContent>
                <div style={{width:"100%",position:"fixed",bottom:0}}>
                    <IonButton onClick={()=>{this.confirm().then().catch()}} expand={"block"}>{i18n.t('Next')}</IonButton>
                </div>

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={this.hideToast}
                    message={toastMsg}
                    duration={2000}
                    color={"dark"}
                />

            </IonPage>
        )
    }
}

export default Deploy