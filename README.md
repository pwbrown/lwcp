# LWCP Parser

## Description
Parser for Livewire Control Protocol. Used to convert incoming LWCP strings to readable JSON structures.

## Installation
    yarn add lwcp
    --OR--
    npm install --save lwcp

## Basic Usage
```Javascript
const lwcp = require('lwcp');

//LWCP Response from requesting list of shows within a studio
var res = 'indi studio show_list=[[1, "Show 1"], [2, "Show 2"], [3, "Test 1"]]';

//Parsed result
var parsed = lwcp.parse(res);
```

## Methods

### **lwcp.parse(lwcpString[, autoConvert])**
***
#### Description
Converts a raw LWCP String into an object with the following attributes
* **'op'**: LWCP Operation (ex. get, set, call, hold, etc.)
* **'obj'**: LWCP Object (ex. cc, studio, studio, etc.)
* **'sub'**: LWCP Subobject (ex. line, book, log)
* **'id'**: LWCP Subobject id
* **'props'**: LWCP properties

#### Parameters:
* **lwcpString**: The raw string passed in to parse into an object.
* **autoConvert**: An optional boolean value indicating whether the properties attribute should be converted into a more readable object.  See the convert method below (This is the method that is run).

#### Example:
* Can be seen below in detail in the ***"CONSOLE LOG"*** output of both Examples at the end of the this page. They are labeled as ***"Parsed"*** and ***"ParsedAndConverted"*** without autoConvert and with autoConvert respectively.

### **lwcp.convert(parsedData[, customModel])**
***
#### Description
Takes in the results of a parsed string and uses pre-made mappings to make the properties output more readable.  Pre-made mappings can be overriden or expanded by passing in a custom model.

#### Parameters
* **parsedData**: This value should be the ***untampered*** results of the ***"lwcp.parse"*** method ***without autoConvert***.
* **customModel**: This is an optional model that is passed in to override pre-existing mappings or add additional mappings to the conversion process.  See the "Conversion Model" section to see how this should be formatted and what it does exactly.

#### Example:
* Can be seen below in detail in the ***"CONSOLE LOG"*** output of both Examples at the end of the this page. Each example is labeled as ***"Parsed with custom model"*** , and is represented by the variable ***"customModel"*** in each examples ***"CODE"*** .

## Conversion Model
#### Description
The conversion model is used to modify the properties result of a parsed string to make it more readable. This is useful since many Livewire server responses contain properties that are **arrays of arrays**. These arrays are unlabled and hard to read unless you have read the documentation beforehand.  This conversion process will use prewritten mappings of common property names to turn basic property names into a more standard JS camelCase version and turn arrays of arrays values into arrays of ***labeled*** objects.

#### Format
A conversion model is a simple object where each key represents the expected name of a property result and contains the following properties.
* ***name***: The new name to use for the property that is being converted
* ***each***: An array of strings that will be used to label an "array of arrays" property. The length of this array must match the expected length of the internal arrays of the converted property.

#### Default Model
Look at "lib/model.js" for a full list of the pre-configured model mappings.

#### Example
* See both "Example in Action" sections for another look at how this works.
```
{
    //Simply renames the property "state"
    'state': {name: 'lineState'},
    
    //Renames the property "show_list" and converts the internal arrays of its value into objects with the listed labels in "each"
    'show_list':{
        name: 'showList',
        each:['showId','showName']
    }
}
```


## Example in Action - Studio Show List Response
**Overview**: In this example we are parsing a typical response from requesting the list of shows in our selected studio

#### CODE
```Javascript
const lwcp = require('lwcp');

//Helper nodejs method to aid with printing
const inspect = require('util').inspect;

//VX-Prime server response from requesting the list of shows within a studio
var res = 'indi studio show_list=[[1, "Show 1"], [2, "Show 2"], [3, "Test 1"]]';

//Parsed result
var parsed = lwcp.parse(res);
console.log("\nParsed:")
console.log(inspect(parsed,false,null));

//Parsed with automatic model conversion
var parsedAndConverted = lwcp.parse(res, true);
console.log("\nParsed And Converted:")
console.log(inspect(parsedAndConverted,false,null));

//Parsed with custom model conversion
var customModel = {
    'show_list': {
        name: 'liveShowList',
        each: ['liveShowId','liveShowName']
    }
}
var parsedWithCustom = lwcp.convert(parsed, customModel);
console.log("\nParsed with custom model:")
console.log(inspect(parsedWithCustom,false,null));
```

#### CONSOLE LOG
```

Parsed:
{ op: 'indi',
  obj: 'studio',
  sub: null,
  id: null,
  props:
   { show_list: [ [ 1, 'Show 1' ], [ 2, 'Show 2' ], [ 3, 'Test 1' ] ] } }

Parsed And Converted:
{ op: 'indi',
  obj: 'studio',
  sub: null,
  id: null,
  props:
   { showList:
      [ { showId: 1, showName: 'Show 1' },
        { showId: 2, showName: 'Show 2' },
        { showId: 3, showName: 'Test 1' } ] } }

Parsed with custom model:
{ op: 'indi',
  obj: 'studio',
  sub: null,
  id: null,
  props:
   { liveShowList:
      [ { liveShowId: 1, liveShowName: 'Show 1' },
        { liveShowId: 2, liveShowName: 'Show 2' },
        { liveShowId: 3, liveShowName: 'Test 1' } ] } }
```

## Example in Action - Studio Line Update Response
**Overview**: In this example we are parsing the response from a studio line update

#### CODE
```Javascript
const lwcp = require('lwcp');

//Helper nodejs method to aid with printing
const inspect = require('util').inspect;

//VX-Prime server response from a line update within the studio
var res = 'event studio.line#1 state=IDLE, callstate=IDLE, remote=NULL, direction=NONE, hybrid=0, time=NULL';

//Parsed result
var parsed = lwcp.parse(res);
console.log("\nParsed:")
console.log(inspect(parsed,false,null));

//Parsed with automatic model conversion
var parsedAndConverted = lwcp.parse(res, true);
console.log("\nParsed And Converted:")
console.log(inspect(parsedAndConverted,false,null));

//Parsed with custom model conversion
var customModel = {
    'remote': {name: 'remoteAddress'},
    'time': {name: 'timeInSeconds'},
    'hybrid': {name: 'hybridId'}
}
var parsedWithCustom = lwcp.convert(parsed, customModel);
console.log("\nParsed with custom model:")
console.log(inspect(parsedWithCustom,false,null));
```
#### CONSOLE LOG
```

Parsed:
{ op: 'event',
  obj: 'studio',
  sub: 'line',
  id: '1',
  props:
   { state: 'IDLE',
     callstate: 'IDLE',
     remote: null,
     direction: 'NONE',
     hybrid: 0,
     time: null } }

Parsed And Converted:
{ op: 'event',
  obj: 'studio',
  sub: 'line',
  id: '1',
  props:
   { lineState: 'IDLE',
     callState: 'IDLE',
     lineRemote: null,
     lineDirection: 'NONE',
     lineHybrid: 0,
     lineTime: null } }

Parsed with custom model:
{ op: 'event',
  obj: 'studio',
  sub: 'line',
  id: '1',
  props:
   { lineState: 'IDLE',
     callState: 'IDLE',
     remoteAddress: null,
     lineDirection: 'NONE',
     hybridId: 0,
     timeInSeconds: null } }
```