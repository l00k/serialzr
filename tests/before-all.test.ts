import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiSubset from 'chai-subset';

chai.use(chaiAsPromised);
chai.use(chaiSubset);

declare const global : any;
(<any>global).expect = chai.expect;

declare global
{
    // @ts-ignore
    const expect : Chai.ExpectStatic;
}
