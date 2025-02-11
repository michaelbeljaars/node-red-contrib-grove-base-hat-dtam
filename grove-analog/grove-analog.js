var path = require('path');

module.exports = function(RED) {
    function GroveAnalogNode(config) {
        RED.nodes.createNode(this,config);

        this.port_number = config.port_number;
        this.refresh_time = config.refresh_time;

        this.port_name = "A" + this.port_number;
        this.status({fill:"blue",shape:"dot",text:this.port_name});
        
        var node = this;
        var msg;

        const gpio_pin = this.port_number;
        const refresh_time = this.refresh_time;
        
        const spawn = require('child_process').spawn;
        const grove_python = spawn('python', [ '-u' , path.join( __dirname , 'grove-analog.py' ) , gpio_pin, refresh_time ]);
        this.status({fill:"green",shape:"dot",text:this.port_name + " listened"});
        
        this.on("input", function(msg) {
            this.send(msg);
        });

        grove_python.stdout.on('data', (data) => {
            node.log(`stdout: ${data}`);
            
            let str_data = String(data);
            let str_sensor_data = str_data;
            //if(str_data.length > 2){
            //    str_sensor_data = str_data.substr(0,1);
            //}

            // node.log(str_data.length);

            //this.status({fill:"blue",shape:"dot",text:this.port_name + " value chanded"});
            let _self = this;

            msg = {};
            msg.payload = Number(str_sensor_data);
            node.send(msg);
            
            setTimeout(
                function(){
                    _self.status({fill:"green",shape:"dot",text:_self.port_name + " listened"});
                },200
            )
            
        });
        
        grove_python.stderr.on('data', (data) => {
            // console.log(`stderr: ${data}`);
            this.status({fill:"red",shape:"ring",text:this.port_name + " error"});
            let jsonData = data.toString();
            msg = {};
            msg.payload = jsonData;
            node.send(msg);
        });
        
        grove_python.on('close', (code) => {
            this.status({fill:"red",shape:"ring",text:this.port_name + " disconnected"});

            // console.log(`child process exited with code ${code}`);
            let jsonData = "child process exited with code " + code;
            msg = {};
            msg.payload = jsonData;
            node.send(msg);
        });
    }
    RED.nodes.registerType("grove-analog",GroveAnalogNode);
}
