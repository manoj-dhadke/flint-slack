/**
** Creation Date: 4th September 2018
** Summary: This is Slack-Flint Bot, Message Listener flintbit.
** Description: This flintbit is developed to listen to slack messages/responses containing Flint triggers-words.
**/

log.trace("Started execution of 'flint-slack:slack_listener.js' flintbit.")
try {
    //For timestamp
    dateObj = new Date()

    parameter_check = ''            // To check for missing parameters
    key_values = []                 // To get all commands in an array called 'command'
    command_without_trigger = []
    greeting = ''
    // To frame missing parameters statement
    parameter_mapping = {
        2: '<provider>',
        3: '<image-type>',
        4: '<instance-type>',
        5: '<region>',
        6: '<availability-zone>'
    }

    // Missing parameters for start, stop and destroy
    parameter_mapping_2 = {
        2: '<provider>',
        3: '<instance-id>',
        4: '<region>',
    }

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
    user_split = user_name.split(' ')   // Split first and last name, we can use first name

    text = key_values[9][1]
    trigger_word = key_values[10][1]

    // Command
    command = key_values[9][1].replace(/[+]/g, ' ').split(' ')
    for (x = 1; x <= command.length; x++) {
        command_without_trigger.push(command[x])
    }
    log.trace("COMMAND WITHOUT TRIGGER : " + command_without_trigger)

    // Switch case on this action
    action = command[1]         // Actions: createvm, startvm, stopvm or destroyvm
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

    // Get current time and set greeting message accordingly
    currentDate = new Date()
    currentHour = currentDate.getHours()
    currentMinutes = currentDate.getMinutes()
    AMPM = currentHour >= 12 ? 'PM' : 'AM'
    currentHour = currentHour % 12
    currentHour = currentHour ? currentHour : 12
    currentMinutes = currentMinutes < 10 ? '0'+currentMinutes : currentMinutes

    currentTime = currentHour+' '+AMPM
    log.trace("HOUR IS ==============> " + currentHour)

    if (currentHour >= 5 || currentHour <= 11 && AMPM == 'AM') {
        greeting = "Good morning, "
    } else if (currentHour >= 12 || currentHour <= 5 && AMPM == 'PM') {
        greeting = "Good afternoon, "
    } else if (currentHour > 5 || currentHour <= 8 && AMPM == 'PM') {
        greeting = "Good evening, "
    } else {
        greeting = "Hola, "
    }

    if (command_without_trigger.length != 0 && provider == "aws") {
        // Slack-Flint bot request-body for acknowledgement
        acknowledgement_body = '{"text": "' + greeting + '' + user_split[0] + '. I\'ve got your request and I\'m processing it."}'
        call.bit('flint-slack:add_message.js')
            .set('body', acknowledgement_body)
            .set('chat_tool', slack_chat)
            .set('url', url)
            .set('method', method)
            .set('http_connector_name', http_connector_name)
            .sync()

        switch (action) {
            // Create Virtual Machine
            case 'newvm':
                image_type = command[3]
                instance_type = command[4]
                region = command[5]
                availability_zone = command[6]
                

                // Slack reply for missing parameters 
                if (command.length < 7) {
                    for (x = 2; x < 7; x++) {

                        if (command[x] == null || command[x].length == 0 || command[x] == '') {
                            parameter_check += parameter_mapping[x] + ' '
                        }
                    }
                    log.trace("MISSING PARAMETER : " + parameter_check)

                    // Missing parameters statement             
                    miss_param_stat = 'Parameter(s) *' + parameter_check + '* are missing.'
                    // Timestamp for slack message attachment
                    timestamp = Math.floor(dateObj.getTime() / 1000)
                    // Missing parameters body
                    body = '{"text":"Hi, ' + user_split[0] + '.", "attachments": [{"fallback":"Invalid Command","color":"#f40303","fields":[{"title":"Invalid Command","value":"' + miss_param_stat + '","short":false}],"footer":"Flint", "ts":' + timestamp + '}]}'

                    // Send Slack message to notify missing parameters
                    call.bit('flint-slack:add_message.js')
                        .set('body', body)
                        .set('chat_tool', slack_chat)
                        .set('url', url)
                        .set('method', method)
                        .set('http_connector_name', http_connector_name)
                        .sync()

                } else {
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
                }
                break;
            // Start Virtual Machine
            case 'startvm':
                instance_id = command[3]
                region = command[4]
                // Slack reply for missing parameters
                if (command.length < 5) {
                    for (x = 2; x < 5; x++) {

                        if (command[x] == null || command[x].length == 0 || command[x] == '') {
                            parameter_check += parameter_mapping_2[x] + ' '
                        }
                    }
                    log.trace("MISSING PARAMETER : " + parameter_check)

                    // Missing parameters statement             
                    miss_param_stat = 'Parameter(s) *' + parameter_check + '* are missing.'
                    // Timestamp for slack message attachment
                    timestamp = Math.floor(dateObj.getTime() / 1000)
                    // Missing parameters body
                    body = '{"text":"Hi, ' + user_split[0] + '.", "attachments": [{"fallback":"Invalid Command","color":"#f40303","fields":[{"title":"Invalid Command","value":"' + miss_param_stat + '","short":false}],"footer":"Flint", "ts":' + timestamp + '}]}'

                    // Send Slack message to notify missing parameters
                    call.bit('flint-slack:add_message.js')
                        .set('body', body)
                        .set('chat_tool', slack_chat)
                        .set('url', url)
                        .set('method', method)
                        .set('http_connector_name', http_connector_name)
                        .sync()
                } else {

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
                }
                break;
            // Stop Virtual Machine
            case 'stopvm':
                log.trace('Calling Flintbit to perform stopawsvm Operation')
                instance_id = command[3]
                region = command[4]

                // Slack reply for missing parameters
                if (command.length < 5) {
                    for (x = 2; x < 5; x++) {

                        if (command[x] == null || command[x].length == 0 || command[x] == '') {
                            parameter_check += parameter_mapping_2[x] + ' '
                        }
                    }
                    log.trace("MISSING PARAMETER : " + parameter_check)

                    // Missing parameters statement             
                    miss_param_stat = 'Parameter(s) *' + parameter_check + '* are missing.'
                    // Timestamp for slack message attachment
                    timestamp = Math.floor(dateObj.getTime() / 1000)
                    // Missing parameters body
                    body = '{"text":"Hi, ' + user_split[0] + '.", "attachments": [{"fallback":"Invalid Command","color":"#f40303","fields":[{"title":"Invalid Command","value":"' + miss_param_stat + '","short":false}],"footer":"Flint", "ts":' + timestamp + '}]}'

                    // Send Slack message to notify missing parameters
                    call.bit('flint-slack:add_message.js')
                        .set('body', body)
                        .set('chat_tool', slack_chat)
                        .set('url', url)
                        .set('method', method)
                        .set('http_connector_name', http_connector_name)
                        .sync()
                } else {
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
                }
                break;

            case 'destroyvm':
                instance_id = command[3]
                region = command[4]

                // Slack reply for missing parameters
                if (command.length < 5) {
                    for (x = 2; x < 5; x++) {

                        if (command[x] == null || command[x].length == 0 || command[x] == '') {
                            parameter_check += parameter_mapping_2[x] + ' '
                        }
                    }

                    // Missing parameters statement             
                    miss_param_stat = 'Parameter(s) *' + parameter_check + '* are missing.'
                    // Timestamp for slack message attachment
                    timestamp = Math.floor(dateObj.getTime() / 1000)
                    // Missing parameters body
                    body = '{"text":"Hi, ' + user_split[0] + '.", "attachments": [{"fallback":"Invalid Command","color":"#f40303","fields":[{"title":"Invalid Command","value":"' + miss_param_stat + '","short":false}],"footer":"Flint", "ts":' + timestamp + '}]}'

                    // Send Slack message to notify missing parameters
                    call.bit('flint-slack:add_message.js')
                        .set('body', body)
                        .set('chat_tool', slack_chat)
                        .set('url', url)
                        .set('method', method)
                        .set('http_connector_name', http_connector_name)
                        .sync()
                } else {
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
                break;
        }
    } else {
        if (command_without_trigger.length == 0 || command_without_trigger == '') {

            // In-case only trigger word is used, all valid commands will be listed
            slack_reply_message = 'This command is invalid. Here\'s a list of valid commands. \n*AWS VM Creation:* \nflint newvm <provider> <image-type> <instance-type> <region> <availability-zone> \n*Start a VM:* \nflint startvm <provider> <instance-id>\n*Stop a VM:* \nflint stopvm <provider> <instance-id>\n *Delete a VM:* \nflint destroyvm <provider> <instance-id>'
            // Slack-Flint bot request-body
            timestamp = Math.floor(dateObj.getTime() / 1000)
            body = '{"text":"Hi, ' + user_split[0] + '.", "attachments": [{"fallback":"Invalid Command","color":"#f40303","fields":[{"title":"Invalid Command","value":"' + slack_reply_message + '","short":false}],"footer":"Flint", "ts":' + timestamp + '}]}'

            // Send Slack message
            call.bit('flint-slack:add_message.js')
                .set('body', body)
                .set('chat_tool', slack_chat)
                .set('url', url)
                .set('method', method)
                .set('http_connector_name', http_connector_name)
                .sync()
        }
        else if(provider != "aws"){
            // In-case only trigger word is used, all valid commands will be listed
            slack_reply_message = 'This command is invalid. Provider should be \'aws\''
            // Slack-Flint bot request-body
            timestamp = Math.floor(dateObj.getTime() / 1000)
            body = '{"text":"Hi, ' + user_split[0] + '.", "attachments": [{"fallback":"Invalid Command","color":"#f40303","fields":[{"title":"Invalid Command","value":"' + slack_reply_message + '","short":false}],"footer":"Flint", "ts":' + timestamp + '}]}'

            // Send Slack message
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

    // slack_reply_message = 'Oops! ' + user_split[0] + '. Something went wrong, please try again ' + error.message.toString()

    // // Slack-Flint bot request-body
    // timestamp = Math.floor(dateObj.getTime()/1000)
    // body = '{"text":"Hi, '+user_split[0]+'.", "attachments": [{"fallback":"Invalid Command","color":"#f40303","fields":[{"title":"Invalid Command","value":"'+slack_reply_message+'","short":false}],"footer":"Flint", "ts":'+timestamp+'}]}'

    // call.bit('flint-slack:add_message.js')
    //     .set('body', body)
    //     .set('chat_tool', slack_chat)
    //     .set('url', url)
    //     .set('method', method)
    //     .set('http_connector_name', http_connector_name)
    //     .sync()

}
log.trace("Finished execution of 'flint-slack:slack_listener.js' flintbit.")
