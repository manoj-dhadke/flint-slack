/**
** Creation Date: 6th September 2018
** Summary: This is Slack-Flint Bot, Destriy VM flintbit.
** Description: This flintbit is developed to listen to slack messages/responses containing Flint triggers-word 'destroyvm'.
**/

log.trace("Started execution of 'flint-slack:destroyvm.js' flintbit.")
try {
    // Flintbit Input Parameters
    id = input.get('id')
    region = input.get('region')                //# Region in which instance present
    provider = input.get('provider')            // Name of provider(valid inputs : 'aws', 'digitalocean' etc)
    instance_id = input.get('instance_id')      //# Instance id to terminate
    chat_toolkit = input.get('chat_tool')          //# Chat tool name(Valid inputs : 'hipchat', 'slack')
    user_name = input.get('user_name')    //# Name of chat tool user
    user_split = user_name.split(' ')

     // Inputs for sending Slack message flintbit
     url = input.get('url')
     method = input.get('method')
     http_connector_name = input.get('http_connector_name')
    
     // Getting inputs from global-config
    connector_aws_name = config.global('hipchat-terraform.terraform.aws_connector.name')
    log.trace("Calling 'fb-cloud:aws-ec2:operation:terminate_instance.rb' Flintbit...")

    // Calling terminate flintbit
    response = call.bit('fb-cloud:aws-ec2:operation:terminate_instance.rb')
        .set('connector_name', connector_aws_name)
        .set('instance-id', instance_id)
        .set('region', region)
        .timeout(240000)
        .sync()

    // Terminate VM success
    if(response.get('exit-code') == 0){
        output.set('exit-code', 0)

        reply_message = 'Hi ' + user_split[0] + ', I\'ve successfully deleted the requested AWS virtual machine with ID (*' + instance_id + '*)'
        body = '{"text": "'+reply_message+'"}'

        call.bit('flint-slack:add_message.js')
            .set('body', body)
            .set('chat_tool', chat_toolkit)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()
    }
    else{
        // Failure in terminating VM
        reply_message = 'Oops, ' + user_split[0] + '. I\'ve failed to delete the requested AWS virtual machine with ID (*'+instance_id+'*) due to ' + response.get('message') + ''
        body = body = '{"text": "' + reply_message + '"}'

        call.bit('flint-slack:add_message.js')
            .set('body', body)
            .set('chat_tool', chat_toolkit)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()

    }
} catch (error) {
    log.error(error)
    output.set('exit-code', 1).set('error', error)

    reply_message = 'Hi, ' + user_split[0] + '. VM destroy Failed on ' + provider + ' with ID ' + instance_id + ' due to ' + error + ''
    body = '{"text": "' + reply_message + '"}'

    call.bit('flint-slack:add_message.js')
            .set('body', body)
            .set('chat_tool', chat_toolkit)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()
}

log.trace("Finished execution of 'flint-slack:destroyvm.js' flintbit.")