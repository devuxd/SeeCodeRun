SeeCodeRun is divided into a [React frontend](/scr-app/) and [Firebase backend](/functions/).
Our React App was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app),
 which persists its data in [Firebase](https://firebase.google.com).

# See Code Run
Take a look of [seeCode.run website](https://seecode.run)

## Sending Feedback

We are always open to [your feedback](https://github.com/devuxd/SeeCodeRun/issues).

## Folder Structure

The main folders and relevant files should look like this:

```
/
  functions/
  scr-app/
  deploySCRDev.(sh|bat)
  firebase.json
  ...
```

# Installation
Follow these instructions to develop or deploy seeCode.run. Four sensitive files have been omitted from the
repository, thus requiring you to create them.

## Pre-requisites
You will need to install [Node](https://nodejs.org/en/download/).

## Pending Files
You will need to create the following files:
```/
    functions/
        cloud-functions.json
        serviceAccountKey.dev.json
    scr-app/
        firebaseDevConfig.js
    .firebaserc
```

### Create a development firebase project
Create your own project in [firebase](https://console.firebase.google.com/).
 Create a google account if you do not have one already.

### scr-app/firebaseDevConfig.js
Go to Project Overview > Add Firebase to your web app. Copy the content of the config variable and paste it in a new
file called ```scr-app/firebaseDevConfig.js```, the content should look like this:

```
export default {
    root: '/scr2',
    config: {
        apiKey: "...",
        authDomain: "...",
        databaseURL: "[YOUR_FIREBASE_DB_URL]",
        projectId: "[YOUR_PROJECT_ID]",
        storageBucket: "...",
        messagingSenderId: "..."
    },
    cloudFunctionsPath: '[YOUR_CLOUD_FUNCTIONS_EMULATOR_PATH]'
};
```
You will need ```[YOUR_FIREBASE_DB_URL]``` and ```[YOUR_PROJECT_ID]``` later in the installation. Keep track of them.
After running the emulator(instructions below), you can obtain the path generated locally for your functions and replace
```[YOUR_CLOUD_FUNCTIONS_EMULATOR_PATH]```.

#### Add database rules
```
{
  "rules": {
    ".read":	false,
    ".write":	false,
    "scr2":{
      ".read":	"auth.uid === 'cloudFunctionsUserId'",
      ".write":	"auth.uid === 'cloudFunctionsUserId'",
        "$uid": {
        ".read":	"$uid === auth.uid || auth.uid === 'cloudFunctionsUserId'",
        ".write":	"(data.exists() && $uid === auth.uid) || auth.uid === 'cloudFunctionsUserId'",
        "users":{
             ".indexOn": ["chatUserName"]
           }
        }
    }
  }
}
```
You may want to set your own ```cloudFunctionsUserId``` value,
it helps identifying the admin credentials when used in cloud functions. It's value must match the one set to ```uid```
in functions/cloud-functions.json (below).

#### Install firebase tools and log in
```
npm install -g firebase-tools
firebase login
```

#### Check your available projects and theirs ids
```
firebase list
```
Find a project with the same id as ```[YOUR_PROJECT_ID]```, if you cannot find it, the project has not been created or
the user you are signed in is not the same you used to create the project in the browser.

### functions/cloud-functions.json
Create the file functions/cloud-functions.json with the following content:
```
{
  "type": "service_account_uid",
  "uid": "cloudFunctionsUserId",
  "devDbURL": "[YOUR_FIREBASE_DB_URL]"
}
```
For ````cloudFunctionsUserId```, it must match
the value that you set in your Firebase database rules(above).
Replace ```[YOUR_FIREBASE_DB_URL]``` with the value you set in ```scr-app/firebaseDevConfig.js```.

### functions/serviceAccountKey.dev.json
First get the service account info from the Firebase console.
 Tap in Project settings(gear icon by the side of Project Overview) > Service Accounts. In Firebase Admin SDK,
 Choose Node.js configuration and click on "Generate New Private Key" to obtain the service account info.
Create the file functions/serviceAccountKey.dev.json and paste the content obtained from the service account info.
 It should look like this:
 ```
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### Add .firebaserc
Create a file with the following content:
```
{
  "projects": {
    "development": "[YOUR_PROJECT_ID]",
    "default": "[YOUR_PROJECT_ID]"
  }
}
```
Replace ```[YOUR_PROJECT_ID]``` with the value you set in ```scr-app/firebaseDevConfig.js```.

### Install dependencies for the first time
In ```functions/```, type:
```
npm install
```
In ```scr-app/```, type:
```
npm run install-and-monaco
```

## Congrats! your are ready to develop and contribute to seeCode.run

# Development

## Start the cloud functions emulator
In ```functions/```, type:
```
npm run serve
```
Now your emulator will be receiving requests in port 5000(default). The available functions are listed like this:
```
functions: getPastebin: http://localhost:5000/[[YOUR_PROJECT_ID]/us-central1]/getPastebin
```
Use [[YOUR_PROJECT_ID]/us-central1] to set [YOUR_CLOUD_FUNCTIONS_EMULATOR_PATH]
back in ```scr-app/firebaseDevConfig.js```. ```us-central1``` may be different depending on where your are in the globe.

If you make changes to the files in this folder, stop the emulator and start it again to reflect such changes.
## Start you local server
In ```scr-app/```, type
```
npm start
```
The server should be running in port 3000(default). It is also listening for files changes and refreshing your app as
it changes.

# Deployment
To deploy cloud functions you will need to obtain a
[service account key](https://firebase.google.com/docs/admin/setup) and
 create a file in functions called serviceAccountKey.prod.json in the functions folder.
  **Do not commit this file to the repo**.

## Unix
```
./deploySCR.sh
```
## Windows
```
deploySCR
```

# Production Configuration
**Note for seeCode.run contributors:** Only if you are responsible for production deployments, follow this steps.
**Note for external users:** If you are hosting a fork a seeCode.run for production,
 use your own firebase production project instead. Any [ASK_ADMIN_*] placeholder refers to your project information.
## Additional Installation
Follow these instructions to develop or deploy seeCode.run. Sensitive files have been omitted from the
repository, thus requiring you to create them.

## Additional Pending Files
You will need to create the following files:
```/
    functions/
        serviceAccountKey.prod.json
    scr-app/
        firebaseProdConfig.js
```
### Modify functions/cloud-functions.json
Ask the production project owner to share the info for this file
```
{
  ...
  "uid": "[ASK_ADMIN_1]",
  "prodDbURL": "[ASK_ADMIN_2]",
}
```
### functions/serviceAccountKey.prod.json
```
[ASK_ADMIN_3]
```
## Obtain production firebase project configuration
Go to Project Overview > Add Firebase to your web app. Copy the content of the config variable and paste it in a new
file called scr-app/firebaseProdConfig.js, the content should look like this:

```
export default {
    [ASK_ADMIN_4]
};
```

#### Add database rules
```
{
  "rules": {
    ".read":	false,
    ".write":	false,
    "scr2":{
      ".read":	"auth.uid === '[ASK_ADMIN_1]'",
      ".write":	"auth.uid === '[ASK_ADMIN_1]'",
        "$uid": {
        ".read":	"$uid === auth.uid || auth.uid === '[ASK_ADMIN_1]'",
        ".write":	"(data.exists() && $uid === auth.uid) || auth.uid === '[ASK_ADMIN_1]'",
        "users":{
             ".indexOn": ["chatUserName"]
           }
        }
    }
  }
}
```

### Check your available projects and theirs ids
```
firebase list
```
Check here if the admin granted you permissions to the production project.

### Modify .firebaserc
Add the following content:
```
{
  "projects": {
    ...
    "production": "[ASK_ADMIN_5]",
  }
}
```

## Production deployment
### Unix
```
./deploySCR.sh
```
### Windows
```
deploySCR
```