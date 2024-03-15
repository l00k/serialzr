import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiSpies from 'chai-spies';
import chaiSubset from 'chai-subset';

chai.use(chaiAsPromised);
chai.use(chaiSubset);
chai.use(chaiSpies);

declare const global : any;
(<any>global).expect = chai.expect;

declare global
{
    // @ts-ignore
    const expect : Chai.ExpectStatic;
}
