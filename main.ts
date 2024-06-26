onst typeColors: any = {
    "名": "#8a1a12",
    "代名": "#8a1a12",
    "動": "#8a6612",
    "形": "#568a12",
    "副": "#128a34",
    "助": "#12788a",
    "助動": "#123c8a",
    "感": "#8A1288",
    "接": "#303030",
    "数": "#5a128a",
    "情": "#8A5112",
    "前置": "#3F2508",
}

let presentPage = 1
const wordInOnePage = 30
let totalPages: number

let searchTypeElem: HTMLSelectElement
let searchRuleElem: HTMLSelectElement

let searchType: string = "word"
let searchRule: string = "part"
let searchText: string = ""

let prevButton: HTMLButtonElement
let nextButton: HTMLButtonElement
let firstButton: HTMLButtonElement
let lastButton: HTMLButtonElement

let pagesBox: HTMLElement

let searchBox: HTMLInputElement

// XMLHttpRequestを使ってjsonデータを読み込む
let requestURL = './dict/dict.json';//jsonへのパス
let request = new XMLHttpRequest();
request.open('GET', requestURL);
request.responseType = 'json';
request.send();
 
// JSONデータをJavaScriptオブジェクトに変換
request.onload = async function() {
    let data = request.response;
    data = JSON.parse(JSON.stringify(data));
    writeDict(data, presentPage)

    totalPages = Math.ceil(data.length / wordInOnePage)

    searchBox = <HTMLInputElement> document.getElementById("input")

    let numberBox = document.getElementById("numberofwords")
    let numberBoxJP = document.getElementById("numberofwordsjp")

    prevButton.addEventListener("click", () => {
        presentPage--
        writeDict(data, presentPage, searchText, searchType, searchRule)
        moveBottom()
    })
    nextButton.addEventListener("click", () => {
        presentPage++
        writeDict(data, presentPage, searchText, searchType, searchRule)
        moveBottom()
    })
    firstButton.addEventListener("click", () => {
        presentPage = 1
        writeDict(data, presentPage, searchText, searchType, searchRule)
        moveBottom()
    })
    lastButton.addEventListener("click", () => {
        presentPage = totalPages
        writeDict(data, presentPage, searchText, searchType, searchRule)
        moveBottom()
    })

    searchTypeElem = <HTMLSelectElement> document.getElementById("searchtype")
    searchRuleElem = <HTMLSelectElement> document.getElementById("searchrule")

    searchBox.addEventListener("input", () => {
        searchDict(data)
    })
    searchTypeElem.addEventListener("input", () => {
        searchDict(data)
    })
    searchRuleElem.addEventListener("input", () => {
        searchDict(data)
    })

    numberBox!.innerHTML = "之時 " + toPhunnum(data.length.toString(12)) + "言"
    numberBoxJP!.innerHTML = "現在：" + data.length + "語"
}

function searchDict(data: any){
    searchType = searchTypeElem.value
    searchRule = searchRuleElem.value
    searchText = searchBox.value

    presentPage = 1
    writeDict(data, presentPage, searchText, searchType, searchRule)
}

function searchWithRule(word: string, filter: string, rule: string){
    switch(rule){
        case "part":
            return word.includes(filter)
        case "start":
            return word.startsWith(filter)
        case "end":
            return word.endsWith(filter)
        case "perfect":
            return word == filter
        case "regular":
            const reg = new RegExp(filter)
            return reg.test(word)
    }
}

function writeDict(dict: object[], page: number, filter: string = "", type: string = "word", rule: string = "part") {
    prevButton = <HTMLButtonElement> document.getElementById("prev")
    nextButton = <HTMLButtonElement> document.getElementById("next")
    firstButton = <HTMLButtonElement> document.getElementById("first")
    lastButton = <HTMLButtonElement> document.getElementById("last")

    dict.sort((a: any, b: any) => {
        if (a.word > b.word){
            return 1;
        }else if (a.word < b.word){
            return -1;
        }else{
            return 0;
        }
    })

    const filtedWords = dict.filter((w: any) => {
        if (type == "mean") {
            const isMeanIncludes = w["mean"].some((m: any) => {
                return searchWithRule(m["explanation"], filter, rule)
            })
            const isAppendIncludes = w["append"].some((a: any) => {
                return searchWithRule(a["explanation"], filter, rule)
            })
            return isMeanIncludes || isAppendIncludes
        }

        return searchWithRule(w[type], filter, rule) //mean以外の時はこっち
    })

    totalPages = Math.ceil(filtedWords.length / wordInOnePage)
    pagesBox = <HTMLElement> document.getElementById("pageNum")

    pagesBox!.innerHTML = totalPages < 1? "No results": `${presentPage}/${totalPages}`
        
    const hidePrev = presentPage <= 1
    const hideNext = presentPage >= totalPages

    if (hidePrev) {
        prevButton.classList.add("hidebutton")
        firstButton.classList.add("hidebutton")
    } else {
        prevButton.classList.remove("hidebutton")
        firstButton.classList.remove("hidebutton")
    }
    if (hideNext) {
        nextButton.classList.add("hidebutton")
        lastButton.classList.add("hidebutton")
    } else {
        nextButton.classList.remove("hidebutton")
        lastButton.classList.remove("hidebutton")
    }

    const dictInPage = filtedWords.filter((a, idx) => {
        return Math.floor(idx / wordInOnePage) + 1 == page
    })

    const contentBox = document.getElementById("contentbox")

    let dictHTML = ""

    dictInPage.forEach((w: any) => {
        let meanHTML = ""

        w.mean.forEach((m: any) => {
            const type: string = m.partOfSpeech //品詞
            meanHTML += `
            <div class="speech">
                <span class="type" style="background-color: ${typeColors[type]}">
                    ${type}
                </span>
                <span class="text">${m.explanation}</span>
            </div>
            `
        })

        let appendHTML = ""

        if (w.append[0].type != "") {
            appendHTML += '<div class="mean">'
            w.append.forEach((a: any) => {
                appendHTML += `
                <div class="speech">
                    <span class="apptype">${a.type}</span>
                    <span class="text">${a.explanation}</span>
                </div>
                `
            })
            appendHTML += '</div>'
        }

        const numHTML = w.num == "-"? "": `#${w.num}`

        let wordHTML = `
        <div class="content">
            <div class="word">
                <span class="phun">${w.word}</span>
                <span class="trans">${w.word}</span>
                <span class="pron">/${w.pron}/</span>
                <span class="weqo">${w.pron}</span>
                <span class="num">${numHTML}</span>
            </div>
            <div class="mean">
                ${meanHTML}
            </div>
            ${appendHTML}
        </div>
        `
        
        dictHTML += wordHTML
    })

    contentBox!.innerHTML = dictHTML
}

function moveBottom() { //ページ最下部へ移動
    /*
    const a = document.documentElement;
    const y = a.scrollHeight - a.clientHeight;
    window.scroll(0, y);
    */
    window.scroll({top: 0});
}

function toPhunnum(num: string) {
    const PhunNum: any = {
        "0": "〇",
        "1": "〡",
        "2": "〢",
        "3": "〣",
        "4": "〤",
        "5": "〥",
        "6": "〦",
        "7": "〧",
        "8": "〨",
        "9": "〩",
        "a": "〹",
        "b": "〺",
        ".": "・",
