/**
** Creation Date: 5th September 2018
** Summary: This is Slack-Flint Bot, Start Virtual Machine flintbit.
** Description: This flintbit is developed to start vm after .
**/

log.trace("Started execution of 'flint-slack:startawsvm.js' flintbit.")
// To get timestamp
dateObj = new Date()

// Flintbit Input Parameters
provider = input.get('provider')         // Name of provider (valid inputs : 'aws','digitalocean' etc)
instance_id = input.get('instance_id')   // Instance id to start
id = input.get('id')                     // Token ID
chat_toolkit = input.get('chat_tool')    // Chat tool name (Valid inputs : 'hipchat','slack')
user_name = input.get('user_name')       // Name of chat tool user
user_split = user_name.split(' ')
region = input.get('region')             // Region in which instance present
url = input.get('url')
method = input.get('method')
http_connector_name = input.get('http_connector_name')
log.trace(input)

try {
    connector_aws_name = config.global('hipchat-terraform.terraform.aws_connector.name')
    secret = config.global('hipchat-terraform.terraform.aws_connector.secret')
    key = config.global('hipchat-terraform.terraform.aws_connector.key')

    log.trace('Calling AWS-EC2 Cloud Connector')
    response = call.connector(connector_aws_name)
                   .set('action', 'start-instances')
                   .set('instance-id', instance_id)
                   .set('region', region)
                   .set('access-key', key)
                   .set('security-key', secret)
                   .sync()

    // Amazon EC2 Connector Response Meta Parameters
    response_exitcode = response.exitcode()        // Exit status code
    response_message = response.message()           // Execution status messages

    if (response_exitcode == 0) {
        log.info("Success in executing " + connector_aws_name + " connector where, exitcode : " + response_exitcode + " message :" + response_message)

        // Slack message in-case virtual machine is started successfully
        timestamp = Math.floor(dateObj.getTime()/1000)
        body = '{"attachments": [{"fallback":"Virtual machine start notification","color":"#36a64e","fields":[{"title":"Started Virtual Machine.","value":"'+user_split[0]+', virtual machine with ID(*'+instance_id+'*) has been successfully started.","short":false}],"footer":"Flint", "ts":'+timestamp+'}]}'  
        
        call.bit('flint-slack:add_message.js')
            .set('body', body)
            .set('chat_tool', chat_toolkit)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()

    } else {

        log.error("ERROR in executing" + connector_aws_name + "\nExitcode : " + response_exitcode + "\n Message : " + response_message)
        response_message.toString().replace(/[!%&"]/, '')
        log.info('Start ' + response_message.toString())

        reply_message = 'Oops! ' + user_split[0] + ', virtual machine with ID(*' + instance_id + '*) has failed to start. \n*Error:* \n' + response_message.toString() + ''

        timestamp = Math.floor(dateObj.getTime()/1000)
        // Failed to create new VM body
        body = '{"text":"Hi, '+user_split[0]+'!", "attachments": [{"fallback":"Virtual Machine failed to start","color":"#f40303","fields":[{"title":"Virtual Machine start operation has failed","value":"'+reply_message+'","short":false}],"footer":"Flint", "ts":'+timestamp+'}]}'

        // Send Slack fail message
        call.bit('flint-slack:add_message.js')
        .set('body', body)
        .set('chat_tool', chat_toolkit)
        .set('url', url)
        .set('method', method)
        .set('http_connector_name', http_connector_name)
        .sync()
    }
} catch (error) {
    log.error(error.message)
    output.set('exit-code', 1).set('message', error.message)
}
log.trace("Finished execution of 'flint-slack:startawsvm.js' flintbit.")