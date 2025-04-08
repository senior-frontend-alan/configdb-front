import { slugify as slugify_ } from 'transliteration';

export function logDebug(...vargs) {
    console.log("DEBUG:", ...vargs);
}

export function isDefined(item, checkNull = true) {
    return (typeof item !== "undefined" && (!checkNull || item !== null));
}

export function getBoolean(item) {
    return IsBoolean(item) ? item : isString(item) ? item.toLowerCase() === 'true' : false
}

export function getCounter(startCount = 0){
    let index = startCount

    return function(incCount = 1) {
        return index += incCount
    }
}

export function isString(item) {
    return (typeof item === "string" || item instanceof String);
}

export function isFunction(item) {
    return (typeof item === "function");
}

export function isObject(item) {
    return (typeof item === "object" && !Array.isArray(item) && item !== null);
}

export function isNotEmptyObject(item) {
    return (isObject(item) && Object.keys(item).length > 0);
}

export function IsBoolean(x) {
    return typeof x == 'boolean'
}

/** Convert date to microseconds
 *
 * @param dateStr date
 * @returns {number}
 */
export function parseDateWithUs(dateStr) {
    return Date.parse(dateStr)*1000 + getDateUs(dateStr)
}
/** Get microseconds(us) from date
 * Examples:
 * '2024-02-14T12:55:45.30159Z'  -> 590
 * '2024-02-14T12:55:45.301592Z' -> 592
 * '2024-02-14T12:55:45.3015+11:30' -> 500
 * '2024-02-14T12:55:45+11:30' -> 0
 * @param dateStr date
 * @returns {number}
*/
export function getDateUs(dateStr) {
    const dotIndex = ~dateStr.lastIndexOf('.')

    return dotIndex ? parseInt(dateStr.split('.').pop().match(/^\d+/)[0].padEnd(9,'0').slice(-6, -3)) : 0
}

export function stringFormat(s, dict, arrayseparator) {
    const formatByDict = (str, obj) => str.replace(/{([.a-zA-Z_]*?)}/g, (x, y) => y.split('.').reduce((o,i)=> (Array.isArray(o)&&typeof(o[0])==='object')?o.map(e=> e[i]).join(arrayseparator): o?o[i]:'Undefined', obj));
    return formatByDict(s, dict);
}

export function clone(v) {
    if (v instanceof Array) {
        return v.map(x => clone(x));
    }
    else if (v instanceof Object) {
        return Object.keys(v).reduce((obj, key) => ({ ...obj, [key]: clone(v[key])}), {});
    }
    else {
        return v;
    }
}

export function unwrapFkReference(value) {
    if (value instanceof Array) {
        return value.map(x => (x instanceof Object)? x.id: x );
    }
    else {
        return (value instanceof Object)? value.id: value;
    }
}

export function objectPathGet(obj, path) {
    console.assert((path instanceof Array) || !path.startsWith('.'), path);
    const parr = (path instanceof Array) ? path : path.split('.');
    let target = obj;
    for (let i=0; i<parr.length; i++) {
        if (!(target && target instanceof Object)) {
            return null;
        }
        const attr = parr[i];
        if (!(attr in target)) {
            return null;
        }
        target = target[attr];
    }
    return target;
}

export function objectPathGetList(obj, path) {
    console.assert((path instanceof Array) || !path.startsWith('.'), path);
    const parr = (path instanceof Array) ? path : path.split('.');
    let target = obj;
    for (let i=0; i<parr.length; i++) {
        const attr = parr[i];
        if (Array.isArray(target)) {
            target = target.map(el => el[attr]);  //#TODO#
        } else {
            if (!(attr in target)) {
                return null;
            }
            target = target[attr];
        }
        if (!target) {
            return null;
        }
    }
    return target;
}

export function objectPathSet(obj, path, value, fn_setter = null) {
    const parr = (path instanceof Array) ? path : path.split('.');
    let target = obj;
    const targetIndex = parr.length-1;
    for (let i=0; i<targetIndex; i++) {
        if (!(parr[i] in target)) {
            return null;
        }
        target = target[parr[i]];
    }
    if (fn_setter) {
        fn_setter(target, parr[targetIndex], value)
    } else {
        target[parr[targetIndex]] = value;
    }
    target[parr[targetIndex]] = value;
    return true;
}

export function evalIfExpr(ifexpr, data, fncache, cachekey) {
    if (!ifexpr) {
        return true;
    }
    if (isString(ifexpr)) {
        let fncheck = fncache[cachekey]
        if (!fncheck) {
            // fncheck = eval(ifexpr);
            fncheck = new Function("data", ifexpr);
            fncache[cachekey] = fncheck;
        }
        return fncheck(data);
    } else {
        for(const [source, targetValue] of Object.entries(ifexpr)) {
            const value = objectPathGet(data, source);
            if (targetValue instanceof Array) {
                if (!targetValue.includes(value)) return false;
            } else if (IsBoolean(targetValue)) {
                if (!value === targetValue) return false;
            } else {
                if (value != targetValue) return false;
            }
        }
    }
    return true;
}

export const ApplicationMixin = {
    inject: ['A'],
}

export function truncate(text, length, clamp) {
    clamp = clamp ?? '...';
    return text?.length > length ? text.slice(0, length - clamp.length) + clamp : text;
}

/* #BAD# maybe not the best implementation */
export function deepEqual(a, b)
{
    if( (typeof a == 'object' && a != null) &&
        (typeof b == 'object' && b != null) )
    {
        if( Object.keys(a).length != Object.keys(b).length ) {
            return false;
        }
        for(const key in a) {
            if(!(key in b) || !deepEqual(a[key],b[key])) {
                return false;
            }
        }
        for(const key in b) {
            if(!(key in a) || !deepEqual(b[key],a[key])) {
                return false;
            }
        }
        return true;
    }
    return a===b;
}

export function mergeDeep(...objects) {
  return objects.filter(obj => isObject(obj)).reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
//        prev[key] = pVal.concat(...oVal);
        prev[key] = [...new Set([...oVal, ...pVal])];
      }
      else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      }
      else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

export function bisectLeft(a, x, lo=0, hi=a.length) {
    while (lo < hi) {
        const m = (lo+hi) >> 1;
        if (a[m] < x) {
            lo = m+1;
        }
        else {
            hi = m;
        }
    }
    return lo;
}

export function bisectRight(a, x, lo=0, hi=a.length) {
    while (lo < hi) {
        const m = (lo+hi) >> 1;
        if (a[m] <= x) {
            lo = m+1;
        }
        else {
            hi = m;
        }
    }
    return lo;
}

/**
 * Default setting function
 * The function finds objects in dashLayout that have a value with innerQuery[key]
 * and substitutes in dashLayout['default'] = innerQuery[value]
 * Example:
 *   innerQuery = {tab_control: 'system'}
 *   dashLayout = {component: {name: 'tab_control', value: ''}}
 *   result: {component: {name: 'tab_control', value: '', default: 'system'}
 * @param innerQuery - object with default values
 * @param dashLayout - object with form elements. Function mutable this object!!!
 *
 */
export function setDefaultValueByUrlParams(innerQuery, dashLayout) {
    function setDefaultValue(obj, value) {
        const defaultField = 'elementValueFromUrl';
            if (obj['multiple']) {
                if (!obj.separator) {
                    let jsonVal
                    try {
                        jsonVal = JSON.parse(value);
                    } catch {
                        jsonVal = null
                    }
                    obj[defaultField] = jsonVal ? jsonVal : value ? value.split(',')  : []
                } else {
                    obj[defaultField] = value ? value : []
                }
            } else if (obj['input_type'] === 'number') {
                obj[defaultField] = Number(value);
            } else {
                obj[defaultField] = value;
            }
    }
    function searchDefaultValue(innerLayout) {
        Object.keys(innerLayout).forEach(key => {
            if (innerLayout[key] in innerQuery) {
                setDefaultValue(innerLayout, innerQuery[innerLayout[key]])
            } else if (isObject(innerLayout[key])) {
                searchDefaultValue(innerLayout[key])
            } else if (Array.isArray(innerLayout[key])) {
                innerLayout[key].forEach(function (item) {
                    if (item instanceof Object) {
                        searchDefaultValue(item)
                    }
                })
            }
        })
    }

    if (isNotEmptyObject(innerQuery)) {
        searchDefaultValue(dashLayout);
    }
}

export function prepareQuery(query, api=false) {
    return Object.fromEntries(Object.entries(query || {})?.map(
        ([key, value]) =>
        [
            (Array.isArray(value) && value.length > 1 && api) ? (key+'__in') : key,
            (Array.isArray(value) && value.length == 1) ? value[0] : ((api && Array.isArray(value)) ? value.join(',') : value)
        ]
    ));
}

export function listUrlToView(url) {
    //#BAD#
    const comp = url?.split('/')
    const applName = comp?.[1];
    const viewname = comp?.reverse()?.[1];
    return {applName, viewname}
}

export function joinUrlPath(...args) {
    const comps = []
    let trailingSlash = false;
    for (const path of args) {
        if (path == null || path == undefined) {
            continue;
        }

        for (const addcomp of path.toString().split('/')) {
            if (addcomp === '') {
                trailingSlash = true;
                if (comps.length > 0) {
                    continue;
                }
            }
            if ((addcomp === '..') && (comps.length > 0) && (comps[comps.length-1] !== '..')) {
                comps.pop();
            }
            else {
                comps.push(addcomp);
            }
        }
    }
    if (trailingSlash) {
        comps.push('');
    }

    return comps.join('/');
}

export function slugify(s) {
    // return slugify_(s, {
    //     allowedChars: 'A-Za-z0-9-.',
    //     separator: '',
    //     lowercase: false,
    // });
    let comps = s.toLowerCase().replace(/[^a-z0-9-.,_~\/\\ ]/g, '').split(/[-.,_~\/\\ ]+/);
    let tokens = 0;
    for (var i = 0; i < comps.length; i++) {
        if (comps[i]) {
        tokens++;
        if (tokens > 1) {
            comps[i] = comps[i][0].toUpperCase() + comps[i].substring(1);
        }
        }
    }
    return comps.join('');
}