/**
** Creation Date: 4th September 2018
** Summary: This is Slack-Flint Bot, Message Listener flintbit.
** Description: This flintbit is developed to listen to slack messages/responses containing Flint triggers-words.
**/

log.trace("Started execution of 'flint-slack:slack_listener.js' flintbit.")
try {
    key_values = []
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
    // Getting VM details from command
    provider = command[1]
    image_type = command[1]
    instance_type = command[2]

    availability_zone = command[4]

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

    // // Getting values from slack data
    // body = message_body['text'][0].delete '"'
    // command = message_body['command'][0]
    // channel_name = message_body['channel_name'][0]
    // user_name = message_body['user_name'][0]
    // id = message_body['"token'][0]
    // message_data = body.split(' ')

    // Initial notification to slack from FlintBot
    //http_body = '{"channel": "#' + channel_name + '", "username": "FlintBot", "text": "Hello ' + user_name + ', I got your request and started processing it"}'

    acknowledgement_body = '{"text": "Hello, ' + user_name + '. I\'ve got your request and I\'m processing it."}'
    call.bit('flint-slack:add_message.js')
        .set('body', acknowledgement_body)
        .set('chat_tool', slack_chat)
        .set('url', url)
        .set('method', method)
        .set('http_connector_name', http_connector_name)
        .sync()

    log.trace("provider" + provider)

    // if message_data.length >= 2
    // provider = message_data[0]
    // image_type = message_data[1]
    // instance_type = message_data[2]
    // region = message_data[3]
    // availability_zone = message_data[4]

    if (command.length != 0 && provider == "aws") {
        switch (trigger_word) {
            case 'newvm':
                provider = command[1]
                image_type = command[2]
                instance_type = command[3]
                region = command[4]
                availability_zone = command[5]

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

            case 'flint':
                log.trace("CASE FLINT: " + trigger_word + "===" + provider)
                provider = command[1]
                instance_id = command[2]
                region = command[3]

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
                call.bit('hipchat-terraform:operation:stopawsvm.rb')
                    .set('id', id)
                    .set('instance_id', image_type)
                    .set('provider', provider)
                    .set('chat_tool', slack_chat)
                    .set('region', instance_type)
                    .set('user_name', user_name)
                    .sync()
                break;

            case 'destroyvm':
                call.bit('hipchat-terraform:operation:destroyvm.rb')
                    .set('id', id)
                    .set('region', instance_type)
                    .set('provider', provider)
                    .set('operation', command)
                    .set('channel_name', channel_name)
                    .set('instance_id', image_type)
                    .set('chat_tool', slack_chat)
                    .set('user_name', user_name)
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
            // In-case only trigger word is used
            slack_reply_message = user_name + ', the command is invalid.\n <b>List of Valid Commands:</b> \nAWS VM Creation: newvm <provider> <image-type> <instance-type> <region> <availability-zone> \nStart a VM: startvm <provider> <instance-id>\nStop a VM: stopvm <provider> <instance-id>\n Delete a VM: destroyvm <provider> <instance-id>'
            body = '{"text":"' + slack_reply_message + '"}'


            log.trace("SLACK MESSAGE BODY:" + slack_reply_message)
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
