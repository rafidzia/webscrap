var fs = require('fs');
var http = require('http');

function requestData(noDaftar, callback){
    var options = {
        host: 'api.siap-ppdb.com',
        port: '80',
        path: '/cari?no_daftar=' + noDaftar,
        method: 'POST',
        headers: {
            'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36',
            'Host' : 'api.siap-ppdb.com',
            'Accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
        }
    }
    http.get(options, function(res){
        let data = ''
        res.on('data', function(chunk){
            data += chunk;
        });
        res.on('end', function(){
            callback(JSON.parse(data))
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}

fs.readFile('SCRAP.csv', function(err, data){
    if(err) throw err;
    var arrData = String(data).split('\n');

    //remove last empty line string
    arrData.pop();
    
    var header = arrData.shift();
    var countRequest = 0;
    var arrNilai = []
    var arrUrutanNilai = []
    var arrNoDaftar = []
    for(let i = 0; i < arrData.length; i++){
        let arrDataPerbaris = arrData[i].split(";");
        arrNoDaftar.push(arrDataPerbaris[1]);
        requestData(arrDataPerbaris[1], function(data){
            var nilaiMTK = data[2][3][1][3][0];
            arrNilai.push(nilaiMTK);
            var nd = data[5][3][0][3]

            //error prevent
            if(typeof nd == "object"){
                nd = data[4][3][0][3]
            }
            if(typeof nd == 'string' && nd.length > 14){
                nd = data[6][3][0][3]
            }

            arrUrutanNilai.push({nm : nilaiMTK, nd : nd});
            countRequest++;
            if(countRequest == arrData.length){
                proceed()
            }
        })
    }

    function proceed(){
        arrNilai.sort(function(a, b){return a-b})
        var result = [];
        for(let i = 0; i < arrNilai.length; i++){

            let indexMtk = arrUrutanNilai.map(function(val){return val.nm}).indexOf(arrNilai[i]);
            let noDaftar = arrUrutanNilai.map(function(val){return val.nd})[indexMtk];
            let index = arrNoDaftar.indexOf(noDaftar);
            let trueData = arrData[index].split(";");

            //removing space/unknown character in name
            trueData[2] = trueData[2].slice(0, -1); 

            //adding ' so it consider as string in excel
            trueData[1] = "'" + trueData[1];

            //replace number
            trueData.shift(); 
            trueData.unshift(i + 1); 

            //insert math score and move url field
            let urlData = trueData.pop();
            trueData.push(arrNilai[i])
            trueData.push(urlData);

            result.push(trueData.join(','))

            //set to -1 so there is no duplicate person
            arrUrutanNilai[indexMtk] = -1;
        }

        
        //insert math score field and move url field
        header = header.split(";");
        var urlHeader = header.pop();
        header.push("NILAI MTK");
        header.push(urlHeader);

        // retrive and replace header
        result.unshift(header.join(","));

        result = result.join("\n");

        fs.writeFile('RESULT.csv', result, function(err){
            if(err) throw err;
        })
    }
})