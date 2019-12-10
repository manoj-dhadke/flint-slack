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
** Creation Date: 26th November 2019
** Summary: This is Slack-Flint bot add message flintbit.
** Description: This flintbit is developed to send message to specified Slack .
**/

log.info('Started execution of flint-slack:slack_add_message.js flintbit..')

log.debug("Input :: "+input)

// Getting input parameters

body = input.get('slack_message')       // HTTP body to post
chat_toolkit = "slack"                 // Name of chat tool (Valid inputs : 'hipchat','slack')

// Getting http connector inputs from slack_listener

http_connector_name = "http"
method = "post"
headers = "Content-Type:application/json"
url = input.get('connection_name').get('encryptedCredentials').get('url')

log.debug("URL :: "+url)

if (url == null || url == "") {
    throw "Please provide valid Slack channel URL"
  }

if (body == null || body == "") {
    throw "Please provide vaild message body to post message on Slack channel"
  }

log.info("Flintbit Input Parameters: \nConnector Name:" + http_connector_name + "\n Method:" + method + "\nBody:" + body + "\nHeaders: " + headers)
log.info('Calling HTTP connector to notify status')

connector_response = call.connector(http_connector_name)
                         .set('method', method)
                         .set('url', url)                  // url(slack channel #demo)::service config->slack_listener.js->add_message.js
                         .set('body', body)
                         .set('headers', headers)
                         .sync()

log.trace("After connector call")

response_exitcode = connector_response.exitcode()
response_message = connector_response.message()

log.trace("add_message exit-code:" + response_exitcode)
log.trace("add_message response message: " + response_message)



if (response_exitcode == 0) {
    log.info("Success in executing " + http_connector_name + ", \nExitcode: " + response_exitcode + "\nMessage: " + response_message)
    user_message = 'Message posted to slack channel successfully on slack URL: ' +url
    output.set("user_message", user_message)
    output.set('exit-code', 0)
}
else {
    log.error("Error in executing " + http_connector_name + ", \nExitcode: " + response_exitcode + "\nMessage: " + response_message)
    user_message = 'Unable to post message on ' + chat_toolkit + ' URL'
    output.set("user_message", user_message)
    output.exit(-1, message)
}

log.info("Finished execution of 'flint-slack:slack_add_message.js' flintbit.")
