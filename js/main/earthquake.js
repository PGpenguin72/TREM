let Lat = 25.0421407
let Long = 121.5198716
let audioList = []
let audioLock = false
let ReportCache = {}
let ReportMark = null
let ReportMarkID = null
let MarkList = []
let EarthquakeList = {}
let Break = false
let UUID = uuid()
let marker = null
let map
let Station = {}
let PGA = {}
let pga = {}
let PGAaudio = false
let PGALock = 0
let EEW = false

//#region 初始化
init()
function init() {
    var roll = document.getElementById("rolllist")
    roll.style.height = window.innerHeight
    var MAP = document.getElementById("map")
    MAP.style.height = window.innerHeight

    map = L.map('map', {
        attributionControl: false,
        closePopupOnClick: false
    }).setView([23, 121], 7.5)

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 14,
        id: 'mapbox/dark-v10',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map)

    
    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    
    function success(pos) {
        var crd = pos.coords;
        Lat = Number(crd.latitude)
        Long = Number(crd.longitude)
        Loc()
        console.log(`誤差 ${crd.accuracy} 公尺`);
    }
    
    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }
    
    navigator.geolocation.getCurrentPosition(success, error, options);

    Loc()

    ReportGET()

    fetch('https://raw.githubusercontent.com/ExpTechTW/API/master/Json/earthquake/station.json')
        .then(function (response) {
            return response.json()
        })
        .then(async function (station) {
            fetch('https://raw.githubusercontent.com/ExpTechTW/API/master/Json/earthquake/pga.json')
                .then(function (response) {
                    return response.json()
                })
                .then(async function (PGAjson) {
                    setInterval(async () => {
                        let data = {
                            "APIkey": "https://github.com/ExpTechTW",
                            "Function": "data",
                            "Type": "TREM",
                            "FormatVersion": 1,
                        }

                        axios.post('https://exptech.mywire.org:1015', data)
                            .then(function (response) {
                                let Json = response.data["response"]
                                pga = {}
                                for (let index = 0; index < Object.keys(Json).length; index++) {
                                    Sdata = Json[Object.keys(Json)[index]]
                                    let amount = 0;
                                    for (let Index = 0; Index < Sdata["MaxPGA"].length; Index++) {
                                        if (Number(Sdata["MaxPGA"][Index]) > amount) amount = Number(Sdata["MaxPGA"][Index])
                                    }
                                    let Intensity = 0
                                    if (new Date().getTime() - Sdata["TimeStamp"] > 1500) {
                                        Intensity = "NA"
                                    } else if (amount >= 800) {
                                        Intensity = 9
                                    } else if (amount >= 440) {
                                        Intensity = 8
                                    } else if (amount >= 250) {
                                        Intensity = 7
                                    } else if (amount >= 140) {
                                        Intensity = 6
                                    } else if (amount >= 80) {
                                        Intensity = 5
                                    } else if (amount >= 25) {
                                        Intensity = 4
                                    } else if (amount >= 8) {
                                        Intensity = 3
                                    } else if (amount >= 5) {
                                        Intensity = 2
                                    } else if (amount >= 3.5) {
                                        Intensity = 1
                                    }
                                    var myIcon = L.icon({
                                        iconUrl: `./image/main/${Intensity}.png`,
                                        iconSize: [10, 10],
                                    })
                                    ReportMark = L.marker([station[Object.keys(Json)[index]]["Lat"], station[Object.keys(Json)[index]]["Long"]], { icon: myIcon })
                                    let Level = ""
                                    if (Intensity == 5) {
                                        Level = "5-"
                                    } else if (Intensity == 6) {
                                        Level = "5+"
                                    } else if (Intensity == 7) {
                                        Level = "6-"
                                    } else if (Intensity == 8) {
                                        Level = "6+"
                                    } else if (Intensity == 9) {
                                        Level = "7"
                                    } else {
                                        Level = Intensity ?? "?"
                                    }
                                    let now = new Date(Sdata["TimeStamp"])
                                    let Now = (now.getMonth() + 1) +
                                        "/" + now.getDate() +
                                        " " + now.getHours() +
                                        ":" + now.getMinutes() +
                                        ":" + now.getSeconds() +
                                        ":" + now.getMilliseconds()
                                    if (Station[Object.keys(Json)[index]] != undefined) map.removeLayer(Station[Object.keys(Json)[index]])
                                    ReportMark.bindPopup(`站名: ${Object.keys(Json)[index]}<br>經度: ${station[Object.keys(Json)[index]]["Long"]}<br>緯度: ${station[Object.keys(Json)[index]]["Lat"]}<br>震度: ${Level}<br>MaxPGA: ${amount}<br>時間: ${Now}`)
                                    map.addLayer(ReportMark)
                                    //ReportMark.openPopup()
                                    Station[Object.keys(Json)[index]] = ReportMark
                                    if ((pga[station[Object.keys(Json)[index]]["PGA"]] == undefined || pga[station[Object.keys(Json)[index]]["PGA"]] < amount) && Intensity != "NA") pga[station[Object.keys(Json)[index]]["PGA"]] = Intensity
                                }
                                for (let index = 0; index < Object.keys(PGA).length; index++) {
                                    map.removeLayer(PGA[Object.keys(PGA)[index]])
                                    delete PGA[Object.keys(PGA)[index]]
                                }
                                for (let index = 0; index < Object.keys(pga).length; index++) {
                                    let Intensity = pga[Object.keys(pga)[index]]
                                    if (Intensity != 0) {
                                        let color = ""
                                        if (Intensity == 1) {
                                            color = "gray"
                                        } else if (Intensity == 2) {
                                            color = "#0066CC"
                                        } else if (Intensity == 3) {
                                            color = "#00BB00"
                                        } else if (Intensity == 4) {
                                            color = "#EAC100"
                                        } else if (Intensity == 5) {
                                            color = "#EA7500"
                                        } else if (Intensity == 6) {
                                            color = "#D94600"
                                        } else if (Intensity == 7) {
                                            color = "#A23400"
                                        } else if (Intensity == 8) {
                                            color = "#984B4B"
                                        } else if (Intensity == 9) {
                                            color = "#930093"
                                        }
                                        PGA[Object.keys(pga)[index]] = L.polygon(PGAjson[Object.keys(pga)[index].toString()], {
                                            color: color,
                                            fillColor: 'transparent',
                                        }).addTo(map)
                                        PGAaudio = true
                                    }
                                }
                                if (PGAaudio && EEW == false && new Date().getTime() - PGALock > 2000) {
                                    audioPlay(`./audio/main/PGA1.wav`)
                                    PGAaudio = false
                                    PGALock = new Date().getTime()
                                }
                            })
                            .catch(function (error) {
                                console.log(error)
                            })
                    }, 1000)
                })
        })
}
//#endregion

//#region 地震速報 連接 伺服器
if ("WebSocket" in window) {
    webSocket()
    async function webSocket() {
        var ws = new WebSocket("wss://exptech.mywire.org:1015")

        ws.onopen = async function () {
            ws.send(JSON.stringify({
                "APIkey": "https://github.com/ExpTechTW",
                "Function": "earthquakeService",
                "Type": "subscription",
                "FormatVersion": 1,
                "UUID": "UUID"
            }))
            console.log("UUID >> " + UUID)
        }

        ws.onmessage = async function (evt) {
            let json = JSON.parse(evt.data)
            if (json.Function == "report") {
                ReportGET()
            } else if (json.Function == "earthquake") {
                if (audioList.length != 0) {
                    Break = true
                    audioList = []
                    let t = setInterval(() => {
                        if (Break == false) {
                            clearInterval(t)
                            handler()
                        }
                    }, 100);
                } else {
                    handler()
                }
                async function handler() {
                    EEW = true
                    audioPlay("./audio/main/1/alert.wav")
                    let point = Math.sqrt(Math.pow(Math.abs(Lat + (Number(json.NorthLatitude) * -1)) * 111, 2) + Math.pow(Math.abs(Long + (Number(json.EastLongitude) * -1)) * 101, 2))
                    let distance = Math.sqrt(Math.pow(Number(json.Depth), 2) + Math.pow(point, 2))
                    let value = Math.round((distance - ((new Date().getTime() - json.Time) / 1000) * 3.5) / 3.5)

                    let level = "0"
                    let PGA = (1.657 * Math.pow(Math.E, (1.533 * json.Scale)) * Math.pow(distance, -1.607)).toFixed(3)
                    if (PGA >= 800) {
                        level = "7"
                    } else if (800 >= PGA && 440 < PGA) {
                        level = "6+"
                    } else if (440 >= PGA && 250 < PGA) {
                        level = "6-"
                    } else if (250 >= PGA && 140 < PGA) {
                        level = "5+"
                    } else if (140 >= PGA && 80 < PGA) {
                        level = "5-"
                    } else if (80 >= PGA && 25 < PGA) {
                        level = "4"
                    } else if (25 >= PGA && 8 < PGA) {
                        level = "3"
                    } else if (8 >= PGA && 2.5 < PGA) {
                        level = "2"
                    } else if (2.5 >= PGA && 0.8 < PGA) {
                        level = "1"
                    } else {
                        level = "0"
                    }
                    audioPlay(`./audio/main/1/${level.replace("+", "").replace("-", "")}.wav`)
                    if (level.includes("+")) {
                        audioPlay(`./audio/main/1/intensity-strong.wav`)
                    } else if (level.includes("-")) {
                        audioPlay(`./audio/main/1/intensity-weak.wav`)
                    } else {
                        audioPlay(`./audio/main/1/intensity.wav`)
                    }
                    if (value > 0) {
                        if (value <= 10) {
                            audioPlay(`./audio/main/1/${value.toString()}.wav`)
                        } else if (value < 20) {
                            audioPlay(`./audio/main/1/x${value.toString().substring(1, 2)}.wav`)
                        } else {
                            audioPlay(`./audio/main/1/${value.toString().substring(0, 1)}x.wav`)
                            audioPlay(`./audio/main/1/x${value.toString().substring(1, 2)}.wav`)
                        }
                        audioPlay(`./audio/main/1/second.wav`)
                    }
                    let time = -1
                    let Stamp = 0
                    let Ding = 0
                    let t = setInterval(async () => {
                        if (Break == true) {
                            Break = false
                            clearInterval(t)
                        }
                        value = Math.round((distance - ((new Date().getTime() - json.Time) / 1000) * 3.5) / 3.5)
                        if (Stamp != value) {
                            Stamp = value
                            if (time >= 0) {
                                audioPlay(`./audio/main/1/ding.wav`)
                                time++
                                if (time >= 10) {
                                    EEW = false
                                    clearInterval(t)
                                }
                            } else {
                                if (value > 10) {
                                    if (value.toString().substring(1, 2) == "0") {
                                        audioPlay(`./audio/main/1/${value.toString().substring(0, 1)}x.wav`)
                                        audioPlay(`./audio/main/1/x0.wav`)
                                    } else {
                                        if (Stamp <= Ding - 2 || Ding == 0) {
                                            Ding = Stamp
                                            audioPlay(`./audio/main/1/ding.wav`)
                                        }
                                    }
                                } else if (value > 0) {
                                    audioPlay(`./audio/main/1/${value.toString()}.wav`)
                                } else {
                                    audioPlay(`./audio/main/1/arrive.wav`)
                                    time = 0
                                }
                            }
                        }
                    }, 0)
                    if (ReportMarkID != null) {
                        map.removeLayer(ReportMark)
                        ReportMarkID = null
                    }
                    var myIcon = L.icon({
                        iconUrl: './image/main/cross.png',
                        iconSize: [30, 30],
                    })
                    let Cross = L.marker([Number(json.NorthLatitude), Number(json.EastLongitude)], { icon: myIcon })
                    Cross.bindPopup(`經度: ${json["EastLongitude"]}<br>緯度: ${json["NorthLatitude"]}<br>深度: ${json["Depth"]}<br>規模: ${json["Scale"]}<br>時間: ${json["UTC+8"] ?? "測試模式"}`)
                    EarthquakeList[json.Time] = Cross
                    map.addLayer(Cross)
                    Cross.openPopup()
                    map.setView([Number(json.NorthLatitude), Number(json.EastLongitude)], 7.5)
                    var Pcircle = null
                    var Scircle = null
                    let Loom = 0
                    let Timer = setInterval(async () => {
                        let T = json.Time
                        if (Pcircle != null) map.removeLayer(Pcircle)
                        Pcircle = L.circle([Number(json.NorthLatitude), Number(json.EastLongitude)], {
                            color: '#6FB7B7',
                            fillColor: 'transparent',
                            radius: Math.sqrt(Math.pow((new Date().getTime() - json.Time) * 6.5, 2) - Math.pow(Number(json.Depth) * 1000, 2))
                        })
                        map.addLayer(Pcircle)
                        if (Scircle != null) map.removeLayer(Scircle)
                        Scircle = L.circle([Number(json.NorthLatitude), Number(json.EastLongitude)], {
                            color: 'red',
                            fillColor: '#F8E7E7',
                            fillOpacity: 0.1,
                            radius: Math.sqrt(Math.pow((new Date().getTime() - json.Time) * 3.5, 2) - Math.pow(Number(json.Depth) * 1000, 2))
                        })
                        map.addLayer(Scircle)
                        if (new Date().getTime() - json.Time > 180000) {
                            map.removeLayer(Scircle)
                            map.removeLayer(Pcircle)
                            map.removeLayer(EarthquakeList[T])
                            clearInterval(Timer)
                            map.setView([Lat, Long], 7.5)
                        }
                        if ((new Date().getTime() - json.Time) * 6.5 > 250000 && Loom < 250000) {
                            Loom = 250000
                            map.setView([Number(json.NorthLatitude), Number(json.EastLongitude)], 7)
                        }
                    }, 100)
                }
            }
        }
        ws.onclose = function () {
            setTimeout(async () => {
                webSocket()
            }, 1000)
        }

        ws.onerror = function (err) {
            ws.close()
            setTimeout(async () => {
                webSocket()
            }, 1000)
        }
    }
} else {
    alert("你的瀏覽器不支援 WebSocket!")
}
//#endregion

//#region 用戶所在位置
function Loc() {
    if (marker != null) map.removeLayer(marker)
    marker = L.marker([Lat, Long])
    map.addLayer(marker)
    map.setView([Lat, Long], 7.5)
}
//#endregion

//#region 視窗大小刷新
window.onresize = function () {
    map.invalidateSize()
    var roll = document.getElementById("rolllist")
    roll.style.height = window.innerHeight
    var MAP = document.getElementById("map")
    MAP.style.height = window.innerHeight
    map.setView([Lat, Long], 7.5)
}
//#endregion

//#region 音頻播放
async function audioPlay(src) {
    audioList.push(src)

    let T = setInterval(async () => {
        if (audioLock == false) {
            audioLock = true
            if (audioList.length != 0) {
                Audio(audioList[0])
            } else {
                audioLock = false
                clearInterval(T)
            }
        }
    }, 0)

    function Audio(src) {
        audioLock = true
        audioList.splice(audioList.indexOf(src), 1)
        var audioDOM = document.getElementById("audio-player")
        audioDOM.src = src
        var promise = audioDOM.play()
        promise.then(resolve => {
            audioDOM.addEventListener("ended", function () {
                audioLock = false
            })
        }).catch(reject => {
        })
    }
}
//#endregion

//#region Report Data
function ReportGET() {
    let data = {
        "APIkey": "https://github.com/ExpTechTW",
        "Function": "data",
        "Type": "earthquake",
        "FormatVersion": 1,
        "Value": 100
    }

    axios.post('https://exptech.mywire.org:1015', data)
        .then(function (response) {
            ReportList(response.data)
        })
        .catch(function (error) {
            console.log(error)
        })
}
//#endregion

//#region Report 點擊
async function ReportClick(time) {
    if (ReportMarkID == time) {
        map.removeLayer(ReportMark)
        ReportMarkID = null
        for (let index = 0; index < MarkList.length; index++) {
            map.removeLayer(MarkList[index])
        }
    } else {
        ReportMarkID = time
        if (ReportMark != null) map.removeLayer(ReportMark)
        for (let index = 0; index < MarkList.length; index++) {
            map.removeLayer(MarkList[index])
        }
        for (let Index = 0; Index < ReportCache[time].data.length; Index++) {
            for (let index = 0; index < ReportCache[time].data[Index]["eqStation"].length; index++) {
                let data = ReportCache[time].data[Index]["eqStation"][index]
                var myIcon = L.icon({
                    iconUrl: `./image/main/${data["stationIntensity"]}.png`,
                    iconSize: [10, 10],
                })
                ReportMark = L.marker([Number(data["stationLat"]), Number(data["stationLon"])], { icon: myIcon })
                let Level = ""
                if (data["stationIntensity"] == 5) {
                    Level = "5-"
                } else if (data["stationIntensity"] == 6) {
                    Level = "5+"
                } else if (data["stationIntensity"] == 7) {
                    Level = "6-"
                } else if (data["stationIntensity"] == 8) {
                    Level = "6+"
                } else if (data["stationIntensity"] == 9) {
                    Level = "7"
                } else {
                    Level = data["stationIntensity"] ?? "?"
                }
                ReportMark.bindPopup(`站名: ${ReportCache[time].data[Index]["areaName"]} ${data["stationName"]}<br>經度: ${data["stationLon"]}<br>緯度: ${data["stationLat"]}<br>震度: ${Level}`)
                map.addLayer(ReportMark)
                MarkList.push(ReportMark)
            }
        }
        map.setView([Number(ReportCache[time].epicenterLat), Number(ReportCache[time].epicenterLon)], 7.5)
        var myIcon = L.icon({
            iconUrl: './image/main/star.png',
            iconSize: [30, 30],
        })
        ReportMark = L.marker([Number(ReportCache[time].epicenterLat), Number(ReportCache[time].epicenterLon)], { icon: myIcon })
        ReportMark.bindPopup(`編號: ${ReportCache[time]["earthquakeNo"]}<br>經度: ${ReportCache[time]["epicenterLon"]}<br>緯度: ${ReportCache[time]["epicenterLat"]}<br>深度: ${ReportCache[time]["depth"]}<br>規模: ${ReportCache[time]["magnitudeValue"]}<br>位置: ${ReportCache[time]["location"]}<br>時間: ${ReportCache[time]["originTime"]}`)
        map.addLayer(ReportMark)
        ReportMark.openPopup()
    }
}
//#endregion

//#region Report list
async function ReportList(Data) {
    for (let index = 0; index < Data["response"].length; index++) {
        let DATA = Data["response"][index]
        var roll = document.getElementById("rolllist")
        var Div = document.createElement("DIV")
        Div.style.height = "auto"
        Div.style.overflow = "hidden"
        Div.style.paddingRight = "3%"
        let Level = ""
        if (DATA["data"][0]["areaIntensity"] == 5) {
            Level = "5-"
        } else if (DATA["data"][0]["areaIntensity"] == 6) {
            Level = "5+"
        } else if (DATA["data"][0]["areaIntensity"] == 7) {
            Level = "6-"
        } else if (DATA["data"][0]["areaIntensity"] == 8) {
            Level = "6+"
        } else if (DATA["data"][0]["areaIntensity"] == 9) {
            Level = "7"
        } else {
            Level = DATA["data"][0]["areaIntensity"] ?? "?"
        }
        let msg = ""
        if (DATA["location"].includes("(")) {
            msg = DATA["location"].substring(DATA["location"].indexOf("(") + 1, DATA["location"].indexOf(")")).replace("位於", "")
        } else {
            msg = DATA["location"]
        }
        if (index == 0) {
            Div.innerHTML =
                `<div class="background" style="display: flex; align-items:center; padding:2%;padding-right: 1vh;">
                <div class="left" style="width:30%; text-align: center;">
                    <font color="white" size="3">最大震度</font><br><b><font color="white" size="7">${Level}</font></b>
                </div>
                <div class="middle" style="width:60%;">
                    <b><font color="white" size="4">${msg}</font></b>
                    <br><font color="white" size="2">${DATA["originTime"]}</font>
                    <br><b><font color="white" size="6">M${DATA["magnitudeValue"]} </font></b><br><font color="white" size="2"> 深度: </font><b><font color="white" size="4">${DATA["depth"]}km</font></b>
                </div>
            </div>`
        } else {
            Div.innerHTML =
                `<div class="background" style="display: flex; align-items:center;padding-right: 1vh;">
                <div class="left" style="width:20%; text-align: center;">
                    <b><font color="white" size="6">${Level}</font></b>
                </div>
                <div class="middle" style="width:60%;">
                    <b><font color="white" size="3">${msg}</font></b>
                    <br><font color="white" size="2">${DATA["originTime"]}</font>
                </div>
                <div class="right">
                <b><font color="white" size="5">M${DATA["magnitudeValue"]}</font></b>
                </div>
            </div>`
        }
        if (DATA["data"][0]["areaIntensity"] == 1) {
            Div.style.backgroundColor = "gray"
        } else if (DATA["data"][0]["areaIntensity"] == 2) {
            Div.style.backgroundColor = "#0066CC"
        } else if (DATA["data"][0]["areaIntensity"] == 3) {
            Div.style.backgroundColor = "#00BB00"
        } else if (DATA["data"][0]["areaIntensity"] == 4) {
            Div.style.backgroundColor = "#EAC100"
        } else if (DATA["data"][0]["areaIntensity"] == 5) {
            Div.style.backgroundColor = "#EA7500"
        } else if (DATA["data"][0]["areaIntensity"] == 6) {
            Div.style.backgroundColor = "#D94600"
        } else if (DATA["data"][0]["areaIntensity"] == 7) {
            Div.style.backgroundColor = "#A23400"
        } else if (DATA["data"][0]["areaIntensity"] == 8) {
            Div.style.backgroundColor = "#984B4B"
        } else if (DATA["data"][0]["areaIntensity"] == 9) {
            Div.style.backgroundColor = "#930093"
        }
        Div.addEventListener("click", function () {
            ReportCache[DATA["originTime"]] = Data["response"][index]
            ReportClick(DATA["originTime"])
        })
        roll.appendChild(Div)
    }
}
//#endregion

//document.cookie = `${JSON.stringify()}; expires=Thu, 18 Dec 2043 12:00:00 GMT; path=/`