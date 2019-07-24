var fs = require('fs');

fs.readFile('SCRAP.csv', function(err, data){
    if(err) throw err;
    var arrData = String(data).split('\n');

    //remove last empty line string
    arrData.pop();
    
    var header = arrData.shift();

    var arrNilai = [];
    var arrUrutanNilai = []
    for(let i = 0; i < arrData.length; i++){
        let arrDataPerbaris = arrData[i].split(";");
        arrNilai.push(arrDataPerbaris[3]);
        arrUrutanNilai.push(arrDataPerbaris[3]);
    }
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

        result.push(trueData.join(','))
    }

    // retrive and replace header
    result.unshift(header.replace(/\;/g, ",")); 

    result = result.join("\n");

    fs.writeFile('RESULT.csv', result, function(err){
        if(err) throw err;
    })
})