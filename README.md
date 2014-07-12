[![Build Status](https://secure.travis-ci.org/Belphemur/node-json-db.png?branch=master)](http://travis-ci.org/Belphemur/node-json-db) [![Coverage Status](https://img.shields.io/coveralls/Belphemur/node-json-db.svg)](https://coveralls.io/r/Belphemur/node-json-db?branch=master)

[![NPM](https://nodei.co/npm/node-json-db.png?downloads=true&stars=true)](https://nodei.co/npm/node-json-db/)

> A simple "database" that use JSON file for Node.JS.

## Installation
Add `node-json-db` to your existing Node.js project.
```bash
npm install node-json-db --save
```
## Inner Working

###Events
JsonDB trigger the event **error** in case of error like the DataBase couldn't be loaded or the DataPath used for getting 
the data don't exist.

###Data
The module store the data using JavaScript Object directly into a JSON file. You can easily traverse the data to reach 
directly the interesting property using the DataPath. The principle of DataPath is the same as XMLPath.

###Example
```javascript
{
    test: {
        data1 : {
            array : ['test','array']
        },
        data2 : 5
    }
}
```
If you want to fet the value of array, the DataPath is **/test/data1/array**
To reach the value of data2 : **/test/data2**
You can of course get also the full object **test** : **/test**
Or even the root : **/**
## Usage
See [test](https://github.com/Belphemur/node-json-db/tree/master/test) for more usage details.


```javascript
var JsonDB = require('node-json-db');
var db = new JsonDB("myDataBase", true);

//Pushing the data into the database
//With the wanted DataPath
//By default the push will override the old value
db.push("/test1","super test");

//It also create automatically the hierarchy when pushing new data for a DataPath that doesn't exists
db.push("/test2/my/test/",5);

//You can also push directly objects
db.push("/test3", {test:"test", json: {test:["test"]}});

//If you don't want to override the data but to merge them
//The merge is recursive and work with Object and Array.
db.push("/test3", {new:"cool", json: {important : 5}}, false);
/*
This give you this results :
{
   "test":"test",
   "json":{
      "test":[
         "test"
      ],
      "important":5
   },
   "new":"cool"
}
*/

//Get the data from the root
var data = db.getData("/");

//From a particular DataPath
var data = db.getData("/test1");

//Deleting data
db.delete("/test1");
```


