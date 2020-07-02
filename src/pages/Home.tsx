import * as React from 'react';
import {IonList,IonItem,IonLabel,IonButton,IonText,IonContent,IonPage,IonCard,IonCardHeader,IonCardSubtitle,IonAlert,
    IonFabList,IonRow,IonCol,
    IonIcon,IonFabButton,IonFab,IonCardTitle,IonCardContent} from '@ionic/react'
import {add,addOutline, trashOutline,duplicateOutline,documentTextOutline} from 'ionicons/icons';
import dao, {ContractModel} from "../common/db/Dao";
import service from "../common/service";
import BigNumber from "bignumber.js";

interface State {
    list:Array<ContractModel>,
    showAlert:boolean,
    address:string
}
class Home extends React.Component<State, any>{

    state:State = {
        list:[],
        showAlert:false,
        address:''
    }

    componentDidMount(): void {

        service.initApp();

        const that = this;
        that.getContractAll().catch()

        let intervalId:any = sessionStorage.getItem("getContractAllId");
        if(!intervalId){
            intervalId = setInterval(function () {
                that.getContractAll().catch()
            },5*1000)
            sessionStorage.setItem("getContractAllId",intervalId)
        }
    }

    async getContractAll(){
        const that = this;
        const rest:any = await dao.list();
        const list:Array<ContractModel> =[];
        for(let c of rest){
            const ct = c;
            if(c.address.length === 66){
                const result:any = await service.jsonRpc("sero_getTransactionReceipt",[c.hash])
                if(result){
                    if(new BigNumber(result.status).comparedTo(0) === 1){
                        ct.address =  result.contractAddress;
                        dao.update(ct).catch()
                    }
                }
            }
            list.push(ct)
        }
        that.setState({
            list:list
        })

    }

    remove(){
        const {address} = this.state;
        const that = this;
        dao.delete(address).then(()=>{
            that.getContractAll().catch();
        })
    }

    renderList = ()=>{
        const h:Array<any> = [];
        const {list} = this.state;
        if(list && list.length>0){
            for (let c of list){
                h.push(
                    <IonCard>
                        <IonCardHeader>
                            <IonRow>
                                <IonCol><IonCardTitle>{c.name}</IonCardTitle></IonCol>
                                <IonCol style={{textAlign:'right'}}><IonIcon color={"warning"} icon={trashOutline} size={"large"} onClick={()=>{
                                    this.showConfirm(c.address);
                                }}/></IonCol>
                            </IonRow>
                        </IonCardHeader>
                        <IonCardContent  onClick={()=>{
                            if(c.address.length === 66){
                            }else{
                                window.location.href="#/load/"+c.address
                            }
                        }}>
                            {c.address}
                        </IonCardContent>
                    </IonCard>
                )
            }
        }
        if(h.length == 0 ){
            return <IonText color={"light"} >
                <p style={{textAlign:'center',fontSize:"24px"}}>
                    <IonIcon icon={documentTextOutline} style={{width:"100px",height:"100px"}}/><br/>No Data</p>
            </IonText>
        }
        return h
    }

    showConfirm(address:string){
        this.setState({
            address:address,
            showAlert:true
        })
    }

    setShowAlert(f:boolean){
        this.setState({
            showAlert:f
        })
    }

    render(): React.ReactNode {

        const list = this.renderList();

        const {showAlert} = this.state;
        return (
            <IonPage>
                <IonContent>
                    {list}
                    <IonFab vertical="bottom" horizontal="end" slot="fixed">
                        <IonFabButton>
                            <IonIcon icon={add} />
                        </IonFabButton>
                        <IonFabList side="top" >
                            <IonFabButton  color={"danger"} onClick={()=>{
                                window.location.href="#/deploy"
                            }}><IonIcon icon={addOutline}/></IonFabButton>
                        </IonFabList>
                        <IonFabList side="start">
                            <IonFabButton  color={"tertiary"}  onClick={()=>{
                                window.location.href="#/add"
                            }}><IonIcon icon={duplicateOutline} /></IonFabButton>
                        </IonFabList>
                    </IonFab>
                </IonContent>

                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={() => this.setShowAlert(false)}
                    cssClass='my-custom-class'
                    header={'Confirm'}
                    message={'<strong>You can add it again after deleting !</strong>'}
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            cssClass: 'secondary',
                            handler: blah => {
                                console.log('Confirm Cancel: blah');
                            }
                        },
                        {
                            text: 'Okay',
                            handler: () => {
                                this.remove()
                            }
                        }
                    ]}
                />

            </IonPage>
        );
    }
}

export default Home