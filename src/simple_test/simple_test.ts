// export const colorize = new (
class Kolorize {
    color = (code: number|string, ended = false, ...messages: any[]) =>
      `\x1b[${code}m${messages.join(" ")}${ended ? "\x1b[0m" : ""}`;
    black = this.color.bind(null, 30, false);
    red = this.color.bind(null, 31, false);
    green = this.color.bind(null, 32, false);
    yellow = this.color.bind(this, 33, false);
    blue = this.color.bind(this, 34, false);
    magenta = this.color.bind(this, 35, false);
    cyan = this.color.bind(this, 36, false);
    white = this.color.bind(this, 37, false);
    bgBlack = this.color.bind(this, 40, true);
    bgRed = this.color.bind(this, 41, true);
    bgGreen = this.color.bind(this, 42, true);
    bgYellow = this.color.bind(this, 43, true);
    bgBlue = this.color.bind(this, 44, true);
    bgMagenta = this.color.bind(this, 45, true);
    bgCyan = this.color.bind(this, 46, true);
    bgWhite = this.color.bind(this, 47, true);
    bold = this.color.bind(this, 27, true);
    greenBold = this.color.bind(this, "32;1", true);
    redBold = this.color.bind(this, "31;1", true);
  }
export const colorize = new Kolorize();

  //https://stackoverflow.com/questions/4842424/list-of-ansi-color-escape-sequences  
  
  const color = colorize;

let listOfTests: [string, () => void][] = []
let listOfFails: Error[] = []
let assertionCount = 0 

export const assert = {
    isTrue: function isTrue(condition: boolean) {
        assertionCount++
        if(!condition) {
            throw new Error("assert failed")
        }
    }
}
export function describe(label: string, f:() => void) {
    listOfTests.push([label, f])
}
export function run() {
    let count = 0
    listOfTests.forEach((t) => {
        const [label, f] = t
        count++
        try {
            f()
        } catch(e) {
            const ee = e as Error
            listOfFails.push(ee)

            console.log(color.redBold((`\nassertion failed label: ${label}`)))
            // console.log(ee)
            
            // console.log(e)
        }
    })
    if(listOfFails.length === 0) {
        console.log(color.greenBold(`\nSuccess Tests: ${count} Assertions: ${assertionCount}\n`))
    } else {
        console.log(color.redBold(`\nTests: ${count}  assertions: ${assertionCount} fails: ${listOfFails.length} \n`))
        listOfFails.forEach((el) => {
            const e = el as Error
            console.log(e)
        })
    }
}
