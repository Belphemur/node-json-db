[![NodeJs](https://github.com/Belphemur/node-json-db/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Belphemur/node-json-db/actions/workflows/nodejs.yml) [![codecov](https://codecov.io/gh/Belphemur/node-json-db/branch/master/graph/badge.svg?token=J3Ppt4UCbY)](https://codecov.io/gh/Belphemur/node-json-db)
[![npm version](https://badge.fury.io/js/node-json-db.svg)](https://badge.fury.io/js/node-json-db)
> A simple "database" that uses JSON file for Node.JS.

## Breaking changes since v1.x.x
### v2.0.0

JsonDB is now using the concept of async/await for all its calls since we read from the database file on demand and
depending on how the database is configured, we might write at each push.

* You're now forced to use the `Config` object to setup JsonDB
* Every method is now asynchronous

## Installation
Add `node-json-db` to your existing Node.js project.

YARN:
```bash
yarn add node-json-db
```
NPM:
```bash
npm i node-json-db
```

## Documentation
[Auto Generated](https://belphemur.github.io/node-json-db)

## Inner Working

### Data
The module stores the data using JavaScript Object directly into a JSON file. You can easily traverse the data to directly reach 
the desired property using the DataPath. The principle of DataPath is the same as XMLPath.

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
You can of course also get the full object **test** : **/test**
Or even the root : **/**
## Usage
See [test](https://github.com/Belphemur/node-json-db/tree/master/test) for more usage details.


```javascript
import { JsonDB, Config } from 'node-json-db';

// The first argument is the database filename. If no extension is used, '.json' is assumed and automatically added.
// The second argument is used to tell the DB to save after each push
// If you set the second argument to false, you'll have to call the save() method.
// The third argument is used to ask JsonDB to save the database in a human readable format. (default false)
// The last argument is the separator. By default it's slash (/)
var db = new JsonDB(new Config("myDataBase", true, false, '/'));

// Pushing the data into the database
// With the wanted DataPath
// By default the push will override the old value
await db.push("/test1","super test");

// When pushing new data for a DataPath that doesn't exist, it automatically creates the hierarchy
await db.push("/test2/my/test",5);

// You can also push objects directly
await db.push("/test3", {test:"test", json: {test:["test"]}});

// If you don't want to override the data but to merge them
// The merge is recursive and works with Object and Array.
await db.push("/test3", {
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

// You can't merge primitives.
// If you do this:
await db.push("/test2/my/test/",10,false);

// The data will be overriden

// Get the data from the root
var data = await db.getData("/");

// Or from a particular DataPath
var data = await db.getData("/test1");

// If you try to get some data from a DataPath that doesn't exist
// You'll get an Error
try {
    var data = await db.getData("/test1/test/dont/work");
} catch(error) {
    // The error will tell you where the DataPath stopped. In this case test1
    // Since /test1/test does't exist.
    console.error(error);
};

// Easier than try catch when the path doesn't lead to data
// This will return `myDefaultValue` if `/super/path` doesn't have data, otherwise it will return the data
var data = await db.getObjectDefault<string>("/super/path", "myDefaultValue");

// Deleting data
await db.delete("/test1");

// Save the data (useful if you disable the saveOnPush)
await db.save();

// In case you have an exterior change to the databse file and want to reload it
// use this method
await db.reload();

```

### TypeScript Support

#### v0.8.0
As of v0.8.0, [TypeScript](https://www.typescriptlang.org) types are
included in this package, so using `@types/node-json-db` is no longer required.


#### v1.0.0

JsonDB isn't exported as default any more. You'll need to change how you load the library.

This change is done to follow the right way to import module.
```javascript
import { JsonDB, Config } from 'node-json-db';

const db = new JsonDB(new Config("myDataBase", true, false, '/'));
```

#### Typing
With TypeScript, you have access to a new method: getObject<T> that will take care of typing your return object.
```typescript
import { JsonDB, Config } from 'node-json-db';

const db = new JsonDB(new Config("myDataBase", true, false, '/'));

interface FooBar {
    Hello: string
    World: number
}
const object = {Hello: "World", World: 5} as FooBar;

await db.push("/test", object);

// Will be typed as FooBar in your IDE
const result = await db.getObject<FooBar>("/test");
```


### Array Support
You can also access the information stored in arrays and manipulate them.
```typescript
import { JsonDB, Config } from 'node-json-db';

// The first argument is the database filename. If no extension is used, '.json' is assumed and automatically added.
// The second argument is used to tell the DB to save after each push
// If you set the second argument to false, you'll have to call the save() method.
// The third argument is used to ask JsonDB to save the database in a human readable format. (default false)
const db = new JsonDB(new Config("myDataBase", true, false, '/'));

// This will create an array 'myarray' with the object '{obj:'test'}' at index 0
await db.push("/arraytest/myarray[0]", {
    obj:'test'
}, true);

// You can retrieve a property of an object included in an array
// testString = 'test';
var testString = await db.getData("/arraytest/myarray[0]/obj");

// Doing this will delete the object stored at the index 0 of the array.
// Keep in mind this won't delete the array even if it's empty.
await db.delete("/arraytest/myarray[0]");
```

#### Appending in Array
```javascript
// You can also easily append a new item to an existing array
// This sets the next index with {obj: 'test'}
await db.push("/arraytest/myarray[]", {
    obj:'test'
}, true);


// The append feature can be used in conjuction with properties
// This will set the next index as an object {myTest: 'test'}
await db.push("/arraytest/myarray[]/myTest", 'test', true);

```

#### Last Item in Array
```javascript
// Add basic array
await db.push("/arraytest/lastItemArray", [1, 2, 3], true);

// You can easily get the last item of the array with the index -1
// This will return 3
await db.getData("/arraytest/lastItemArray[-1]");


// You can delete the last item of an array with -1
// This will remove the integer "3" from the array
await db.delete("/arraytest/lastItemArray[-1]");

// This will return 2 since 3 just got removed
await db.getData("/arraytest/lastItemArray[-1]");
```
#### Count for Array
```javascript
//
await db.push("/arraytest/list", [{id: 65464646155, name: "test"}], true);

// You can request for the total number of elements, in this case, 1
let numberOfElements = await db.count("/arraytest/list");
```

#### Get Index in Array
```javascript

// You can have the current index of an object
await db.push("/arraytest/myarray", {id: 65464646155, name: "test"}, true);
await db.getIndex("/arraytest/myarray", 65464646155);
// The default property is 'id'
// You can add another property instead
await db.getIndex("/arraytest/myarray", "test", "name");

// It's useful if you want to delete an object
await db.delete("/arraytest/myarray[" + await db.getIndex("/arraytest/myarray", 65464646155) + "]");
```
    
#### Nesting in Array
```javascript
// You can easily access any nested array and their object
// You can also append another array to a nested array
await db.push("/arraytest/myarray",
[
  [
    {
      obj: 'test'
    },
    {
      obj: 'hello'
    }
  ],
  [
    {
      obj: 'world'
    }
  ]
]
, true);

// This will return the first object (obj: 'test')

await db.getData("/arraytest/myarray[0][0]");

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
|The Data Path can't be empty                           |DataError      |The Database expects to receive at least the root **separator** as part of the DataPath.                                                                                                         |
|Can't find dataPath: /XXX. Stopped at YYY              |DataError      |When the full hierarchy of the provided DataPath is not present in the Database, it indicates the extent of its validity. This error can occur when using the `getData` and `delete` operations. | 
|Can't merge another type of data with an Array         |DataError      |This occurs if you chose not to override the data when pushing (merging) and the new data is an array, but the current data isn't an array (an Object for example).                      | 
|Can't merge an Array with an Object                    |DataError      |Similar to the previous message, you have an array as the current data and request to merge it with an object.                                                                   | 
|DataPath: /XXX.  YYY is not an array.                  |DataError      |When trying to access an object as an array.                                                                                                                               | 
|DataPath: /XXX. Can't find index INDEX in array YYY    |DataError      |When trying to access a non-existent index in the array.                                                                                                                   | 
|Only numerical values accepted for array index         |DataError      |An array can only use `number` for its indexes. For this use the normal object.                                                                                              |
|The entry at the path (/XXX) needs to be either an Object or an Array        |DataError      |When using the `find` method, the rootPath needs to point to an object or an array to search within it for the desired value.                              |
|Can't Load Database:  XXXX                             |DatabaseError  |JsonDB can't load the database for "err" reason. You can find the nested error in `error.inner`                                                                          |
|Can't save the database: XXX                           |DatabaseError  |JsonDB can't save the database for "err" reason. You can find the nested error in `error.inner`                                                                          | 
|DataBase not loaded. Can't write                       |DatabaseError  |Since the database hasn't been loaded correctly, the module won't let you save the data to avoid erasing your database.                                                    | 

# Limitations

## Object with `separator` in key
 Object pushed with key containing the `separator` character won't be reachable. See [#75](https://github.com/Belphemur/node-json-db/issues/75).

 Please consider the `separator` as a reserved character by node-json-await db.


# Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://davisjam.github.io/"><img src="https://avatars.githubusercontent.com/u/22822319?v=4?s=100" width="100px;" alt="Jamie Davis"/><br /><sub><b>Jamie Davis</b></sub></a><br /><a href="#security-davisjam" title="Security">🛡️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sidblommerswork"><img src="https://avatars.githubusercontent.com/u/93680615?v=4?s=100" width="100px;" alt="sidblommerswork"/><br /><sub><b>sidblommerswork</b></sub></a><br /><a href="https://github.com/Belphemur/node-json-db/commits?author=sidblommerswork" title="Code">💻</a> <a href="https://github.com/Belphemur/node-json-db/commits?author=sidblommerswork" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/drproktor"><img src="https://avatars.githubusercontent.com/u/19718418?v=4?s=100" width="100px;" alt="Max Huber"/><br /><sub><b>Max Huber</b></sub></a><br /><a href="https://github.com/Belphemur/node-json-db/commits?author=drproktor" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/adamhl8"><img src="https://avatars.githubusercontent.com/u/1844269?v=4?s=100" width="100px;" alt="Adam"/><br /><sub><b>Adam</b></sub></a><br /><a href="https://github.com/Belphemur/node-json-db/commits?author=adamhl8" title="Code">💻</a> <a href="https://github.com/Belphemur/node-json-db/commits?author=adamhl8" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://divineanum.me"><img src="https://avatars.githubusercontent.com/u/44934037?v=4?s=100" width="100px;" alt="Divine Anum"/><br /><sub><b>Divine Anum</b></sub></a><br /><a href="https://github.com/Belphemur/node-json-db/commits?author=CHR-onicles" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/michalfedyna"><img src="https://avatars.githubusercontent.com/u/84079005?v=4?s=100" width="100px;" alt="Michał Fedyna"/><br /><sub><b>Michał Fedyna</b></sub></a><br /><a href="https://github.com/Belphemur/node-json-db/commits?author=michalfedyna" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/alexsad"><img src="https://avatars.githubusercontent.com/u/2659613?v=4?s=100" width="100px;" alt="alex.query"/><br /><sub><b>alex.query</b></sub></a><br /><a href="https://github.com/Belphemur/node-json-db/commits?author=alexsad" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
    
## Special Thanks

[James Davis](https://github.com/davisjam) for helping to fix a regular expression vulnerable to [catastrophic backtracking](https://docs.microsoft.com/en-us/dotnet/standard/base-types/backtracking-in-regular-expressions).


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FBelphemur%2Fnode-json-await db.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FBelphemur%2Fnode-json-db?ref=badge_large)
