export class Exception extends Error
{
    
    public code : number;
    
    public constructor (
        message : string,
        code? : number,
    )
    {
        super(message);
        this.message = this._getMessage(message, code);
        this.code = code;
    }
    
    public _getMessage (
        message : string,
        code? : number,
    ) : string
    {
        return (code ? '[' + code + '] ' : '') + message;
    }
    
}
