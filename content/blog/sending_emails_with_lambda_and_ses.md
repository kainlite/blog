---
author: "Gabriel Garrido"
date: 2019-02-03
linktitle: Sending emails with AWS Lambda and SES from a HTML form
title: Sending emails with AWS Lambda and SES from a HTML form
highlight: true
tags:
- development
- serverless
- linux
categories:
- serverless
lua:
  image:
    url: "/img/aws-lambda-ses.png"
---

##### **Serverless series**
Part I: [Serving static websites with s3 and cloudfront]({{< ref "/blog/serving_static_sites_with_s3_and_cloudfront" >}}), so refer to that one before starting this one if you want to know how did we get here.

Part II: [Sending emails with AWS Lambda and SES from a HTML form]({{< ref "/blog/sending_emails_with_lambda_and_ses" >}}), **You are here**.

##### **Introduction**
This article is part of the serverless series, in this article we will see how to create a serverless function in AWS Lambda to send an email coming from the HTML form in the site the source code can be [found here](https://github.com/kainlite/aws-serverless-go-ses-example), that is the go version but if you prefer node you can use [this one](https://github.com/kainlite/aws-serverless-nodejs-ses-example).

##### **Serverless framework**
**As usual I will be using the serverless framework to manage our functions, create the project**
{{< highlight bash >}}
mkdir techsquad-functions && cd techsquad-functions && serverless create -t aws-go
# OUTPUT:
# Serverless: Generating boilerplate...
#  _______                             __
# |   _   .-----.----.--.--.-----.----|  .-----.-----.-----.
# |   |___|  -__|   _|  |  |  -__|   _|  |  -__|__ --|__ --|
# |____   |_____|__|  \___/|_____|__| |__|_____|_____|_____|
# |   |   |             The Serverless Application Framework
# |       |                           serverless.com, v1.36.1
#  -------'
#
# Serverless: Successfully generated boilerplate for template: "aws-go"
# Serverless: NOTE: Please update the "service" property in serverless.yml with your service name
{{< /highlight >}}

After creating the project we can update the serverless manifest as follow:
{{< highlight bash >}}
service: sendMail

frameworkVersion: ">=1.28.0 <2.0.0"

provider:
  name: aws
  runtime: go1.x
  region: us-east-1
  memorySize: 128
  versionFunctions: false
  stage: 'prod'

  iamRoleStatements:
    - Effect: "Allow"
      Action:
        - "ses:*"
        - "lambda:*"
      Resource:
        - "*"

package:
 exclude:
   - ./**
 include:
   - ./send_mail/send_mail

functions:
  send_mail:
    handler: send_mail/send_mail
    events:
      - http:
          path: sendMail
          method: post
{{< /highlight >}}
The interesting parts here are the IAM permissions and the function send_mail, the rest is pretty much standard, we define a function and the event HTTP POST for the API Gateway, where our executable can be found and we also request permissions to send emails via SES.

**Deploy the function**
{{< highlight bash >}}
make deploy
# OUTPUT:
# rm -rf ./send_mail/send_mail
# env GOOS=linux go build -ldflags="-s -w" -o send_mail/send_mail send_mail/main.go
# sls deploy --verbose
# Serverless: WARNING: Missing "tenant" and "app" properties in serverless.yml. Without these properties, you can not publish the service to the Serverless Platform.
# Serverless: Packaging service...
# Serverless: Excluding development dependencies...
# Serverless: Uploading CloudFormation file to S3...
# Serverless: Uploading artifacts...
# Serverless: Uploading service .zip file to S3 (7.31 MB)...
# Serverless: Validating template...
# Serverless: Updating Stack...
# Serverless: Checking Stack update progress...
# CloudFormation - UPDATE_IN_PROGRESS - AWS::CloudFormation::Stack - sendMail-prod
# CloudFormation - UPDATE_IN_PROGRESS - AWS::Lambda::Function - SendUnderscoremailLambdaFunction
# CloudFormation - UPDATE_COMPLETE - AWS::Lambda::Function - SendUnderscoremailLambdaFunction
# CloudFormation - CREATE_IN_PROGRESS - AWS::ApiGateway::Deployment - ApiGatewayDeployment1549246566486
# CloudFormation - CREATE_IN_PROGRESS - AWS::ApiGateway::Deployment - ApiGatewayDeployment1549246566486
# CloudFormation - CREATE_COMPLETE - AWS::ApiGateway::Deployment - ApiGatewayDeployment1549246566486
# CloudFormation - UPDATE_COMPLETE_CLEANUP_IN_PROGRESS - AWS::CloudFormation::Stack - sendMail-prod
# CloudFormation - DELETE_IN_PROGRESS - AWS::ApiGateway::Deployment - ApiGatewayDeployment1549246013644
# CloudFormation - DELETE_COMPLETE - AWS::ApiGateway::Deployment - ApiGatewayDeployment1549246013644
# CloudFormation - UPDATE_COMPLETE - AWS::CloudFormation::Stack - sendMail-prod
# Serverless: Stack update finished...
# Service Information
# service: sendMail
# stage: prod
# region: us-east-1
# stack: sendMail-prod
# api keys:
#   None
# endpoints:
#   POST - https://m8ebtlirjg.execute-api.us-east-1.amazonaws.com/prod/sendMail
# functions:
#   send_mail: sendMail-prod-send_mail
# layers:
#   None
#
# Stack Outputs
# ServiceEndpoint: https://m8ebtlirjg.execute-api.us-east-1.amazonaws.com/prod
# ServerlessDeploymentBucketName: sendmail-prod-serverlessdeploymentbucket-1vbmb6gwt8559
{{< /highlight >}}
Everything looks right, so what's next? the source code.

##### **Lambda**
This is basically the full source code for this function, as you will see it's really simple:
{{< highlight go >}}
package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
)

type Response events.APIGatewayProxyResponse

type RequestData struct {
	Email   string
	Message string
}

// This could be env vars
const (
	Sender    = "web@serverless.techsquad.rocks"
	Recipient = "kainlite@gmail.com"
	CharSet   = "UTF-8"
)

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (Response, error) {
	fmt.Printf("Request: %+v\n", request)

	fmt.Printf("Processing request data for request %s.\n", request.RequestContext.RequestID)
	fmt.Printf("Body size = %d.\n", len(request.Body))

	var requestData RequestData
	json.Unmarshal([]byte(request.Body), &requestData)

	fmt.Printf("RequestData: %+v", requestData)
	var result string
	if len(requestData.Email) > 0 && len(requestData.Message) > 0 {
		result, _ = send(requestData.Email, requestData.Message)
	}

	resp := Response{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            result,
		Headers: map[string]string{
			"Content-Type":           "application/json",
			"X-MyCompany-Func-Reply": "send-mail-handler",
		},
	}

	return resp, nil
}

func send(Email string, Message string) (string, error) {
	// This could be an env var
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1")},
	)

	// Create an SES session.
	svc := ses.New(sess)

	// Assemble the email.
	input := &ses.SendEmailInput{
		Destination: &ses.Destination{
			CcAddresses: []*string{},
			ToAddresses: []*string{
				aws.String(Recipient),
			},
		},
		Message: &ses.Message{
			Body: &ses.Body{
				Html: &ses.Content{
					Charset: aws.String(CharSet),
					Data:    aws.String(Message),
				},
				Text: &ses.Content{
					Charset: aws.String(CharSet),
					Data:    aws.String(Message),
				},
			},
			Subject: &ses.Content{
				Charset: aws.String(CharSet),
				Data:    aws.String(Email),
			},
		},
		// We are using the same sender because it needs to be validated in SES.
		Source: aws.String(Sender),

		// Uncomment to use a configuration set
		//ConfigurationSetName: aws.String(ConfigurationSet),
	}

	// Attempt to send the email.
	result, err := svc.SendEmail(input)

	// Display error messages if they occur.
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok {
			switch aerr.Code() {
			case ses.ErrCodeMessageRejected:
				fmt.Println(ses.ErrCodeMessageRejected, aerr.Error())
			case ses.ErrCodeMailFromDomainNotVerifiedException:
				fmt.Println(ses.ErrCodeMailFromDomainNotVerifiedException, aerr.Error())
			case ses.ErrCodeConfigurationSetDoesNotExistException:
				fmt.Println(ses.ErrCodeConfigurationSetDoesNotExistException, aerr.Error())
			default:
				fmt.Println(aerr.Error())
			}
		} else {
			// Print the error, cast err to awserr.Error to get the Code and
			// Message from an error.
			fmt.Println(err.Error())
		}

		return "there was an unexpected error", err
	}

	fmt.Println("Email Sent to address: " + Recipient)
	fmt.Println(result)
	return "sent!", err
}

func main() {
	lambda.Start(Handler)
}
{{< /highlight >}}
The code is pretty much straight forward it only expects 2 parameters and it will send an email and return sent! if everything went well. You can debug and compile your function before uploading by issuing the command `make` (This is really useful), and if you use `make deploy` you will save lots of time by only deploying working files.

##### **SES**
For this to work you will need to verify/validate your domain in SES.

Go to `SES->Domains->Verify a New Domain`.
{{< figure src="/img/aws-ses-validate-domain.png" width="100%" >}}

After putting your domain in, you will see something like this:
{{< figure src="/img/aws-ses-validation-and-dkim.png" width="100%" >}}

As I don't have this domain in Route53 I don't have a button to add the records to it (which makes everything simpler and faster), but it's easy enough just create a few dns records and wait a few minutes until you get something like this:
{{< figure src="/img/aws-ses-validation-ok.png" width="100%" >}}

**After that just test it**
{{< highlight bash >}}
serverless invoke -f send_mail -d '{ "Email": "kainlite@gmail.com", "Message": "test" }'
# OUTPUT:
{
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json",
        "X-MyCompany-Func-Reply": "send-mail-handler"
    },
    "body": ""
}
{{< /highlight >}}
After hitting enter the message popped up right away in my inbox :).

**Another option is to use [curl](https://devhints.io/curl)**
{{< highlight bash >}}
echo '{ "email": "kainlite@gmail.com", "message": "test2" }' | http https://m8ebtlirjg.execute-api.us-east-1.amazonaws.com/prod/sendMail
# OUTPUT:
# HTTP/1.1 200 OK
# Access-Control-Allow-Origin: *
# Connection: keep-alive
# Content-Length: 32
# Content-Type: application/json
# Date: Sun, 03 Feb 2019 02:24:25 GMT
# Via: 1.1 3421ea0c15d4fdc0bcb792131861cb1f.cloudfront.net (CloudFront)
# X-Amz-Cf-Id: kGK4R9kTpcWjZap8aeyPu0vdiCtpQ4gnhCAtCeeA6OJufzaTDL__0w==
# X-Amzn-Trace-Id: Root=1-5c5650d9-7c3c8fcc5e303ca480739560;Sampled=0
# X-Cache: Miss from cloudfront
# x-amz-apigw-id: UgGR7FlWIAMF75Q=
# x-amzn-RequestId: d2f45b14-275a-11e9-a8f3-47d675eed13e
#
# sent!
{{< /highlight >}}

**OR [httpie](https://devhints.io/httpie)**
{{< highlight bash >}}
curl -i -X POST https://m8ebtlirjg.execute-api.us-east-1.amazonaws.com/prod/sendMail -d '{ "email": "kainlite@gmail.com", "message": "test3" }'
# OUTPUT:
# HTTP/2 200
# content-type: application/json
# content-length: 32
# date: Sun, 03 Feb 2019 02:28:04 GMT
# x-amzn-requestid: 55cc72d0-275b-11e9-99bd-91c3fab78a2f
# access-control-allow-origin: *
# x-amz-apigw-id: UgG0OEigoAMF-Yg=
# x-amzn-trace-id: Root=1-5c5651b4-fc5427b4798e14dc61fe161e;Sampled=0
# x-cache: Miss from cloudfront
# via: 1.1 2167e4d6cf81822217c1ea31b3d3ba7e.cloudfront.net (CloudFront)
# x-amz-cf-id: FttmBoeUaSwQ2AArTgVmI5br51zwVMfUrVpXPLGm1HacV4yS9IYMHA==
#
# sent!
{{< /highlight >}}

And that's all for now, see you in the next article.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
