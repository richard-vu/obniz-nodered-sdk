const Obniz = require("obniz");
const runScriptInVm = require("./runScriptInVm");

module.exports = function(RED) {

  function obniz(n) {
    RED.nodes.createNode(this,n);
    this.obnizNode = RED.nodes.getNode(n.obniz);
    this.name = n.name;
    this.code = n.code;
    this.interval = n.interval;

    if(this.obnizNode){
      this.status(this.obnizNode.currentStatus);

      this.obnizNode.events.on("node-status", (status)=>{
        this.status(status);
      });

      this.obnizNode.events.on("after-connected", ()=>{
        this.obnizNode.obniz.repeat(async ()=>{
          await new Promise((resolve, reject) => {
            let done = (err)=>{
              if(err){
                node.error(err);
                reject(err);
                return;
              }
              resolve();
            }
            runScriptInVm(RED, this, this.code, this.obnizNode.obniz, this.obnizNode.obnizParts, {}, this.send.bind(this), done);

          })
        },this.interval)
      });

    }





  }
  RED.nodes.registerType("obniz-repeat",obniz);
}
