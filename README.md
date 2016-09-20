# SeeCode.Run

## Running The App

To run the app, follow these steps:

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.
2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
3. Ensure that [Gulp](http://gulpjs.com/) is installed globally. If you need to install it, use the following command:

  ```sh
  npm install -g gulp
  ```
  > **Note:** Gulp must be installed globally, but a local version will also be installed to ensure a compatible version is used for the project.
4. Ensure that [jspm](http://jspm.io/) is installed globally. If you need to install it, use the following command:

  ```shell
  npm install -g jspm
  ```
  > **Note:** jspm must be installed globally, but a local version will also be installed to ensure a compatible version is used for the project.

  > **Note:** jspm queries GitHub to install semver packages, but GitHub has a rate limit on anonymous API requests. It is advised that you configure jspm with your GitHub credentials in order to avoid problems. You can do this by executing `jspm registry config github` and following the prompts. If you choose to authorize jspm by an access token instead of giving your password (see GitHub `Settings > Personal Access Tokens`), `public_repo` access for the token is required.
5. Install the client-side dependencies with jspm:

  ```shell
  jspm install -y
  ```
6. To run the app from Cloud9 IDE, execute the following command:

  ```shell
  gulp watch
  ```
7. Browse to (http://seecoderun-[your user name].c9users.io:8082) to see the app. You can make changes in the code found under `src` and the browser should auto-refresh itself as you save files.

> The Skeleton App uses [BrowserSync](http://www.browsersync.io/) for automated page refreshes on code/markup changes concurrently across multiple browsers. If you prefer to disable the mirroring feature set the [ghostMode option](http://www.browsersync.io/docs/options/#option-ghostMode) to false

Build the app (this will give you a dist directory)
```shell
gulp build
```

## Bundling
Bundling is performed by [Aurelia Bundler](http://github.com/aurelia/bundler). A gulp task is already configured for that. Use the following command to bundle the app:

  ```shell
    gulp bundle
  ``` 

You can also unbundle using the command bellow:

  ```shell
  gulp unbundle
  ```
#### Configuration
The configuration is done by ```bundles.json``` file.

## Running The Unit Tests

To run the unit tests, first ensure that you have followed the steps above in order to install all dependencies and successfully build the library. Once you have done that, proceed with these additional steps:

1. Ensure that the [Karma](http://karma-runner.github.io/) CLI is installed. If you need to install it, use the following command:

  ```shell
  npm install -g karma-cli
  ```
2. Install Aurelia libs for test visibility:

```shell
jspm install aurelia-framework
jspm install aurelia-http-client
jspm install aurelia-router
```
3. You can now run the tests with this command:

  ```shell
  karma start
  ```

## Running The E2E Tests
Integration tests are performed with [Protractor](http://angular.github.io/protractor/#/).

1. Place your E2E-Tests into the folder ```test/e2e/src```
2. Install the necessary webdriver

  ```shell
  gulp webdriver-update
  ```

3. Configure the path to the webdriver by opening the file ```protractor.conf.js``` and adjusting the ```seleniumServerJar``` property. Typically its only needed to adjust the version number.

4. Make sure your app runs and is accessible

  ```shell
  gulp watch
  ```

5. In another console run the E2E-Tests

  ```shell
  gulp e2e
  ```

## Exporting bundled production version
A gulp task is already configured for that. Use the following command to export the app:

  ```shell
    gulp export
  ```
The app will be exported into ```export``` directory preserving the directory structure.
#### Configuration
The configuration is done by ```bundles.json``` file.
In addition, ```export.json``` file is available for including individual files.

## Deployment
The default deployment of SeeCodeRun is to a Firebase host. For that, it requires Firebase tools and authentication.
First, to get the tools, run:

```sh
npm install --save -g firebase-tools
```

Then login into your Firebase account:

```sh
firebase login
```
Following the instructions will end up opening a tab in your default browser where you can grant permissions to firebase tools with your Google account.
#####Note: The Firebase default deployment project is set in firebase.json.
Finally, to deploy:

```sh
gulp deploy
```

# Windows troubleshooting

## Browser-Sync error
Install the latest Visual Studio C++ compiler, or the whole Visual Studio.

Then, re-install Browser-Sync
```cmd
npm uninstall browse-sync
npm install -g browser-sync --msvs_version=2013
```
More details [here](https://www.browsersync.io/docs#windows-users)

for error:
```sh
> bufferutil@1.2.1 install C:\Users\DavidIgnacio\WebstormProjects\SeeCodeRun\node_modules\bufferutil
> node-gyp rebuild


C:\Users\DavidIgnacio\WebstormProjects\SeeCodeRun\node_modules\bufferutil>if not defined npm_config_node_gyp (node "C:\Program Files\no
dejs\node_modules\npm\bin\node-gyp-bin\\..\..\node_modules\node-gyp\bin\node-gyp.js" rebuild )  else (node "" rebuild )
Building the projects in this solution one at a time. To enable parallel build, please add the "/m" switch.
C:\Users\DavidIgnacio\WebstormProjects\SeeCodeRun\node_modules\bufferutil\build\bufferutil.vcxproj(20,3): error MSB4019: The imported 
project "C:\Microsoft.Cpp.Default.props" was not found. Confirm that the path in the <Import> declaration is correct, and that the fil
e exists on disk.
gyp ERR! build error
gyp ERR! stack Error: `C:\Windows\Microsoft.NET\Framework\v4.0.30319\msbuild.exe` failed with exit code: 1
gyp ERR! stack     at ChildProcess.onExit (C:\Program Files\nodejs\node_modules\npm\node_modules\node-gyp\lib\build.js:276:23)
gyp ERR! stack     at emitTwo (events.js:100:13)
gyp ERR! stack     at ChildProcess.emit (events.js:185:7)
gyp ERR! stack     at Process.ChildProcess._handle.onexit (internal/child_process.js:200:12)
gyp ERR! System Windows_NT 10.0.10586
gyp ERR! command "C:\\Program Files\\nodejs\\node.exe" "C:\\Program Files\\nodejs\\node_modules\\npm\\node_modules\\node-gyp\\bin\\node
-gyp.js" "rebuild"
gyp ERR! cwd C:\Users\DavidIgnacio\WebstormProjects\SeeCodeRun\node_modules\bufferutil
gyp ERR! node -v v5.7.0
gyp ERR! node-gyp -v v3.2.1
gyp ERR! not ok
npm WARN install:bufferutil@1.2.1 bufferutil@1.2.1 install: `node-gyp rebuild`
npm WARN install:bufferutil@1.2.1 Exit status 1

> utf-8-validate@1.2.1 install C:\Users\DavidIgnacio\WebstormProjects\SeeCodeRun\node_modules\utf-8-validate
> node-gyp rebuild

```

do :
```sh
npm install --global --production windows-build-tools
```

## Update NPM
```cmd
npm update -g npm
```
## Update Node
```cmd
@powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
```
