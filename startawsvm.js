/**
** Creation Date: 5th September 2018
** Summary: This is Slack-Flint Bot, Start Virtual Machine flintbit.
** Description: This flintbit is developed to start vm after .
**/

log.trace("Started execution of 'hipchat-terraform:operation:startawsvm.rb' flintbit.")

// Flintbit Input Parameters
provider = input.get('provider')         // Name of provider (valid inputs : 'aws','digitalocean' etc)
instance_id = input.get('instance_id')   // Instance id to start
id = input.get('id')                     // Token ID
chat_toolkit = input.get('chat_tool')    // Chat tool name (Valid inputs : 'hipchat','slack')
user_name = input.get('user_name')       // Name of chat tool user
region = input.get('region')             // Region in which instance present

try {
    connector_aws_name = config.global('hipchat-terraform.terraform.aws_connector.name')
    secret = config.global('hipchat-terraform.terraform.aws_connector.secret')
    key = config.global('hipchat-terraform.terraform.aws_connector.key')

    log.trace('Calling aws-ec2 Cloud Connector...')
    response = call.connector(connector_aws_name)
        .set('action', 'start-instances')
        .set('instance-id', instance_id)
        .set('region', region)
        .set('access-key', key)
        .set('security-key', secret)
        .sync()

    // Amazon EC2 Connector Response Meta Parameters
    response_exitcode = response.exitcode         // Exit status code
    response_message = response.message           // Execution status messages

    if (response_exitcode == 0) {
        log.info("Success in executing " + connector_aws_name + " connector where, exitcode : " + response_exitcode + " message :" + response_message)
        aws_reply_message = 'Hello' + user_name + ', VM started on AWS with ID: ' + instance_id

        call.bit('hipchat-terraform:operation:add_message.rb')
            .set('body', body)
            .set('chat_tool', chat_toolkit)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()

    } else {
        log.error("ERROR in executing" + connector_aws_name + "\nExitcode : " + response_exitcode + "\n Message : " + response_message)
        response_message.replace(/[!%&"]/, '')
        log.info('Start ' + response_message.toString())
        aws_reply_message = 'Hello ' + user_name + ', VM start Failed on AWS with ID: ' + instance_id + ' due to ' + response_message.to_s + ''
    }
} catch (error) {
    log.error(error.message)
    output.set('exit-code', 1).set('message', error.message)
    aws_reply_message = 'Hello ' + user_name + ', VM start Failed on ' + provider + ' with ID ' + instance_id + ' due to ' + error.message + ''

    body = '{"channel": "#' + channel_name + '", "text": "' + aws_reply_message + '"}'

    call.bit('hipchat-terraform:operation:add_message.rb')
        .set('body', body)
        .set('chat_tool', chat_toolkit)
        .sync()
}
log.trace("Finished execution of 'hipchat-terraform:operation:startawsvm.js' flintbit.")