const vm = require("vm");
var util = require("util");


module.exports  = (RED, node, code, obniz, obnizParts, msg, send, done) => {

  msg = msg || {};
  send = send || (()=>{});
  done = done || ((err)=>{if(err){node.error(err)}});
  var functionText = "var results = null;" +
    "results = (async function(msg,__send__,__done__){ " +
    "var __msgid__ = msg._msgid;" +
    "var node = {" +
    "id:__node__.id," +
    "name:__node__.name," +
    "log:__node__.log," +
    "error:__node__.error," +
    "warn:__node__.warn," +
    "debug:__node__.debug," +
    "trace:__node__.trace," +
    "on:__node__.on," +
    "status:__node__.status," +
    "send:function(msgs,cloneMsg){ __node__.send(__send__,__msgid__,msgs,cloneMsg);}," +
    "done:__done__" +
    "};\n" +
    code + "\n" +
    "})(msg,send,done);";

  node.outstandingTimers = [];
  node.outstandingIntervals = [];

  var sandbox = {
    console: console,
    util: util,
    Buffer: Buffer,
    Date: Date,
    RED: {
      util: RED.util
    },
    __node__: {
      id: node.id,
      name: node.name,
      log: function () {
        node.log.apply(node, arguments);
      },
      error: function () {
        node.error.apply(node, arguments);
      },
      warn: function () {
        node.warn.apply(node, arguments);
      },
      debug: function () {
        node.debug.apply(node, arguments);
      },
      trace: function () {
        node.trace.apply(node, arguments);
      },
      send: function (send, id, msgs, cloneMsg) {
        send(msgs, cloneMsg)
      },
      on: function () {
        if (arguments[0] === "input") {
          throw new Error(RED._("function.error.inputListener"));
        }
        node.on.apply(node, arguments);
      },
      status: function () {
        node.status.apply(node, arguments);
      },
    },
    context: {
      set: function () {
        node.context().set.apply(node, arguments);
      },
      get: function () {
        return node.context().get.apply(node, arguments);
      },
      keys: function () {
        return node.context().keys.apply(node, arguments);
      },
      get global() {
        return node.context().global;
      },
      get flow() {
        return node.context().flow;
      }
    },
    flow: {
      set: function () {
        node.context().flow.set.apply(node, arguments);
      },
      get: function () {
        return node.context().flow.get.apply(node, arguments);
      },
      keys: function () {
        return node.context().flow.keys.apply(node, arguments);
      }
    },
    global: {
      set: function () {
        node.context().global.set.apply(node, arguments);
      },
      get: function () {
        return node.context().global.get.apply(node, arguments);
      },
      keys: function () {
        return node.context().global.keys.apply(node, arguments);
      }
    },
    env: {
      get: function (envVar) {
        var flow = node._flow;
        return flow.getSetting(envVar);
      }
    },

    setTimeout: function () {
      var func = arguments[0];
      var timerId;
      arguments[0] = function () {
        sandbox.clearTimeout(timerId);
        try {
          func.apply(node, arguments);
        } catch (err) {
          node.error(err, {});
        }
      };
      timerId = setTimeout.apply(node, arguments);
      node.outstandingTimers.push(timerId);
      return timerId;
    },
    clearTimeout: function (id) {
      clearTimeout(id);
      var index = node.outstandingTimers.indexOf(id);
      if (index > -1) {
        node.outstandingTimers.splice(index, 1);
      }
    },
    setInterval: function () {
      var func = arguments[0];
      var timerId;
      arguments[0] = function () {
        try {
          func.apply(node, arguments);
        } catch (err) {
          node.error(err, {});
        }
      };
      timerId = setInterval.apply(node, arguments);
      node.outstandingIntervals.push(timerId);
      return timerId;
    },
    clearInterval: function (id) {
      clearInterval(id);
      var index = node.outstandingIntervals.indexOf(id);
      if (index > -1) {
        node.outstandingIntervals.splice(index, 1);
      }
    },
    obniz, obnizParts, msg, send, done
  };
  if (util.hasOwnProperty('promisify')) {
    sandbox.setTimeout[util.promisify.custom] = function (after, value) {
      return new Promise(function (resolve, reject) {
        sandbox.setTimeout(function () {
          resolve(value);
        }, after);
      });
    };
    sandbox.promisify = util.promisify;
  }
  var context = vm.createContext(sandbox);
  let handleNodeDoneCall = true;
  try{
    if (/node\.done\s*\(\s*\)/.test(node.func)) {
      handleNodeDoneCall = false;
    }

    node.script = new vm.Script(functionText, createVMOpt(node, ""));
    let p = node.script.runInContext(context);

    p.then((result)=>{
      send(result);
      if (handleNodeDoneCall) {
        done();
      }
    }).catch(err => {
      if ((typeof err === "object") && err.hasOwnProperty("stack")) {
        //remove unwanted part
        var index = err.stack.search(/\n\s*at ContextifyScript.Script.runInContext/);
        err.stack = err.stack.slice(0, index).split('\n').slice(0,-1).join('\n');
        var stack = err.stack.split(/\r?\n/);

        //store the error in msg to be used in flows
        msg.error = err;

        var line = 0;
        var errorMessage;
        if (stack.length > 0) {
          while (line < stack.length && stack[line].indexOf("ReferenceError") !== 0) {
            line++;
          }

          if (line < stack.length) {
            errorMessage = stack[line];
            var m = /:(\d+):(\d+)$/.exec(stack[line+1]);
            if (m) {
              var lineno = Number(m[1])-1;
              var cha = m[2];
              errorMessage += " (line "+lineno+", col "+cha+")";
            }
          }
        }
        if (!errorMessage) {
          errorMessage = err.toString();
        }
        done(errorMessage);
      }
      else if (typeof err === "string") {
        done(err);
      }
      else {
        done(JSON.stringify(err));
      }
    })
  }catch(err){
    // eg SyntaxError - which v8 doesn't include line number information
    // so we can't do better than this
    updateErrorInfo(err);
    node.error(err);
  }
}

function createVMOpt(node, kind) {
  var opt = {
    filename: 'obniz node'+kind+':'+node.id+(node.name?' ['+node.name+']':''), // filename for stack traces
    displayErrors: true
    // Using the following options causes node 4/6 to not include the line number
    // in the stack output. So don't use them.
    // lineOffset: -11, // line number offset to be used for stack traces
    // columnOffset: 0, // column number offset to be used for stack traces
  };
  return opt;
}


function updateErrorInfo(err) {
  if (err.stack) {
    var stack = err.stack.toString();
    var m = /^([^:]+):([^:]+):(\d+).*/.exec(stack);
    if (m) {
      var line = parseInt(m[3]) - 1;
      err.message += " (line " + line + ")";
    }
  }
}
