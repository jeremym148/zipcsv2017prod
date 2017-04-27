var express = require('express');
var bodyParser = require('body-parser')
var app =express();
var request = require('request');
var http = require('http');
var base64 = require('base-64');
var promise = require('promise');
var pg = require('pg');
var parseString = require('xml2js').parseString;
var parse = require('xml-parser');
var inspect = require('util').inspect;
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
let ConfigVars ={
  un: process.env.un,
  pw: process.env.pw,
  SF_url:process.env.SF_URL
};


// var chilkat = require('chilkat_node7_win32'); 

// var os = require('os');
// if (os.platform() == 'win32') {  
//     var chilkat = require('chilkat_node7_win32'); 
// } 
// else if (os.platform() == 'linux') {
//     if (os.arch() == 'arm') {
//         var chilkat = require('chilkat_node6_arm');
//     } else if (os.arch() == 'x86') {
//         var chilkat = require('chilkat_node6_linux32');
//     } else {
        var chilkat = require('chilkat_node6_linux64');
//     }
// } else if (os.platform() == 'darwin') {
//     var chilkat = require('chilkat_node6_macosx');
// }
var test;
var port =process.env.PORT || 8080;

function chilkatExample(csv,objId,password,refId, callback) {
    var crypt = new chilkat.Crypt2();
    var zip = new chilkat.Zip();
     var glob = new chilkat.Global();
    var success = glob.UnlockBundle("Anything for 30-day trial");
    if (success !== true) {
        console.log(glob.LastErrorText);
        return;
    }
    

 var success = zip.NewZip("test.zip");
    if (success !== true) {
        console.log(zip.LastErrorText);
        return;
    }
     zip.SetPassword(password);
    zip.PasswordProtect = true;

    //  Add the string "Hello World!" to the .zip
    var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; //January is 0!
		var yyyy = today.getFullYear();
		var seconds = today.getSeconds();
		var minutes = today.getMinutes();
		var hour = today.getHours();


		if(dd<10) {
		    dd='0'+dd
		} 
		if(mm<10) {
		    mm='0'+mm
		} 
		var theRefId='';
		if(refId.length()<5){
	        integer j;
	        for(j=0;j<(5-refId.length());j++){
	            TherefId+='0';
	        }
	        theRefId+=refId;
	    }
	    else{
	        theRefId=refId;

	    }


	today = yyyy+mm+dd+'-'+hour+'-'+minutes+'-'+seconds;
	var nameFile='CAPRETRAITE-'+theRefId+'-'+today+'.csv';
    entry = zip.AppendString2(nameFile,csv,"utf-8");

    zipFileInMemory = zip.WriteToMemory();
    if (zipFileInMemory == null ) {
        console.log("zipmem "+zip.LastErrorText);
        return;
    }
    var zip64 = crypt.Encode(zipFileInMemory,base64);
    if (zip64 == null ) {
        console.log(zip.LastErrorText);
        return;
    }
    console.log(zip64);
     sendDocToSF(zip64,objId,theRefId,today,callback);
}


function sendDocToSF(zip64,objId,refId,today,callback){
	connectToSF(function(sessionId) {
		// var dd = today.getDate();
		// var mm = today.getMonth()+1; //January is 0!
		// var yyyy = today.getFullYear();
		// var seconds = today.getSeconds();
		// var minutes = today.getMinutes();
		// var hour = today.getHours();


		// if(dd<10) {
		//     dd='0'+dd
		// } 
		// if(mm<10) {
		//     mm='0'+mm
		// } 

		// today = yyyy+mm+dd+'-'+hour+'-'+minutes+'-'+seconds;
		var nameFile='CAPRETRAITE-'+refId+'-'+today+'.7z';
		// Set the headers
		var headers = {
		    'Authorization': 'Bearer '+sessionId,
		    'Content-Type': 'application/json'
		}

		// Configure the request
		var options = {
		   url: ConfigVars.SF_url+'/services/data/v39.0/sobjects/Attachment/',
		    method: 'POST',
		    headers: headers,
		    json:{  "Description" : "CsvZip Orpea",
		    		"ParentId" : objId,
		    		"Name" : nameFile,
		    		"ContentType" : ".7z",
		    		"body":zip64}
		}

		// Start the request
		request(options, function (error, response, body) {
		    if (!error && response.statusCode == 201) {
		        // Print out the response body
		       console.log(body);
		       callback(body);
		    }else {console.log("eror"+error);}
		})
	});
}

function connectToSF(callback2){
	// Set the headers
	var headers = {
	    'Content-Type': 'text/xml',
	    'SoapAction': 'SoapAction'
	}

	// Configure the request
	var options = {
	   url: 'https://login.salesforce.com/services/Soap/u/36.0',
	    method: 'POST',
	    headers: headers,
	    body:'<?xml version="1.0" encoding="utf-8" ?><env:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Body><n1:login xmlns:n1="urn:partner.soap.sforce.com"><n1:username>'+ConfigVars.un+'</n1:username><n1:password>'+ConfigVars.pw+'</n1:password></n1:login></env:Body></env:Envelope>'
	}	
	// Start the request
	request(options, function (error, response, body) {
		console.log(body);
		console.log(response.statusCode);
	    if (!error && response.statusCode == 200) {
	        // Print out the response body
	        var obj = parse(body);
	        var sessionId= obj.root.children[0].children[0].children[0].children[4].content;
	        console.log(sessionId);
	        callback2(sessionId);
		
	    }else {console.log("eror"+error);}
	})
}



app.post('/createZip',function(req, res){
    var csv = req.body.csv;
    var objId = req.body.objId;
    var password=req.body.password;
    var refId=req.body.refId;
    res.set('Content-Type', 'text/plain');
	chilkatExample(csv,objId,password,refId, function(body2) {
		res.send(body2.id);
	});
	
});

app.get('/', function(req, res){
	sendDocToSF();
});

// app.use(express.static(__dirname + '/public' ));

//app.get('*', (req,res) => res.sendFile(path.join(__dirname+'/public/' + config.indexPage)))

app.listen(port, function(){
	console.log("Server is listening on port "+port);
});
