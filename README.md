# facebookAuth
Facebook APP authentication with passport and certification storing.

This is Back end and certification storage to facebookDemoAPI.

Application will use Facebook users own credentials and otherwise credentials that are inserted in the program.
Application will store Facebook users pageIG, clientID and clientSecret to the server.
pageId will determine which credentials are used.

Client-side: HTML, CSS, JavaScript, jQuery

Server-side: Node.js, Express

Demo here: https://juliarainto.com/apps/facebookDemo
Demo here: https://juliarainto.com/apps/demoFaceSivu

## Start application

Start
```
npm install -g http-server
```
Server:
```
cd .\server
npm install
npm start
```
Client:
```
cd .\client
http-server
open browser to: http://localhost:8080
```
Build:
```
npm build
```
# Applications installation to webserver

This installation is tested to work on Ubuntu 16.04 system and Nginx software. 

## REQUIRED INSTALLATIONS

### NodeJS

Remove old Node.js:

```
sudo -i
apt-get remove nodered -y
apt-get remove nodejs nodejs-legacy -y
exit
```
Install curl and n, that will install latest Node.js: 

```
sudo apt-get install curl
curl -L https://git.io/n-install | bash
```
* Installation asks y/N, push y

* Installation asks at the end the following: IMPORTANT: OPEN A NEW TERMINAL TAB/WINDOW or run `. /root/.bashrc` before using n and Node.js. Write the following command: 

```
. /root/.bashrc
```

Verify that installation worked: 

```
node -v
npm -v
```
Node version should be v.10.6.0 (or the newest)
Npm version should be v.6.1.0 (or the newest)

```
