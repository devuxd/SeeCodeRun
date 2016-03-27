import {App} from '../../src/app';

class RouterStub {
  configure(handler) {
    handler(this);
  }

  map(routes) {
    this.routes = routes;
  }
}

describe('the App module', () => {
  var sut;
  var mockedRouter;

  beforeEach(() => {
    mockedRouter = new RouterStub();
    sut = new App();
    sut.configureRouter(mockedRouter, mockedRouter);
  });

  it('contains a router property', () => {
    expect(sut.router).toBeDefined();
  });

  it('configures the router title', () => {
    expect(sut.router.title).toEqual('SeeCode.Run');
  });

  it('should have a pastebin route', () => {
    expect(sut.router.routes).toContain({ route: ['', '/:id'], name: 'pastebin',  moduleId: 'pastebin/pastebin', nav: false, title: 'Pastebin' });
  });
});
