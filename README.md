## node-red obniz node


This library add obniz node to your node-red.

It uses [obniz websocket api](https://obniz.io/doc/about_obniz_api).


## What is obniz

Obniz is system of Electronics as a Service.
You can find the documentation on [the website](https://obniz.io/doc/).



## Install
Run the following command in the root directory of your Node-RED install:
```
npm install node-red-contrib-obniz
```

or 

1. Go to "manage parlette" menu on your nod-red
2. Search "obniz" on Node-RED Library
3. Click "Install"


## How to use

msg.payload is json to send to obniz server.
The commands list is  [here](https://obniz.io/doc/about_obniz_api).

For example, clear display and show text command is this.
```json
[
   {
       "display": {
          "clear": true, 
          "text": "Hello, obniz!"
       }
   }
]
```


## LICENSE
See [LICENSE.txt](./LICENSE.txt)