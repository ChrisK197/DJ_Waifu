export const validString = (str) => {
    if (!str) throw 'Must provide a string';
    if (typeof str !== 'string') throw 'Must be a string';
    str = str.trim();
    if (str.length === 0) throw 'String cannot be empty';
    return str;
}

export const validNumber = (num) => {
    if (num === undefined || num === null) throw 'Must provide a number';
    else if (typeof num === 'string') {
        const parsed = Number(num);
        if (isNaN(parsed)) throw 'Must be a number';
        if (parsed < 0) throw 'Number cannot be negative';
        if (!Number.isInteger(parsed)) throw 'Number must be an integer';
        return parsed;
    }
    else if (typeof num === 'number') {
        if (num < 0) throw 'Number cannot be negative';
        if (!Number.isInteger(num)) throw 'Number must be an integer';
        return num;
    } else {
        throw 'Must be a number';
    }
}