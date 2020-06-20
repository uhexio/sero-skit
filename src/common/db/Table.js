export class Table {
    constructor(name, db) {
        this.name = name;
        this.db = db;
    }
    // create transaction
    transaction(mode = true) {
        return this.db.transaction([this.name], mode === true ? 'readwrite' : 'readonly');
    }
    // open or conntect this table
    request() {
        return this.transaction().objectStore(this.name);
    }
    // get
    select(selector) {
        let index;
        let indexValue;
        for (let name in selector) {
            index = name;
            indexValue = selector[name];
        }
        return new Promise((resolve, reject) => {
            const selectRequest = this.request()
                .index(index)
                .getAll(indexValue);
            selectRequest.onsuccess = (e) => {
                resolve(e.target.result);
            };
            selectRequest.onerror = (e) => {
                reject(e.target.result);
            };
        });
    }
    selectId(id) {
        return new Promise((resolve, reject) => {
            const selectRequest = this.request().get(id);
            selectRequest.onsuccess = (e) => {
                resolve(e.target.result);
            };
            selectRequest.onerror = (e) => {
                reject(e.target.result);
            };
        });
    }
    selectAll() {
        return new Promise((resolve, reject) => {
            const selectRequest = this.request().getAll();
            selectRequest.onsuccess = (e) => {
                resolve(e.target.result);
            };
            selectRequest.onerror = (e) => {
                reject(e.target.result);
            };
        });
    }
    // some
    some(selector, count) {
        let index;
        let indexValue;
        for (let name in selector) {
            index = name;
            indexValue = selector[name];
        }
        return new Promise((resolve, reject) => {
            const temp = [];
            const cursor = this.request().index(index);
            // const range = IDBKeyRange.lowerBound("_")
            cursor.openCursor(indexValue, 'prev').onsuccess = (ev) => {
                const res = ev.target.result;
                // console.log("res>>>>>",res);
                if (res) {
                    temp.push(res.value);
                    if (temp.length < count) {
                        res.continue();
                    }
                    else {
                        resolve(temp);
                    }
                }
                else {
                    resolve(temp);
                }
            };
        });
    }
    // put
    update(data) {
        return new Promise((resolve, reject) => {
            const updateRequest = this.request().put(data);
            updateRequest.onsuccess = (e) => {
                resolve(e);
            };
            updateRequest.onerror = (e) => {
                reject(e);
            };
        });
    }
    // add
    insert(data) {
        return new Promise((resolve, reject) => {
            const addRequest = this.request().add(data);
            addRequest.onsuccess = (e) => {
                resolve(e);
            };
            addRequest.onerror = (e) => {
                reject(e);
            };
        });
    }
    // get -> delete
    delete(selector) {
        return new Promise((resolve, reject) => {
            this.select(selector).then((res) => {
                if (res.length) {
                    res.forEach((item, index, arr) => {
                        const request = this.request();
                        const keyPath = request.keyPath;
                        const deleteRequest = request.delete(item[keyPath]);
                        deleteRequest.onsuccess = (e) => {
                            if (index === arr.length - 1) {
                                resolve(e);
                            }
                        };
                        deleteRequest.onerror = (e) => {
                            reject(e);
                        };
                    });
                }
            });
        });
    }
    clear() {
        return new Promise((resolve, reject) => {
            const deleteRequest = this.request().clear();
            deleteRequest.onsuccess = (e) => {
                resolve(e);
            };
            deleteRequest.onerror = (e) => {
                reject(e);
            };
        });
    }
}
//# sourceMappingURL=Table.js.map