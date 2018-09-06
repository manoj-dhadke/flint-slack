/**
** Creation Date: 4th September 2018
** Summary: This is Slack-Flint Bot, Message Listener flintbit.
** Description: This flintbit is developed to listen to slack messages/responses containing Flint triggers-words.
**/

log.trace("Started execution of 'flint-slack:slack_listener.js' flintbit.")
try {
    key_values = []
    command_without_trigger = []
    // parse URL encoded data to json
    log.info(input)
    message = input.get('body') // Flint body field to get slack data
    log.info(message)
    message_body = message.replace(/[\"]/g, '').split('&')

    log.trace(message_body)

    for (index in message_body) {
        key_values.push(message_body[index].split('='))
    }

    log.trace(key_values)

    // Getting slack request variables and putting them in JS variables
    token = key_values[0][1]
    team_id = key_values[1][1]
    team_domain = key_values[2][1]
    service_id = key_values[3][1]
    channel_id = key_values[4][1]
    channel_name = key_values[5][1]
    user_id = key_values[7][1]
    user_name = key_values[8][1]
    user_name = user_name.replace(/[._-]/g, ' ').split(' ')
    // Convert username to a proper format
    for (x in user_name) {
        user_name[x] = user_name[x].charAt(0).toUpperCase() + user_name[x].substring(1)
    }
    user_name = user_name.join(' ')
    log.trace("Transformed Username : " + user_name)
    text = key_values[9][1]
    trigger_word = key_values[10][1]

    // Command
    command = key_values[9][1].replace(/[+]/g, ' ').split(' ')
    for (x = 1; x <= command.length; x++) {
        command_without_trigger.push(command[x])
    }
    log.trace("COMMAND WITHOUT TRIGGER : " + command_without_trigger)

    action = command[1]         // Either createvm, startvm, stopvm or destroyvm
    provider = command[2]

    slack_chat = 'slack'
    id = token


    // Inputs: Service config->slack_listener.js->add_message.js
    // url = input.get('url')  // #demo on Slack url
    // http_connector_name = input.get('http_connector_name')
    // method = input.get('method')

    // TOD Inputs
    url = "https://hooks.slack.com/services/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"
    method = 'post'
    http_connector_name = "http"


    log.trace("provider" + provider)

    if (command_without_trigger.length != 0 && provider == "aws") {
        // Slack-Flint bot request-body for acknowledgement
        acknowledgement_body = '{"text": "Hello, ' + user_name + '. I\'ve got your request and I\'m processing it."}'
        call.bit('flint-slack:add_message.js')
            .set('body', acknowledgement_body)
            .set('chat_tool', slack_chat)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()

        switch (action) {
            case 'newvm':
                image_type = command[3]
                instance_type = command[4]
                region = command[5]
                availability_zone = command[6]

                log.trace('Calling Flintbit to perform newvm Operation')
                call.bit('flint-slack:newvm.js')
                    .set('provider', provider)
                    .set('image_type', image_type)
                    .set('instance_type', instance_type)
                    .set('region', region)
                    .set('availability_zone', availability_zone)
                    .set('id', id)
                    .set('user_name', user_name)
                    .set('chat_tool', slack_chat)
                    .set('channel_name', channel_name)
                    .set('url', url)
                    .set('method', method)
                    .set('http_connector_name', http_connector_name)
                    .sync()
                break;

            case 'startvm':
                instance_id = command[3]
                region = command[4]

                log.trace('Calling Flintbit to perform startawsvm Operation')
                call.bit('flint-slack:startawsvm.js')
                    .set('id', id)
                    .set('instance_id', instance_id)
                    .set('provider', provider)
                    .set('chat_tool', slack_chat)
                    .set('region', region)
                    .set('user_name', user_name)
                    .set('url', url)
                    .set('method', method)
                    .set('http_connector_name', http_connector_name)
                    .sync()
                break;

            case 'stopvm':
                log.trace('Calling Flintbit to perform stopawsvm Operation')
                instance_id = command[3]
                region = command[4]

                call.bit('flint-slack:stopawsvm.js')
                    .set('id', id)
                    .set('instance_id', instance_id)
                    .set('provider', provider)
                    .set('chat_tool', slack_chat)
                    .set('region', region)
                    .set('user_name', user_name)
                    .set('url', url)
                    .set('method', method)
                    .set('http_connector_name', http_connector_name)
                    .sync()
                break;

            case 'destroyvm':
                instance_id = command[3]
                region = command[4]

                call.bit('flint-slack:destroyvm.js')
                    .set('id', id)
                    .set('region', region)
                    .set('provider', provider)
                    .set('instance_id', instance_id)
                    .set('chat_tool', slack_chat)
                    .set('user_name', user_name)
                    .set('url', url)
                    .set('method', method)
                    .set('http_connector_name', http_connector_name)
                    .sync()
                break;
        }
    }
    else {
        // if (provider != "aws") {
        //     slack_reply_message = 'Hello ' + user_name + ', please set a valid provider(aws).'
        //     log.trace(slack_reply_message)
        // }

        if (command_without_trigger.length == null || command_without_trigger == '') {
            // In-case only trigger word is used, all valid commands will be listed
            slack_reply_message = user_name + ', this command is invalid.\n *List of Valid Commands:* \n*AWS VM Creation:* \nflint newvm <provider> <image-type> <instance-type> <region> <availability-zone> \n*Start a VM:* \nflint startvm <provider> <instance-id>\n*Stop a VM:* \nflint stopvm <provider> <instance-id>\n *Delete a VM:* \nflint destroyvm <provider> <instance-id>'
            // Slack-Flint bot request-body
            body = '{"text":"' + slack_reply_message + '"}'
            // Slack message
            call.bit('flint-slack:add_message.js')
                .set('body', body)
                .set('chat_tool', slack_chat)
                .set('url', url)
                .set('method', method)
                .set('http_connector_name', http_connector_name)
                .sync()
        }
    }
} catch (error) {
    log.error(error.message)
    output.set('exit-code', 1).set('message', error.message)

    slack_reply_message = 'Hello ' + user_name + '. Something went wrong, please try again ' + error.message.toString()
    // body = '{"channel": "#' + channel_name + '", "username": "FlintBot", "text": "' + slack_reply_message + '"}'
    // Slack-Flint bot request-body
    body = '{"text": "' + slack_reply_message + '"}'

    call.bit('flint-slack:add_message.js')
        .set('body', body)
        .set('chat_tool', slack_chat)
        .set('url', url)
        .set('method', method)
        .set('http_connector_name', http_connector_name)
        .sync()

}
log.trace("Finished execution of 'flint-slack:slack_listener.js' flintbit.")
