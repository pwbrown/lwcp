/**
 * @copyright Philip Brown 2018
 * @author Philip Brown
 * @module LWCP
 */

/** DEPENDENCIES */
const MODEL = require('./model');

/**
 * Matches newline and carriage return characters
 * @constant
 */
const NEWLINE = /(\n|\r)/g;

/**
 * Matches the initial structure of an LWCP message (does not match individual properties)
 *  Based on LWCP specifications, here are the values of each Regular Expression Grouping
 * --$1 - "operation"
 * --$2 - "object"
 * --$3 - "subobject"
 * --$4 - "SOBJ_ID" (subobject id)
 * --$5 - Full unparsed properties string
 * @constant
 */
const FULL = /^([a-z]+(?:\_[a-z]+)?)\s\s*([a-z]+)(?:\.([a-z]+)(?:\#([0-9]+))?)?(?:\s\s*(.*))?$/;

/**
 * Matches Enumerated Values
 *  **Note - grabs the opening and closing whitespace or comma (look at the implementation in "stringifyEnums")
 * @constant
 */
const ENUM = /(\[\s*|\,\s*)([A-Z]+(?:\_[A-Z]+)*)(\s*\]|\s*\,)/;

/**
 * Parses Raw LWCP messages and turns them into readable Objects. Can also auto convert data using the built-in convert method
 * @param {!String} data Raw LWCP string
 * @param {?Boolean} autoConvert=false If true, the parse method will also automatically run data through the convert method using default model specs
 * @returns {(Object|null)} The converted object or null if initial parsing failed
 */
var parse = exports.parse = function(data, autoConvert){
    //Remove newline and carriage return characters if present
    data = data.replace(NEWLINE, '');
    //Attempt to parse initial structure
    data = data.match(FULL);
    //Return null on failure (Invalid LWCP syntax)
    if(data === null) return data;
    //Create basic return structure
    data = {
        op: data[1] || null,
        obj: data[2] || null,
        sub: data[3] || null,
        id: data[4] || null,
        props: data[5] || null
    }
    //Parse properties seperately
    if(data.props)
        data.props = parseProps(data.props);
    if(autoConvert)
        data = convert(data);
    return data;
}

/**
 * Converts parsed LWCP properties into a more readable format
 * @param {!Object[]} data The parsed lwcp model
 * @param {?String} data.op LWCP operation
 * @param {?String} data.obj LWCP object (namespace)
 * @param {?(String|null)} data.sub LWCP subobject
 * @param {?(String|null)} data.id LWCP subobject id
 * @param {!(Object|null)} data.props LWCP properties object
 * @param {?Object} model Provide overrides or additions to the built-in model specs
 * @returns {Object} converted version of the data
 */
var convert = exports.convert = function(data, model){
    if(typeof model !== 'object') model = {};
    data = Object.assign({}, data); //Generate copy
    //This method only converts props
    if(!data.props)
        return data;
    var props = Object.assign({}, data.props);
    for(var key in props){
        var m = model[key] || MODEL[key] || null;
        if(!m) continue;
        var newKey = m.name || key;
        if(typeof props[key] !== 'object' || !m.each){
            props[newKey] = props[key];
            if(newKey !== key) delete props[key];
        }else{
            props[newKey] = modifyArray(props[key], m.each);
            if(newKey !== key) delete props[key];
        }
    }
    data.props = props;
    return data;
}

/**
 * Parses an LWCP properties string into a basic JSON structure with automatic type conversion
 * @param {!String} props Raw properties string
 * @returns {(Object|null)} Object version of the properties string or null if parsing failed 
 */
function parseProps(props){
    //Place to store our parsed properties
    var out = [];
    //Start looping through the properties string
    while(props.length > 0){
        //Trim whitespace and leading commas
        props = trim(props);
        var nextProp = getNextProp(props);
        if(typeof nextProp.append !== 'undefined')
            out.push(nextProp.append);
        if(typeof nextProp.replace !== 'undefined')
            props = nextProp.replace;
        if(nextProp.error){
            console.log(nextProp.error);
            return null;
        }
    }
    var outObj = {};
    //Convert out into an object
    out.forEach(v => {
        if(typeof v === 'string')
            outObj[v] = true;
        else
            outObj[v.property] = v.value;
    })
    return outObj;
}

/**
 * Removes leading commas and trims whitespace from properties string
 * @param {!String} props Properties string to trim 
 * @returns {String}
 */
function trim(props){
    if(props[0] === ',') props = props.substring(1);
    return props.trim();
}

/**
 * Parses the properties string to retrieve the next property value
 * @param {!String} props The full properties string to parse
 * @returns {Object} Returns an object with any combination of "append", "replace", and "error" attributes
 */
function getNextProp(props){
    var qs = getQualifiers(props);
    if(qs === null)
        return {append: props, replace: ''};
    //Get the prop name by slicing until the minimum qualifier
    var name = props.slice(0, qs[qs.min]);
    //Remove the prop name from the props string
    props = props.substring(qs[qs.min] + 1);
    //If we could not find an equals sign, then just return the name as the value
    if(qs.min !== 'eq')
        return {append: name, replace: props};
    //Quick trim
    props = trim(props);
    //Parse String Value
    if(props.indexOf("\"") === 0){
        var end = props.substring(1).indexOf("\"");
        if(end === -1) return {error: `INVALID SYNTAX: missing closing quotation in string property "${name}"!`};
        var value = parseStringValue(props.slice(0, end+2));
        return {append: {property: name, value: value}, replace: props.substring(end+2)};
    }
    //Parse Array Value
    else if(props.indexOf("\[") === 0){
        var end = locateArrayClose(props);
        if(!end) return {error: `INVALID SYNTAX: missing closing bracket for array property "${name}"!`};
        var value = parseArrayValue(props.slice(0, end+1));
        if(!value) return {error: `INVALID SYNTAX: unable to parse array property ${name}!`};
        return {append: {property: name, value: value}, replace: props.substring(end+1)};
    }
    //Parse Unknown Types
    else{
        //Get new qualifiers since props string has changes
        qs = getQualifiers(props);
        if(qs === null){
            var unparsedValue = props;
            props = '';
        }else{
            var unparsedValue = props.slice(0, qs[qs.min]);
            props = props.substring(qs[qs.min]);
        }
        var value = parseUnknown(unparsedValue);
        return {append: {property: name, value: value}, replace: props};
    }
}

/**
 * Gets indexes of the next qualifiers and their collective minimum index (qualifiers = [",", " ", "="])
 * @param {!String} props Full properties string
 * @returns {Object} Returns the locations of the next comma, equals sign, whitespace and the minimum of the three
 */
function getQualifiers(props){
    var cm = props.indexOf(','),
        ws = props.indexOf(' '),
        eq = props.indexOf('=');
    if(cm === -1 && ws === -1 && eq === -1)
        return null;
    //Create array of valid qualifiers
    var check = [eq,ws,cm].filter(v => v !== -1);
    //Determine the first occuring qualifier
    var min = Math.min.apply(null, check);
    var qualifiers = {}
    qualifiers.cm = cm !== -1? cm : null;
    qualifiers.ws = ws !== -1? ws : null;
    qualifiers.eq = eq !== -1? eq : null;
    for(var key in qualifiers){
        if(qualifiers[key] === min){
            qualifiers.min = key;
            break;
        }
    }
    return qualifiers;
}

/**
 * Simply strips quotations from string properties
 * @param {!String} value string property value 
 * @returns {String}
 */
function parseStringValue(value){
    return value.replace(/^\"(.*)\"$/,'$1');
}

/**
 * Parses an array property from a string representation into an array
 * @param {!String} value Array property 
 * @returns {Object[]}
 */
function parseArrayValue(value){
    //Parse occurances of TRUE, FALSE, or NULL
    value = stringifyKeywords(value);
    value = stringifyEnums(value);
    try{
        value = JSON.parse(value);
        return value;
    }catch(e){
        return null;
    }
}

/**
 * Attempts to convert an unknown into either a keyword, a number, or keeps it as an enumeration
 * @param {!String} value The unknown string value type to convert 
 * @returns {(Boolean|Number|null|String)}
 */
function parseUnknown(value){
    value = replaceKeywords(value);
    value = parseNumber(value);
    return value;
}

/**
 * Attempts to convert a string into a number, and returns the original if it fails
 * @param {!String} value 
 * @return{(Number|String)}
 */
function parseNumber(value){
    var orig = value;
    try{
        value = parseFloat(value);
        if(isNaN(value)) return orig;
        return value;
    }catch(e){
        return orig;
    }
}

/**
 * Parses a prop string to find the closing bracket of an array string
 * @param {!String} props Full props string 
 * @returns {Number} index of the closing bracket
 */
function locateArrayClose(props){
    var end = 0;
    var opens = 1;
    //Start at index 1 since we already know the first index is an opening bracket
    for(var i = 1; i < props.length; i++){
        if(props[i] === "\]")
            opens--;
        else if(props[i] === "\[")
            opens++;
        if(opens === 0){
            end = i;
            break;
        }
    }
    return end;
}

/**
 * Converts boolean string representations or null into their appropriate stringified js representations
 * @param {!String} value string to convert
 * @returns {String} converted type string or original string on failure
 */
function stringifyKeywords(value){
    //Parse booleans
    value = value.replace(/true/ig,'true');
    value = value.replace(/false/ig,'false');
    //Parse null
    value = value.replace(/null/ig,'null');
    return value;
}

/**
 * Converts boolean string representations or null into their appropriate js representations
 * @param {!String} value string to conver
 * @returns {(Boolean|null|String)} convert type or original string
 */
function replaceKeywords(value){
    //Parse booleans
    if(value.match(/^true$/i)) return true;
    if(value.match(/^false$/i)) return false;
    if(value.match(/^null$/i)) return null;
    return value;
}

/**
 * Attempts to find ENUMS in an array properties string and convert them into string representations
 * @param {!String} value 
 * @returns {String}
 */
function stringifyEnums(value){
    var temp = value;
    //Priming replace
    value = value.replace(ENUM, '$1\"$2\"$3');
    //Compare original to replaced  (if they match, all enums have been parsed)
    while(value !== temp){
        temp = value;
        value = value.replace(ENUM, '$1\"$2\"$3');
    }
    return value;
}

/**
 * Applies a model "each" array to the passed in properties array to convert it to an object
 * @param {Object[]} orig Properties array passed in (usually array of arrays)
 * @param {Object[]} each Array representation of what each index in the array of arrays represents
 * @returns {Object[]}
 */
function modifyArray(orig, each){
	for(var i = 0; i < orig.length; i++){
		if(typeof orig[i] == 'object' && orig[i] !== null){
			var indexValue = {};
			for(var j = 0; j < orig[i].length; j++){
				if(typeof each[j] !== 'undefined') var key = each[j];
				else var key = "index" + j;
				indexValue[key] = orig[i][j];
			}
			orig[i] = indexValue;
		}
	}
	return orig;
}