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
    for(let i = 0; i < arrData.length; i++){
        let arrDataPerbaris = arrData[i].split(";");
        requestData(arrDataPerbaris[1], function(data){
            var nilaiMTK = data[2][3][1][3][0];
            arrNilai.push(nilaiMTK);
            arrUrutanNilai.push(nilaiMTK);
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
            let index = arrUrutanNilai.indexOf(arrNilai[i]);
            let trueData = arrData[index].split(";");

            //removing space/unknown character in name
            trueData[2] = trueData[2].slice(0, -1); 

            //adding ' so it consider as string in excel
            trueData[1] = "'" + trueData[1];

            //replace number
            trueData.shift(); 
            trueData.unshift(i + 1); 

            let urlData = trueData.pop();
            trueData.push(arrNilai[i])
            trueData.push(urlData);

            result.push(trueData.join(','))
        }

        // retrive and replace header
        header = header.split(";");
        var urlHeader = header.pop();
        header.push("NILAI MTK");
        header.push(urlHeader);
        result.unshift(header.join(","));

        result = result.join("\n");

        fs.writeFile('RESULT.csv', result, function(err){
            if(err) throw err;
        })
    }
})