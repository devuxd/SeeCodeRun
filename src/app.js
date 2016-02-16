export class App {
  configureRouter(config, router) {
    config.title = 'SeeCode.Run';
    config.map([
      {
        route: ['', 'pastebin'],
        name: 'pastebin',
        moduleId: 'pastebin',
        nav: true,
        title: 'Pastebin'
      },
      {
        route: ['js-editor', 'js-editor/:id'],
        name: 'js-editor',
        moduleId: 'jsEditor/js-editor',
        nav: false,
        title: 'JS Editor'
      }
    ]);

    this.router = router;
  }
}
