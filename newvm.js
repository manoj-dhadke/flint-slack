/*************************************************************************
 * 
 * INFIVERVE TECHNOLOGIES PTE LIMITED CONFIDENTIAL
 * __________________
 * 
 * (C) INFIVERVE TECHNOLOGIES PTE LIMITED, SINGAPORE
 * All Rights Reserved.
 * Product / Project: Flint IT Automation Platform
 * NOTICE:  All information contained herein is, and remains
 * the property of INFIVERVE TECHNOLOGIES PTE LIMITED.
 * The intellectual and technical concepts contained
 * herein are proprietary to INFIVERVE TECHNOLOGIES PTE LIMITED.
 * Dissemination of this information or any form of reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from INFIVERVE TECHNOLOGIES PTE LIMITED, SINGAPORE.
 */


/**
** Creation Date: 4th September 2018
** Summary: This is Slack-Flint Bot, New Virtual Machine flintbit.
** Description: This flintbit is developed to create aws instance.
**/

log.trace("Started execution of 'flint-slack:newvm.js' flintbit.")
try {
    // To get timestamp
    dateObj = new Date()

    //Flintbit Input Parameters
    provider = input.get('provider')                   // Name of provider (valid inputs : 'aws','digitalocean' etc)
    image_type = input.get('image_type')               // Image type to create new instance
    instance_type = input.get('instance_type')         // Instance type to create new instance (e.g. 't1.small')
    region = input.get('region')                       // Region name to create instance
    availability_zone = input.get('availability_zone') // Availability zone with respect to region
    token_id = input.get('id')            // SlackToken ID
    user_name = input.get('user_name')                  // Name of chat tool user
    user_split = user_name.split(' ')

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

        // Getting Instance Details from response of provision.rb
        state = aws_provision_response.get('state')
        key_name = state.get('key_name')                        // key name
        availability_zone = state.get('availability_zone')      // availability zone
        ami_id = state.get('id')                                // Ami ID
        public_ip = state.get('public_ip')                      // Public ip
        instance_type = state.get('instance_type')              // instance type
        private_ip = state.get('private_ip')                    // Private IP

        // Slack reply message with all the instance details : Define slack reply
        reply_message = 'new virtual machine has been created and here are the details.* \n*AMI ID:* ' + ami_id + '\n *Public IP:* ' + public_ip + ' \n*Private IP:* ' + private_ip
        
        timestamp = Math.floor(dateObj.getTime()/1000)
        body = '{"attachments": [{"fallback":"Virtual machine start notification","color":"#36a64e","fields":[{"title":"Created New Virtual Machine.","value":"Hi, '+user_split[0]+', '+reply_message+'","short":false}],"footer":"Flint", "ts":'+timestamp+'}]}'

        // Slack-Flint bot reply flintbit
        call.bit('flint-slack:add_message.js')
            .set('body', body)
            .set('chat_tool', chat_tool_name)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()

    } else {
        reply_message = 'Oops! ' + user_split[0] + ', virtual machine creation has failed. \n*Error:* \n' + aws_provision_response.get('error').toString()
        // Slack fail message body
        timestamp = Math.floor(dateObj.getTime()/1000)
        // Failed to create new VM body
        body = '{"text":"Hi, '+user_split[0]+'!", "attachments": [{"fallback":"VM creation failed","color":"#f40303","fields":[{"title":"Virtual Machine creation has failed","value":"'+reply_message+'","short":false}],"footer":"Flint", "ts":'+timestamp+'}]}'

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
}
log.trace("Finished execution of 'flint-slack:newvm.js' flintbit.")
