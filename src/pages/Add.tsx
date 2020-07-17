import * as React from 'react';
import {
    IonContent,
    IonPage,
    IonLabel,
    IonList,
    IonItem,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonTextarea,
    IonItemDivider, IonButton, IonToast
} from "@ionic/react";
import i18n from "../i18n";
import dao from "../common/db/Dao";


interface State {
    name:string
    address:string
    abi:any
    showToast:boolean
    toastMsg:string
}

class Add extends React.Component<State, any>{

    state:State = {
        name:'',
        address:'',
        abi:[],
        showToast:false,
        toastMsg:''
    }

    setName = (value:string)=>{
        this.setState({
            name:value
        })
    }

    setAddress = (value:string)=>{
        this.setState({
            address:value
        })
    }

    setAbi = (value:string)=>{
        console.log(value);
        this.setState({
            abi:value
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

    confirm = ()=>{
        const that = this;
        const {name,abi,address} = this.state;
        if(!name){
            that.toast("Name is required!")
            return
        }
        if(!abi){
            that.toast("Abi is required!")
            return
        }
        if(!address){
            that.toast("Address is required!")
            return
        }

        dao.add({
            name:name,
            abi:abi,
            address:address,
            createdAt:new Date().getTime(),
            type:'add'
        }).then(()=>{
            that.toast("Add Successfully!")
            setTimeout(function () {
                window.location.href = "#/";
            },2000)
        }).catch(e=>{
            console.error(e);
            const err = typeof e === 'string'?e:e.message;
            that.toast(err);
        })
    }

    render(): React.ReactNode {
        const {name,address,abi,showToast,toastMsg} = this.state;
        console.log(abi);
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton defaultHref="#/" />
                        </IonButtons>
                        <IonTitle>Add Contract</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonList>
                        <IonItemDivider>
                            <IonLabel>Name</IonLabel>
                        </IonItemDivider>
                        <IonItem lines={"none"}>
                            <IonTextarea rows={1} value={name} placeholder="Customer Contract name" onIonChange={e => this.setName(e.detail.value!)}/>
                        </IonItem>

                        <IonItemDivider>
                            <IonLabel>Abi</IonLabel>
                        </IonItemDivider>
                        <IonItem lines={"none"}>
                            <IonTextarea rows={5} value={abi} placeholder="Contract Abi" onIonChange={e => this.setAbi(e.detail.value!)}/>
                        </IonItem>

                        <IonItemDivider>
                            <IonLabel>Address</IonLabel>
                        </IonItemDivider>
                        <IonItem lines={"none"}>
                            <IonTextarea rows={3} value={address} placeholder="Contract Address" onIonChange={e => this.setAddress(e.detail.value!)}/>
                        </IonItem>
                    </IonList>
                </IonContent>
                <div style={{width:"100%",position:"fixed",bottom:0}}>
                    <IonButton onClick={()=>{this.confirm()}} expand={"block"}>{i18n.t('Next')}</IonButton>
                </div>

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={this.hideToast}
                    //@ts-ignore
                    message={toastMsg}
                    duration={2000}
                    color={"dark"}
                />
            </IonPage>
        )
    }
}

export default Add