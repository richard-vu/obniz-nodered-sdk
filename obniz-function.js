const Obniz = require("obniz");
const runScriptInVm = require("./runScriptInVm");

module.exports = function(RED) {

  function obniz(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    this.obnizNode = RED.nodes.getNode(n.obniz);
    this.name = n.name;
    this.code = n.code;

    if(this.obnizNode){
      this.status(this.obnizNode.currentStatus);
      this.obnizNode.events.on("node-status", (status)=>{
        this.status(status);
      });
    }


    this.on('input', function(msg, send, done) {

      runScriptInVm(RED, this, this.code, this.obnizNode.obniz, this.obnizNode.obnizParts, msg, send, done);
    });

  }
  RED.nodes.registerType("obniz-function",obniz);
}
