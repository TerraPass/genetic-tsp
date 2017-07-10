
class BaseException extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

class InvalidArgumentException extends BaseException
{
    constructor(detail, argumentName)
    {
        var message = "Invalid value for argument "+argumentName+": "+detail;

        super(message);
        
        //this.name = "InvalidArgumentException";
        this.message = message;
        //this.stack = (new Error()).stack;
    }
}

class MissingArgumentException extends BaseException
{
    constructor(argumentName)
    {
        var message = "Argument "+argumentName+" must not be null or undefined";
        
        super(message);
        
        //this.name = "MissingArgumentException";
        this.message = message;
        //this.stack = (new Error()).stack;
    }
}

export {BaseException, InvalidArgumentException, MissingArgumentException};
