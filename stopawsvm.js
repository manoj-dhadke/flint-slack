/**
** Creation Date: 6th September 2018
** Summary: This is Slack-Flint Bot, Stop VM flintbit.
** Description: This flintbit is developed to listen to slack messages/responses containing Flint triggers-word 'stopvm'.
**/
log.trace("Started execution of 'flint-slack:stopawsvm.js' flintbit.")

try {
    //  Flintbit Input Parameters
    id = input.get('id')
    instance_id = input.get('instance_id')   // Instance id to stop
    provider = input.get('provider')         // Name of provider (valid inputs : 'aws','digitalocean' etc)
    chat_toolkit = input.get('chat_tool')    // Chat tool name (Valid inputs : 'hipchat','slack')
    region = input.get('region')             // Region in which instance present
    user_name = input.get('user_name')       // Name of chat tool user
    user_split = user_name.split(' ')

    // Inputs for sending Slack message flintbit
    url = input.get('url')
    method = input.get('method')
    http_connector_name = input.get('http_connector_name') 

    // Global configuration of hipchat
    connector_aws_name = config.global('hipchat-terraform.terraform.aws_connector.name')
    secret = config.global('hipchat-terraform.terraform.aws_connector.secret')
    key = config.global('hipchat-terraform.terraform.aws_connector.key')

    log.trace('Calling aws-ec2 Cloud Connector...')

    response = call.connector(connector_aws_name)
        .set('action', 'stop-instances')
        .set('instance-id', instance_id)
        .set('region', region)
        .set('access-key', key)
        .set('security-key', secret)
        .sync()

    // Amazon EC2 Connector Response Meta Parameters
    response_exitcode = response.exitcode()              	          // Exit status code
    response_message = response.message()                           // Execution status messages

    // Success in stopping VM
    if (response_exitcode == 0) {
        output.set('exit-code', response_exitcode)

        log.info("Exit-code: "+response_exitcode)
        log.info("Response message: "+response_message)
        
        // Define slack reply
        //attachments = '[{"fallback":"Virtual machine start notification","color":"#36a64e","title":"Started Virtual Machine.","text":"'+user_split[0]+', AWS virtual machine with ID(*'+instance_id+'*) has been successfully started.","footer":"Flint","ts":123456789}]'
       //attachments = '{"fallback":"Virtual machine start notification","color":"#36a64e","fields":[{"title":"Started Virtual Machine.","value":"'+user_split[0]+', virtual machine with ID(*'+instance_id+'*) has been successfully started.","short":false}],"footer":"Flint"}'
       //log.trace('1'+attachments)

        //log.trace('7'+ JSON.stringify(obj))


        //aws_reply_message = 'Hi, ' + user_split[0] + ', requested VM instance with ID(*'+instance_id+'*) has been successfully stopped on AWS.'
        //body = '{"text": "'+attachments+'"}'
        body = '{"text": [{"fallback":"Virtual machine start notification","color":"#36a64e","fields":[{"title":"Started Virtual Machine.","value":"Akash, virtual machine with ID(*i-0b46b5ccdc61f9bc8*) has been successfully started.","short":false}],"footer":"Flint"}]}'
        // Send slack reply

        log.trace('BODY'+body)

        call.bit('flint-slack:add_message.js')
            .set('body', body)
            .set('chat_tool', chat_toolkit)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()

    } else {
        // Failure in stopping VM
        log.error("ERROR: \nExitcode : "+response_exitcode+" \nMessage : "+response_message)

        response_message.replace(/[!%&"]/, '')
        aws_reply_message = 'Oops! ' + user_name + ', VM failed to stop on AWS with ID(*' + instance_id + '*) due to ' + response_message.toString() + ''
    }
    // Exception-handling
} catch (error) {
    log.error(error)
    output.set('exit-code', 1).set('message', error)

    reply_message = 'Oops! ' + user_name + ', VM failed to start on ' + provider.toUpperCase() + ' with ID (*'
        + instance_id + '*) due to ' + error + ''
    body = '{"text": "' + aws_reply_message + '"}'

    call.bit('flint-slack:add_message.js')
        .set('body', body)
        .set('chat_tool', chat_toolkit)
        .set('url', url)
        .set('method', method)
        .set('http_connector_name', http_connector_name)
        .sync()

    log.trace(error)
}
log.trace("Finished execution of 'flint-slack:stopawsvm.js' flintbit.")