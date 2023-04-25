class Fred {
    constructor() {
        this.f = 1
    }
    static staticfunction(i) {
        let obj = new Fred()
        this.f = i
        return obj
    }
}
let x = new Fred()
console.log(Fred)
console.log(Fred, x)