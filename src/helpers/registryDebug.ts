import type { ClassConstructor } from '$/def.js';
import { Registry } from '$/Registry.js';

type Color =
    | 'black' | 'red' | 'green' | 'yellow'
    | 'blue' | 'magenta' | 'cyan' | 'white'
    | 'brightBlack' | 'brightRed' | 'brightGreen' | 'brightYellow'
    | 'brightBlue' | 'brightMagenta' | 'brightCyan' | 'brightWhite'
    ;

type FgColor = Color | 'none'
type BgColor = `bg${Capitalize<Color>}` | 'none';

const colorCodes : Record<FgColor, string> = {
    none: '',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    brightBlack: '\x1b[90m',
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m',
};

const bgColorCodes : Record<BgColor, string> = {
    none: '',
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',
    bgBrightBlack: '\x1b[100m',
    bgBrightRed: '\x1b[101m',
    bgBrightGreen: '\x1b[102m',
    bgBrightYellow: '\x1b[103m',
    bgBrightBlue: '\x1b[104m',
    bgBrightMagenta: '\x1b[105m',
    bgBrightCyan: '\x1b[106m',
    bgBrightWhite: '\x1b[107m',
};

function colorize (
    message : string,
    fgColor : FgColor = 'none',
    bgColor : BgColor = 'none',
) : string
{
    const fg = colorCodes[fgColor] || '';
    const bg = bgColorCodes[bgColor] || '';
    return `${fg}${bg}${message}\x1b[0m`;
}


export function printTypeDefinition (
    type : ClassConstructor,
    indent : number = 0,
    circular : ClassConstructor[] = [],
) : void
{
    const registry = Registry.getSingleton();
    
    if (circular.includes(type)) {
        return;
    }
    
    circular = [ ...circular, type ];
    
    const typeDef = registry.getTypeDefinition(type);
    
    if (!typeDef) {
        // eslint-disable-next-line no-console
        console.debug(
            '    '.repeat(indent),
            colorize(type.name, 'brightCyan'),
        );
    }
    else {
        // eslint-disable-next-line no-console
        console.debug(
            '    '.repeat(indent),
            colorize(type.name, 'brightCyan'),
            colorize(typeDef.name, 'yellow'),
        );
        
        const properties = registry.getAllProperties(type);
        
        for (const property of properties) {
            const propDef = registry.getPropertyDefinition(type, property);
            
            if (propDef.typeDscr) {
                const propTypeKey = Object.keys(propDef.typeDscr)[0];
                const propType = propDef.typeDscr[propTypeKey]();
                
                // eslint-disable-next-line no-console
                console.debug(
                    '    '.repeat(indent + 1),
                    colorize(property.toString(), 'brightBlue'),
                    ':',
                    colorize(propTypeKey, 'magenta'),
                    colorize(propType?.name, 'magenta'),
                );
                
                const propTypeDef = registry.getTypeDefinition(propType);
                if (propTypeDef) {
                    printTypeDefinition(propType, indent + 1, circular);
                }
            }
            else {
                // eslint-disable-next-line no-console
                console.debug(
                    '    '.repeat(indent + 1),
                    colorize(property.toString(), 'brightBlue'),
                    ':',
                    colorize('unknown', 'white'),
                );
            }
        }
    }
}
