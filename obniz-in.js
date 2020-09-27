const Obniz = require("obniz");
const runScriptInVm = require("./runScriptInVm");

module.exports = function(RED) {

  function obniz(n) {
    RED.nodes.createNode(this,n);
    this.obnizNode = RED.nodes.getNode(n.obniz);
    this.name = n.name;
    this.code = n.code;

    if(this.obnizNode){
      this.status(this.obnizNode.currentStatus);

      this.obnizNode.events.on("node-status", (status)=>{
        this.status(status);
      });

      this.obnizNode.events.on("after-connected", ()=>{
        runScriptInVm(RED, this, this.code, this.obnizNode.obniz, this.obnizNode.obnizParts, {}, this.send.bind(this));
      });

    }





  }
  RED.nodes.registerType("obniz-in",obniz);
}
