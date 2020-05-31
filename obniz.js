const Obniz = require("obniz");

module.exports = function(RED) {

  function obniz(n) {
    RED.nodes.createNode(this,n);
    this.obnizId = n.obnizId;
    var node = this;

    node.status({ fill: 'green', shape: 'ring', text: 'connecting...' });
    var connected = false;
    var obniz = new Obniz(this.obnizId);

    obniz.onconnect = function(){
      connected = true;
      node.status({ fill: 'green', shape: 'ring', text: 'ping to obniz...' });
      obniz.pingWait().then(function () {
        node.status({ fill: 'green', shape: 'dot', text: 'connected' });
      });
    };

    obniz.onclose = function(){
      connected = false;
      node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    };

    this.on('input', function(msg) {
      var payload = msg.payload;
      if(obniz && connected){
        obniz.send(payload);
      }
    });

    node.on('close', function () {
      obniz.close();
    });
  }
  RED.nodes.registerType("obniz",obniz);
}