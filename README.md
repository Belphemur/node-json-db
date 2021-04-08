[![NodeJs](https://github.com/Belphemur/node-json-db/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Belphemur/node-json-db/actions/workflows/nodejs.yml)[![codecov](https://codecov.io/gh/Belphemur/node-json-db/branch/master/graph/badge.svg?token=J3Ppt4UCbY)](https://codecov.io/gh/Belphemur/node-json-db)[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FBelphemur%2Fnode-json-db.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FBelphemur%2Fnode-json-db?ref=badge_shield)

[![NPM](https://nodei.co/npm/node-json-db.png?downloads=true&stars=true)](https://nodei.co/npm/node-json-db/)

> A simple "database" that use JSON file for Node.JS.

## Installation
Add `node-json-db` to your existing Node.js project.
```bash
yarn add node-json-db
```

## Documentation
[Auto Generated](https://belphemur.github.io/node-json-db)

## Inner Working

### Data
The module stores the data using JavaScript Object directly into a JSON file. You can easily traverse the data to reach 
directly the interesting property using the DataPath. The principle of DataPath is the same as XMLPath.

### Example
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
If you want to fetch the value of array, the DataPath is **/test/data1/array**
To reach the value of data2 : **/test/data2**
You can of course get also the full object **test** : **/test**
Or even the root : **/**
## Usage
See [test](https://github.com/Belphemur/node-json-db/tree/master/test) for more usage details.


```javascript
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig'

// The first argument is the database filename. If no extension, '.json' is assumed and automatically added.
// The second argument is used to tell the DB to save after each push
// If you put false, you'll have to call the save() method.
// The third argument is to ask JsonDB to save the database in an human readable format. (default false)
// The last argument is the separator. By default it's slash (/)
var db = new JsonDB(new Config("myDataBase", true, false, '/'));

// Pushing the data into the database
// With the wanted DataPath
// By default the push will override the old value
db.push("/test1","super test");

// It also create automatically the hierarchy when pushing new data for a DataPath that doesn't exists
db.push("/test2/my/test",5);

// You can also push directly objects
db.push("/test3", {test:"test", json: {test:["test"]}});

// If you don't want to override the data but to merge them
// The merge is recursive and work with Object and Array.
db.push("/test3", {
    new:"cool",
    json: {
        important : 5
    }
}, false);

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

// You can't merge primitive.
// If you do this:
db.push("/test2/my/test/",10,false);

// The data will be overriden

// Get the data from the root
var data = db.getData("/");

// From a particular DataPath
var data = db.getData("/test1");

// If you try to get some data from a DataPath that doesn't exists
// You'll get an Error
try {
    var data = db.getData("/test1/test/dont/work");
} catch(error) {
    // The error will tell you where the DataPath stopped. In this case test1
    // Since /test1/test does't exist.
    console.error(error);
};

// Deleting data
db.delete("/test1");

// Save the data (useful if you disable the saveOnPush)
db.save();

// In case you have a exterior change to the databse file and want to reload it
// use this method
db.reload();

```

### TypeScript Support

#### v0.8.0
As of v0.8.0, [TypeScript](https://www.typescriptlang.org) types are
included in this package, so using `@types/node-json-db` is no longer required.


#### v1.0.0

JsonDB isn't exported as default any more. You'll need to change how you load the library.

This change is done to follow the right way to import module.
```javascript
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig'

const db = new JsonDB(new Config("myDataBase", true, false, '/'));
```

#### Typing
With TypeScript, you have access to a new method: getObject<T> that will take care of typing your return object.
```typescript
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig'

const db = new JsonDB(new Config("myDataBase", true, false, '/'));

interface FooBar {
    Hello: string
    World: number
}
const object = {Hello: "World", World: 5} as FooBar;

db.push("/test", object);

//Will be typed as FooBar in your IDE
const result = db.getObject<FooBar>("/test");
```


### Array Support
You can also access the information stored into arrays and manipulate them.
```typescript
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig'

// The first argument is the database filename. If no extension, '.json' is assumed and automatically added.
// The second argument is used to tell the DB to save after each push
// If you put false, you'll have to call the save() method.
// The third argument is to ask JsonDB to save the database in an human readable format. (default false)
const db = new JsonDB(new Config("myDataBase", true, false, '/'));

// This will create an array 'myarray' with the object '{obj:'test'}' at index 0
db.push("/arraytest/myarray[0]", {
    obj:'test'
}, true);

// You can retrieve a property of an object included in an array
// testString = 'test';
var testString = db.getData("/arraytest/myarray[0]/obj");

// Doing this will delete the object stored at the index 0 of the array.
// Keep in mind this won't delete the array even if it's empty.
db.delete("/arraytest/myarray[0]");
```

#### Appending in Array
```javascript
// You can also easily append new item to an existing array
// This set the next index with {obj: 'test'}
db.push("/arraytest/myarray[]", {
    obj:'test'
}, true);


// The append feature can be used in conjuction with properties
// This will set the next index as an object {myTest: 'test'}
db.push("/arraytest/myarray[]/myTest", 'test', true);

```

#### Last Item in Array
```javascript
// Add basic array
db.push("/arraytest/lastItemArray", [1, 2, 3], true);

// You can easily get the last item of the array with the index -1
// This will return 3
db.getData("/arraytest/lastItemArray[-1]");


// You can delete the last item of an array with -1
// This will remove the integer "3" from the array
db.delete("/arraytest/lastItemArray[-1]");

// This will return 2 since 3 just got removed
db.getData("/arraytest/lastItemArray[-1]");
```
#### Count for Array
```javascript
//
db.push("/arraytest/list", [{id: 65464646155, name: "test"}], true);

// You can have the number of element, in this case  = 1
let numberOfElement = db.count("/arraytest/list");
```

#### Get Index in Array
```javascript

// You can have the current index of an object
db.push("/arraytest/myarray", {id: 65464646155, name: "test"}, true);
db.getIndex("/arraytest/myarray", 65464646155);
// By default, the property is 'id'
// You can add another property instead
db.getIndex("/arraytest/myarray", "test", "name");

// It's useful if you want to delete some object
db.delete("/arraytest/myarray[" + db.getIndex("/arraytest/myarray", 65464646155) + "]");
```
### Exception/Error
#### Type

| Type          |                   Explanation                                    |
| ------------- |:----------------------------------------------------------------:|
| DataError     | When the error is linked to the Data Given                       | 
| DatabaseError | Linked to a problem with the loading or saving of the Database.  |

#### Errors

| Error                                                 | Type          |                   Explanation                                                                                                                                             |
| ------------------------------------------------------|:-------------:|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|The Data Path can't be empty                           |DataError      |The Database expect to minimum receive the root **separator** as DataPath.                                                                                                         |
|Can't find dataPath: /XXX. Stopped at YYY              |DataError      |When the full hierarchy of the DataPath given is not present in the Database. It tells you until where it's valid. This error can happen when using *getData* and *delete* | 
|Can't merge another type of data with an Array         |DataError      |If you chose to not override the data (merging) when pushing and the new data is an array but the current data isn't an array (an Object by example).                      | 
|Can't merge an Array with an Object                    |DataError      |Same idea as the previous message. You have an array as current data and ask to merge it with an Object.                                                                   | 
|DataPath: /XXX.  YYY is not an array.                  |DataError      |When trying to access an object as an array.                                                                                                                               | 
|DataPath: /XXX. Can't find index INDEX in array YYY    |DataError      |When trying to access a non-existent index in the array.                                                                                                                   | 
|Only numerical values accepted for array index         |DataError      |An array can only use number for its indexes. For this use the normal object.                                                                                              |
|The entry at the path (/XXX) needs to be either an Object or an Array        |DataError      |When using the find method, the rootPath need to point to an object or an array to search into it for the wanted value.                              |
|Can't Load Database:  XXXX                             |DatabaseError  |JsonDB can't load the database for "err" reason. You can find the nested error in **error.inner**                                                                          |
|Can't save the database: XXX                           |DatabaseError  |JsonDB can't save the database for "err" reason. You can find the nested error in **error.inner**                                                                          | 
|DataBase not loaded. Can't write                       |DatabaseError  |Since the database hasn't been loaded correctly, the module won't let you save the data to avoid erasing your database.                                                    | 

# Limitations

## Object with `separator` in key
 Object pushed with key containing the `separator` character won't be reachable. See [#75](https://github.com/Belphemur/node-json-db/issues/75).

 Please consider the `separator` as a reserved character by node-json-db.


# Thanks

[James Davis](https://github.com/davisjam) for helping to fix a regular expression vulnerable to [catastrophic backtracking](https://docs.microsoft.com/en-us/dotnet/standard/base-types/backtracking-in-regular-expressions).


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FBelphemur%2Fnode-json-db.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FBelphemur%2Fnode-json-db?ref=badge_large)
