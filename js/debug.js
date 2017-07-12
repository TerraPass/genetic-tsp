import * as except from 'js/except.js';

function ensureNotNull(value, valueName)
{
    if(value === null || value === undefined)
    {
        throw new except.MissingArgumentException(valueName);
    }
    return value;
}

function ensureNotEmpty(value, valueName)
{
    if(value.length === 0)
    {
        throw new except.InvalidArgumentException("${valueName} must not be empty", valueName);
    }
    return value;
}

function ensure(condition, value, valueName, explanation)
{
    if(!condition)
    {
        throw new except.InvalidArgumentException(explanation, valueName);
    }
    return value;
}

export {ensure, ensureNotNull, ensureNotEmpty};
