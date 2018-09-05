/**
** Creation Date: 4th September 2018
** Summary: This is Slack-Flint Bot, New Virtual Machine flintbit.
** Description: This flintbit is developed to create aws instance.
**/

log.trace("Started execution of 'flint-slack:newvm.js' flintbit.")
try {
    //Flintbit Input Parameters
    provider = input.get('provider')                   // Name of provider (valid inputs : 'aws','digitalocean' etc)
    image_type = input.get('image_type')               // Image type to create new instance
    instance_type = input.get('instance_type')         // Instance type to create new instance (e.g. 't1.small')
    region = input.get('region')                       // Region name to create instance
    availability_zone = input.get('availability_zone') // Availability zone with respect to region
    token_id = input.get('id')            // SlackToken ID
    user_name = input.get('user_name')                  // Name of chat tool user
    chat_tool_name = input.get('chat_tool')            // Chat tool name (Valid inputs : 'hipchat','slack')
    channel_name = input.get('channel_name')           // Name of slack channel

    // Slack add_message inputs
    url = input.get('url')
    method = input.get('method')
    http_connector_name = input.get('http_connector_name')

    log.trace("Calling 'flint-terraform:aws:provision.rb' Flintbit")
    aws_provision_response = call.bit('hipchat-terraform:aws:provision.rb')
        //.set('request_id', id)
        .set('provider', provider)
        .set('instance_type', instance_type)
        .set('os', image_type)
        .set('region', region)
        .set('availability_zone', availability_zone)
        .timeout(240000)
        .sync()

    // Check Exit status of 'terraform-test:terraform_provision_machine.rb' Flintbit
    if (aws_provision_response.get('exitcode') == 0) {

        state = aws_provision_response.get('state')
        key_name = state.get('key_name')                        // key name
        availability_zone = state.get('availability_zone')      // availability zone
        ami_id = state.get('id')                                // Ami ID ========================= YOU HAVE TO CHECK THE STATE RESPONSE WHICH IS SET IN 
        log.trace("AMI ID IN NEWVM : ============="+ami_id)
        public_ip = state.get('public_ip')                      // Public ip
        instance_type = state.get('instance_type')              // instance type
        private_ip = state.get('private_ip')                    // Private IP

        reply_message = 'New virtual machine has been created ' + user_name + '. *AWS VM Details:* \n*AMI ID:* ' + ami_id + '\n *Public IP:* ' + public_ip + ' \n*Private IP:* ' + private_ip + ' \nYou can use *' + key_name + '.pem* to access it.'
        // Slack-Flint bot reply
        body = '{"text": "' + reply_message + '"}'
        // Slack-Flint bot reply flintbit
        call.bit('flint-slack:add_message.js')
            .set('body', body)
            .set('chat_tool', chat_tool_name)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()

    } else {
        reply_message = 'Oops! ' + user_name + ', AWS VM creation has failed : *' + aws_provision_response.get('error').toString() + '*'
        body = '{"text": "' + reply_message + '"}'
        call.bit('flint-slack:add_message.js')
            .set('body', body)
            .set('chat_tool', chat_tool_name)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()
    }
}
catch (error) {
    log.error(error)
    output.set('exit-code', 1).set('message', error)

    reply_message = 'Hello ' + user_name + ', VM creation failed on ' + provider + ' due to ' + error + ''
    body = '{text": "' + reply_message + '"}'
    
    call.bit('flint-slack:add_message.js')
        .set('body', body)
        .set('chat_tool', chat_tool_name)
        .set('url', url)
        .set('method', method)
        .set('http_connector_name', http_connector_name)
        .sync()
}
log.trace("Finished execution of 'flint-slack:newvm.js' flintbit.")
