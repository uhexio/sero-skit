import { Database, DatabaseTable } from './types';
import { PopDB } from './PopDB';

class Dao {

    _db: PopDB = new PopDB(dbConfig);

    async add(c:ContractModel) {
        await this._db.insert(contract.name, c);
    }

    async detail(address: string): Promise<ContractModel | null> {
        const that = this;
        return new Promise<ContractModel | null>((resolve, reject) => {
            that._db
                .select(contract.name, { address: address })
                .then((rest: any) => {
                    const c: ContractModel = rest[0];
                    resolve(c);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    list(): Promise<Array<ContractModel> | null> {
        const that = this;
        return new Promise<Array<ContractModel>>((resolve, reject) => {
            that._db.selectAll(contract.name).then((rest:any)=>{
                resolve(rest)
            }).catch(e=>{
                reject(e)
            });

        });
    }

    update(c: ContractModel): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const that = this;
            that._db
                .update(contract.name, c)
                .then(() => {
                    resolve();
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    delete(address:string):Promise<void>{
        const that = this;
        return new Promise<void>((resolve, reject) => {
            that._db.delete(contract.name,{address:address}).then(()=>{
                resolve()
            }).catch((e)=>{
                reject(e)
            })
        })
    }
}

export interface ContractModel {
    address:string
    name:string
    abi:string
    createdAt:number
    hash?:string
    type:string
}

const contract: DatabaseTable = {
    name: 'contract',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
        {
            index: 'address',
            relativeIndex: 'address',
            unique: true,
        },
        {
            index: 'name',
            relativeIndex: 'name',
            unique: false,
        },
        {
            index: 'abi',
            relativeIndex: 'abi',
            unique: false,
        },
        {
            index: 'createdAt',
            relativeIndex: 'createdAt',
            unique: false,
        },
        {
            index: 'hash',
            relativeIndex: 'hash',
            unique: false,
        },
        {
            index: 'type',
            relativeIndex: 'type',
            unique: false,
        },
    ],
};

const dbConfig: Database = {
    databaseName: 'contract',
    tables: [contract],
    version: 1,
};

const dao = new Dao();
export default dao
