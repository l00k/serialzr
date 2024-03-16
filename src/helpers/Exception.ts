export class Exception extends Error
{
    
    public name : string = 'Exception';
    public code : number;
    
    public constructor (
        message : string,
        code : number
    )
    {
        super(message);
        this.code = code;
    }
    
    public toString ()
    {
        return '[' + this.code + '] '
            + this.name + ': '
            + this.message
            ;
    }
    
}
