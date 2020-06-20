import { Table } from './Table';
// declare const window: any;
export class PopDB {
    constructor(config) {
        const { databaseName, tables } = config;
        this.name = databaseName;
        this.tables = tables;
        this.createTable(this.tables);
    }
    createDateBase(name, version = 1) {
        // const indb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        this.openedDB = indexedDB.open(name, version);
    }
    createTable(tables, version = 1) {
        // const indb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        const conn_request = indexedDB.open(this.name, version);
        conn_request.onupgradeneeded = (ev) => {
            const db = ev.target.result;
            tables.forEach((table) => {
                const hadTableNames = Array.from(db.objectStoreNames);
                if (!hadTableNames.includes(table.name)) {
                    const table_info = db.createObjectStore(table.name, {
                        keyPath: table.keyPath,
                        autoIncrement: table.autoIncrement,
                    });
                    table.indexes.forEach(item => {
                        this.createIndex(table_info, item);
                    });
                }
            });
        };
    }
    deleteTable(tableName, version) {
        // const indb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.indexedDB
        const conn_request = indexedDB.open(this.name, version);
        conn_request.onupgradeneeded = (ev) => {
            const db = ev.target.result;
            if (ev.oldVersion < version) {
                db.deleteObjectStore(tableName);
            }
        };
    }
    // create index
    createIndex(table, option) {
        let optionPramas = {};
        if (option.unique) {
            optionPramas['unique'] = option.unique;
        }
        if (option.multiEntry) {
            optionPramas['multiEntry'] = option.multiEntry;
        }
        table.createIndex(option.index, option.relativeIndex, optionPramas);
    }
    connect() {
        return new Promise((resolve, reject) => {
            // const indb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
            const conn_request = indexedDB.open(this.name, this.version);
            conn_request.onsuccess = (ev) => {
                resolve(ev.target.result);
            };
            conn_request.onerror = (ev) => {
                reject(ev);
            };
        });
    }
    close() {
        this.connect().then((db) => {
            db.close();
        });
    }
    insert(name, data) {
        return new Promise((resolve, reject) => {
            this.connect().then((db) => {
                const table = new Table(name, db);
                table
                    .insert(data)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }
    select(name, selecter) {
        return new Promise((resolve, reject) => {
            this.connect().then((db) => {
                const table = new Table(name, db);
                table
                    .select(selecter)
                    .then((res) => {
                    resolve(res);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        });
    }
    selectId(name, id) {
        return new Promise((resolve, reject) => {
            this.connect().then((db) => {
                const table = new Table(name, db);
                table
                    .selectId(id)
                    .then((res) => {
                    resolve(res);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        });
    }
    some(name, selecter, count) {
        return new Promise((resolve, reject) => {
            this.connect().then((db) => {
                const table = new Table(name, db);
                table
                    .some(selecter, count)
                    .then((res) => {
                    resolve(res);
                })
                    .catch((error) => {
                    reject(error);
                });
            });
        });
    }
    update(name, data) {
        return new Promise((resolve, reject) => {
            this.connect().then((db) => {
                const table = new Table(name, db);
                table
                    .update(data)
                    .then((res) => {
                    resolve(res);
                })
                    .catch((err) => {
                    // reject(err)
                    console.log(err);
                    resolve(null);
                });
            });
        });
    }
    delete(name, data) {
        // console.log("delete >>>> ",name,data);
        return new Promise((resolve, reject) => {
            this.connect().then((db) => {
                const table = new Table(name, db);
                table
                    .delete(data)
                    .then((res) => {
                    resolve(res);
                })
                    .catch((err) => {
                    console.log(err);
                    resolve(null);
                });
            });
        });
    }
    selectAll(name) {
        return new Promise((resolve, reject) => {
            this.connect().then((db) => {
                const table = new Table(name, db);
                table
                    .selectAll()
                    .then((res) => {
                    resolve(res);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        });
    }
    clearTable(name) {
        return new Promise((resolve, reject) => {
            this.connect().then((db) => {
                const table = new Table(name, db);
                table
                    .clear()
                    .then((res) => {
                    resolve(res);
                })
                    .catch((error) => {
                    reject(error);
                });
            });
        });
    }
}
//# sourceMappingURL=PopDB.js.map