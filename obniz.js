
const Obniz = require("obniz");

module.exports = function(RED) {

  function obniz(n) {
    RED.nodes.createNode(this,n);
    this.obnizId = n.obnizId;
    var node = this;

    var connected = false;
    var obniz = new Obniz(this.obnizId);
    obniz.onconnect = function(){
      connected = true;
    };
    obniz.onclose = function(){
      connected = false;
    };

    this.on('input', function(msg) {
      var payload = msg.payload;
      if(obniz && connected){
        obniz.send(payload);
      }
    });
  }
  RED.nodes.registerType("obniz",obniz);
}