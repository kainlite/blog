---
author: "Gabriel Garrido"
date: 2019-02-16
linktitle: What does the serverless framework does for me
title: What does the serverless framework does for me
highlight: true
tags:
- development
- serverless
- go
categories:
- serverless
lua:
  image:
    url: "/img/serveless.png"
---

### **Introduction**
The [serverless framework](https://serverless.com/) is a nice tool to manage all your cloud functions. from their page:

> The Serverless Framework helps you develop and deploy your AWS Lambda functions, along with the AWS infrastructure resources they require. It's a CLI that offers structure, automation and best practices out-of-the-box, allowing you to focus on building sophisticated, event-driven, serverless architectures, comprised of Functions and Events.

### **Let's take the golang example for a spin**
So let's generate a project with the serverless framework and see everything that it does for us.
{{< highlight bash >}}
mkdir foo && cd "$_" &&  serverless create -t aws-go
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
Got you a bit of command line fu right there with the "$_" (it means the first parameter of the previous command)

Okay all peachy but what just happened? We initialized a serverless framework project with the template aws-go (as you probably figured by now) the serverless framework can handle different languages and cloud providers, in this example we picked aws and go (there is another template for go called aws-go-dep which as the name indicates uses dep to manage dependencies), enough talking.

**Let's take a look at the files**
{{< highlight bash >}}
tree .
# OUTPUT:
# ├── hello
# │   └── main.go
# ├── Makefile
# ├── serverless.yml
# └── world
#     └── main.go
#
# 2 directories, 4 files
{{< /highlight >}}
We got a manifest `serverless.yml` a `Makefile` (which you can use to build your functions (to validate syntax errors for instance or run in test mode before pushing them to AWS, it will also be used to build them while deploying)

**The manifest file indicates a lot of things, I will add comments to the _code_**
{{< highlight bash >}}
frameworkVersion: ">=1.28.0 <2.0.0"

provider:
  name: aws
  runtime: go1.x

# Which files needs to be included and which to be ignored
package:
 exclude:
   - ./**
 include:
   - ./bin/**

# The functions and the handlers (the actual function definition in the code), and events which then will be translated into API Gateway endpoints for your functions
functions:
  hello:
    handler: bin/hello
    events:
      - http:
          path: hello
          method: get
  world:
    handler: bin/world
    events:
      - http:
          path: world
          method: get
{{< /highlight >}}

**Let's take a look at the hello function / file**
{{< highlight bash >}}
package main

import (
    "bytes"
    "context"
    "encoding/json"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

// Response is of type APIGatewayProxyResponse since we're leveraging the
// AWS Lambda Proxy Request functionality (default behavior)
//
// https://serverless.com/framework/docs/providers/aws/events/apigateway/#lambda-proxy-integration
type Response events.APIGatewayProxyResponse

// Handler is our lambda handler invoked by the `lambda.Start` function call
func Handler(ctx context.Context) (Response, error) {
    var buf bytes.Buffer

    body, err := json.Marshal(map[string]interface{}{
        "message": "Go Serverless v1.0! Your function executed successfully!",
    })
    if err != nil {
        return Response{StatusCode: 404}, err
    }
    json.HTMLEscape(&buf, body)

    resp := Response{
        StatusCode:      200,
        IsBase64Encoded: false,
        Body:            buf.String(),
        Headers: map[string]string{
            "Content-Type":           "application/json",
            "X-MyCompany-Func-Reply": "hello-handler",
        },
    }

    return resp, nil
}

func main() {
    lambda.Start(Handler)
}
{{< /highlight >}}
This function only returns some text with some headers, every lambda function requires the lambda.Start with your function name as an entrypoint, in this case Handler, the context is usually used to pass data between calls or functions. The rest of the code is pretty straight forward go code, it builds a json object and returns it along with some headers.

##### **Let's deploy it**
{{< highlight bash >}}
serverless deploy
# OUTPUT:
# Serverless: WARNING: Missing "tenant" and "app" properties in serverless.yml. Without these properties, you can not publish the service to the Serverless Platform.
# Serverless: Packaging service...
# Serverless: Excluding development dependencies...
# Serverless: Uploading CloudFormation file to S3...
# Serverless: Uploading artifacts...
# Serverless: Uploading service .zip file to S3 (10.88 MB)...
# Serverless: Validating template...
# Serverless: Updating Stack...
# Serverless: Checking Stack update progress...
# ............
# Serverless: Stack update finished...
# Service Information
# service: aws-go
# stage: dev
# region: us-east-1
# stack: aws-go-dev
# api keys:
#   None
# endpoints:
#   GET - https://cfr9zyw3r1.execute-api.us-east-1.amazonaws.com/dev/hello
#   GET - https://cfr9zyw3r1.execute-api.us-east-1.amazonaws.com/dev/world
# functions:
#   hello: aws-go-dev-hello
#   world: aws-go-dev-world
# layers:
#   None
{{< /highlight >}}
So a lot happened here, the deploy function compiled our binary, packaged it, uploaded that package to s3, created a cloudformation stack and after everything was completed, returned the endpoints that were defined, as you can see the framework enabled us to create and deploy a function (two actually) really easily which totally simplifies the process of managing functions and events.

**And test it**
{{< highlight bash >}}
curl -v https://cfr9zyw3r1.execute-api.us-east-1.amazonaws.com/dev/hello
# OUTPUT:
# *   Trying 99.84.27.2...
# * TCP_NODELAY set
# * Connected to cfr9zyw3r1.execute-api.us-east-1.amazonaws.com (99.84.27.2) port 443 (#0)
# * ALPN, offering h2
# * ALPN, offering http/1.1
# * successfully set certificate verify locations:
# *   CAfile: /etc/ssl/certs/ca-certificates.crt
#   CApath: none
# * TLSv1.3 (OUT), TLS handshake, Client hello (1):
# * TLSv1.3 (IN), TLS handshake, Server hello (2):
# * TLSv1.2 (IN), TLS handshake, Certificate (11):
# * TLSv1.2 (IN), TLS handshake, Server key exchange (12):
# * TLSv1.2 (IN), TLS handshake, Server finished (14):
# * TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
# * TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
# * TLSv1.2 (OUT), TLS handshake, Finished (20):
# * TLSv1.2 (IN), TLS handshake, Finished (20):
# * SSL connection using TLSv1.2 / ECDHE-RSA-AES128-GCM-SHA256
# * ALPN, server accepted to use h2
# * Server certificate:
# *  subject: CN=*.execute-api.us-east-1.amazonaws.com
# *  start date: Oct  9 00:00:00 2018 GMT
# *  expire date: Oct  9 12:00:00 2019 GMT
# *  subjectAltName: host "cfr9zyw3r1.execute-api.us-east-1.amazonaws.com" matched cert's "*.execute-api.us-east-1.amazonaws.com"
# *  issuer: C=US; O=Amazon; OU=Server CA 1B; CN=Amazon
# *  SSL certificate verify ok.
# * Using HTTP2, server supports multi-use
# * Connection state changed (HTTP/2 confirmed)
# * Copying HTTP/2 data in stream buffer to connection buffer after upgrade: len=0
# * Using Stream ID: 1 (easy handle 0x55944b9d7db0)
# > GET /dev/hello HTTP/2
# > Host: cfr9zyw3r1.execute-api.us-east-1.amazonaws.com
# > User-Agent: curl/7.63.0
# > Accept: */*
# >
# * Connection state changed (MAX_CONCURRENT_STREAMS == 128)!
# < HTTP/2 200
# < content-type: application/json
# < content-length: 70
# < date: Sat, 16 Feb 2019 04:32:04 GMT
# < x-amzn-requestid: cf4c6094-31a3-11e9-b61e-bb2138b2f390
# < x-amz-apigw-id: VLPKmHj4oAMFbbw=
# < x-mycompany-func-reply: hello-handler
# < x-amzn-trace-id: Root=1-5c679243-d4f945debb1a2b675c41675f;Sampled=0
# < x-cache: Miss from cloudfront
# < via: 1.1 655473215401ef909f449b92f216caa1.cloudfront.net (CloudFront)
# < x-amz-cf-id: LOHG0oG-WbGKpTnlGz-VDVqb9DxXQX-kgJJEUkchh1v_zLfUqNCpEQ==
# <
# * Connection #0 to host cfr9zyw3r1.execute-api.us-east-1.amazonaws.com left intact
# {"message":"Go Serverless v1.0! Your function executed successfully!"}%
{{< /highlight >}}
As expected we can see the headers x-my-company-func-reply and the json object that it created for us.

### **Cleanup**
{{< highlight bash >}}
serverless remove
# OUTPUT:
# Serverless: WARNING: Missing "tenant" and "app" properties in serverless.yml. Without these properties, you can not publish the service to the Serverless Platform.
# Serverless: Getting all objects in S3 bucket...
# Serverless: Removing objects in S3 bucket...
# Serverless: Removing Stack...
# Serverless: Checking Stack removal progress...
# ...............
# Serverless: Stack removal finished...
{{< /highlight >}}
This will as you expect remove everything that was created with the deploy command.

In the next article we will explore how to do create and deploy a function like this one by hand.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
