
---
author: "Gabriel Garrido"
date: 2019-02-16
linktitle: Create an AWS lambda function in Go
title: Create an AWS lambda function in Go
highlight: true
tags:
- go
- development
- serverless
- linux
- terraform
categories:
- serverless
---

##### **Introduction**
In this article we will create a lambda function and an API Gateway route like we did with the serverless framework but only using AWS tools, we will be using the same generated code for our function from the last article [What does the serverless framework does for me]({{< ref "/blog/what_does_the_serverless_framework_does_for_me" >}}), so refer to that one before starting this one if you want to know how did we get here. Also as a side note this is a very basic example on how to get started with lambda without any additional tool.

##### **Let's see the code one more time**
{{< highlight go >}}
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

With that code as a starting point, now we need to build, package, upload, and deploy our function:

**Build**
{{< highlight bash >}}
GOOS=linux go build main.go
{{< /highlight >}}

**Package**
{{< highlight bash >}}
zip main.zip ./main
# OUTPUT:
#   adding: main (deflated 51%)
{{< /highlight >}}

**Create the role**

Go to IAM > Roles > Create.
Then select Lambda, assign a name and a description and then get the ARN for this role. Note that with the serverless framework this is done automatically for us, so we don't need to create a new role for each

**Upload / Deploy**
{{< highlight bash >}}
aws lambda create-function \
  --region us-east-1 \
  --function-name helloworld \
  --memory 128 \
  --role arn:aws:iam::894527626897:role/testing-aws-go \
  --runtime go1.x \
  --zip-file fileb://main.zip \
  --handler main

# OUTPUT:
# {
#     "FunctionName": "helloworld",
#     "FunctionArn": "arn:aws:lambda:us-east-1:894527626897:function:helloworld",
#     "Runtime": "go1.x",
#     "Role": "arn:aws:iam::894527626897:role/testing-aws-go",
#     "Handler": "main",
#     "CodeSize": 4346283,
#     "Description": "",
#     "Timeout": 3,
#     "MemorySize": 128,
#     "LastModified": "2019-02-16T15:44:10.610+0000",
#     "CodeSha256": "02/PQBeQuCC8JS1TLjyU38oiUwiyQSmKJXjya25XpFA=",
#     "Version": "$LATEST",
#     "TracingConfig": {
#         "Mode": "PassThrough"
#     },
#     "RevisionId": "7c9030e5-4a26-4f7e-968d-3a4f65dfde21"
# }
{{< /highlight >}}
Note that your function-name must match the name of your Lambda handler name (Handler). Note that this role might be insecure in some scenarios if you grant too much permissions, so try to restrict it as much as possible as with any role and policy.

**Test the function**
{{< highlight bash >}}
aws lambda invoke --function-name helloworld --log-type Tail /dev/stdout
# OUTPUT:
# {"statusCode":200,"headers":{"Content-Type":"application/json","X-MyCompany-Func-Reply":"hello-handler"},"body":"{\"message\":\"Go Serverless v1.0! Your function executed successfully!\"}"}{
#     "StatusCode": 200,
#     "LogResult": "U1RBUlQgUmVxdWVzdElkOiBmZTRmMWE4Zi1kYzAyLTQyYWQtYjBlYy0wMjA5YjY4MDY1YWQgVmVyc2lvbjogJExBVEVTVApFTkQgUmVxdWVzdElkOiBmZTRmMWE4Zi1kYzAyLTQyYWQtYjBlYy0wMjA5YjY4MDY1YWQKUkVQT1JUIFJlcXVlc3RJZDogZmU0ZjFhOGYtZGMwMi00MmFkLWIwZWMtMDIwOWI2ODA2NWFkCUR1cmF0aW9uOiAxMy4xOSBtcwlCaWxsZWQgRHVyYXRpb246IDEwMCBtcyAJTWVtb3J5IFNpemU6IDEyOCBNQglNYXggTWVtb3J5IFVzZWQ6IDQ1IE1CCQo=",
#     "ExecutedVersion": "$LATEST"
# }
{{< /highlight >}}
Everything looks about right, so what's next? We will eventually need to communicate with this code from an external source, so let's see how we can do that with the API Gateway. Also the log is encoded in base64, so if you want to see what the log result was do the following.

**Check the logs**
{{< highlight bash >}}
echo "U1RBUlQgUmVxdWVzdElkOiBmZTRmMWE4Zi1kYzAyLTQyYWQtYjBlYy0wMjA5YjY4MDY1YWQgVmVyc2lvbjogJExBVEVTVApFTkQgUmVxdWVzdElkOiBmZTRmMWE4Zi1kYzAyLTQyYWQtYjBlYy0wMjA5YjY4MDY1YWQKUkVQT1JUIFJlcXVlc3RJZDogZmU0ZjFhOGYtZGMwMi00MmFkLWIwZWMtMDIwOWI2ODA2NWFkCUR1cmF0aW9uOiAxMy4xOSBtcwlCaWxsZWQgRHVyYXRpb246IDEwMCBtcyAJTWVtb3J5IFNpemU6IDEyOCBNQglNYXggTWVtb3J5IFVzZWQ6IDQ1IE1CCQo=" | base64 -d
# OUTPUT:
# START RequestId: fe4f1a8f-dc02-42ad-b0ec-0209b68065ad Version: $LATEST
# END RequestId: fe4f1a8f-dc02-42ad-b0ec-0209b68065ad
# REPORT RequestId: fe4f1a8f-dc02-42ad-b0ec-0209b68065ad  Duration: 13.19 ms      Billed Duration: 100 ms         Memory Size: 128 MB     Max Memory Used: 45 MB
{{< /highlight >}}
You should also be able to see this same output in CloudWatch.

##### **API Gateway**

To make this step simpler I decided to use the AWS Console instead of the CLI it will also cut down the size of this article substantially.

**Now we need to create the API Gateway endpoint**

Note that you only have to go to Lambda->Functions->helloworld->Add triggers->API Gateway. And then complete as shown in the image, when you save this new trigger you will get the resource that then can be used to test the API Gateway integration.
{{< figure src="/img/lambda-helloworld-example.png" width="100%" >}}

The endpoint will show as follows (Click on API Gateway):
{{< figure src="/img/lambda-helloworld-example-endpoint.png" width="100%" >}}

**Test the API**
{{< highlight bash >}}
curl -v https://r8efasfb26.execute-api.us-east-1.amazonaws.com/default/helloworld
# OUTPUT:
# *   Trying 54.236.123.239...
# * TCP_NODELAY set
# * Connected to r8efasfb26.execute-api.us-east-1.amazonaws.com (54.236.123.239) port 443 (#0)
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
# *  start date: Sep 20 00:00:00 2018 GMT
# *  expire date: Oct 20 12:00:00 2019 GMT
# *  subjectAltName: host "r8efasfb26.execute-api.us-east-1.amazonaws.com" matched cert's "*.execute-api.us-east-1.amazonaws.com"
# *  issuer: C=US; O=Amazon; OU=Server CA 1B; CN=Amazon
# *  SSL certificate verify ok.
# * Using HTTP2, server supports multi-use
# * Connection state changed (HTTP/2 confirmed)
# * Copying HTTP/2 data in stream buffer to connection buffer after upgrade: len=0
# * Using Stream ID: 1 (easy handle 0x56394c766db0)
# > GET /default/helloworld HTTP/2
# > Host: r8efasfb26.execute-api.us-east-1.amazonaws.com
# > User-Agent: curl/7.63.0
# > Accept: */*
# >
# * Connection state changed (MAX_CONCURRENT_STREAMS == 128)!
# < HTTP/2 200
# < date: Sat, 16 Feb 2019 17:17:58 GMT
# < content-type: application/json
# < content-length: 70
# < x-amzn-requestid: ce5c5863-320e-11e9-9e76-875e7540974c
# < x-amz-apigw-id: VM_XAGhoIAMFqoQ=
# < x-mycompany-func-reply: hello-handler
# < x-amzn-trace-id: Root=1-5c6845c6-920cfc7da3cfd94f3e644647;Sampled=0
# <
# * Connection #0 to host r8efasfb26.execute-api.us-east-1.amazonaws.com left intact
# {"message":"Go Serverless v1.0! Your function executed successfully!"}
{{< /highlight >}}

If you ask me that was a lot of effort to handle without automation, maybe AWS SAM or the serverless framework can make things easier and let you focus on your application rather than the boilerplate required for it to run.

### Clean up
Always remember to clean up and delete everything that you created (to avoid surprises and save money), in this article I will leave that as an exercise for the reader :)

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
