/**
** Creation Date: 4th September 2018
** Summary: This is Slack-Flint bot add message flintbit.
** Description: This flintbit is developed to send message to specified Slack .
**/
log.info('Started execution of flint-slack:add_message.js flintbit..')

try {
    // Getting input parameters
    body = input.get('body')                // HTTP body to post
    chat_toolkit = input.get('chat_tool')   // Name of chat tool (Valid inputs : 'hipchat','slack')

    // Getting http connector inputs from slack_listener
    http_connector_name = input.get('http_connector_name')
    method = input.get('method')
    headers = config.global('slack-terraform.terraform.http_connector.header')
    url = input.get('url')

    log.info("Flintbit Input Parameters: \nConnector Name:" + http_connector_name + "\n Method:" + method + "\nBody:" + body+ "\nHeaders: " + headers )
    

    log.info('Calling HTTP connector to notify status')
    connector_response = call.connector(http_connector_name)
        .set('method', method)
        .set('url', url)                        // url(slack channel #demo)::service config->slack_listener.js->add_message.js
        .set('body', body)
        .set('headers', headers)
        .sync()

        log.trace("After connector call")
    response_exitcode = connector_response.get("exitcode")
    response_message = connector_response.message()

    log.trace("add_message exit-code:"+response_exitcode)
    log.trace("add_message response message: "+response_message)

    

    if (response_exitcode == 0)
        log.info("Success in executing " + http_connector_name + ", \nExitcode: " + response_exitcode + "\nMessage: " + response_message)
    else
        log.error("Error in executing " + http_connector_name + ", \nExitcode: " + response_exitcode + "\nMessage: " + response_message)
}
catch (error) {
    log.error(error)
    output.set('exit-code', 1).set('message', error)
    log.error("Catch Error in " + http_connector_name + ", \nMessage: " + error)
}
log.info("Finished execution of 'flint-slack:add_message.js' flintbit.")
