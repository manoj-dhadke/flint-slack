/**
** Creation Date: 5th September 2018
** Summary: This is Slack-Flint Bot, Start Virtual Machine flintbit.
** Description: This flintbit is developed to start vm after .
**/

log.trace("Started execution of 'flint-slack:startawsvm.js' flintbit.")

// Flintbit Input Parameters
provider = input.get('provider')         // Name of provider (valid inputs : 'aws','digitalocean' etc)
instance_id = input.get('instance_id')   // Instance id to start
id = input.get('id')                     // Token ID
chat_toolkit = input.get('chat_tool')    // Chat tool name (Valid inputs : 'hipchat','slack')
user_name = input.get('user_name')       // Name of chat tool user
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
        aws_reply_message = user_name + ', virtual machine with ID(' + instance_id +') has been successfully started on AWS'
        attahments = '"fallback": "Virtual machine start notification","color": "#36a64e","title": "Started Virtual Machine.","text": "'+user_name + ', virtual machine with ID(' + instance_id +') has been successfully started on AWS", "footer": "Flint","ts": 123456789'

        body =  '{"attachments":"[{'+attachments+'}]"}'     
        //'{"text": "' + aws_reply_message + '"',
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
        aws_reply_message = 'Hello ' + user_name + ', VM start failed on AWS with ID: ' + instance_id + ' due to ' + response_message.toString() + ''
    }
} catch (error) {
    log.error(error.message)
    output.set('exit-code', 1).set('message', error.message)

    aws_reply_message = 'Hello ' + user_name + ', VM start failed on ' + provider.toUpperCase() + ' with ID ' + instance_id + ' due to ' + error.message + ''
    body = '{"text": "' + aws_reply_message + '"}'

    call.bit('flint-slack:add_message.js')
        .set('body', body)
        .set('chat_tool', chat_toolkit)
        .set('url', url)
        .set('method', method)
        .set('http_connector_name', http_connector_name)
        .sync()
}
log.trace("Finished execution of 'flint-slack:startawsvm.js' flintbit.")