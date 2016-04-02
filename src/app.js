 
export class App {
  configureRouter(config, router) {
    config.title = 'SeeCode.Run';
    config.map([
      {
        route: ['', '/:id'],
        name: 'pastebin',
        moduleId: 'pastebin/pastebin',
        title: 'Pastebin'
      }
    ]);

    this.router = router;
  }
}
