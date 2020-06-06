---
author: "Gabriel Garrido"
date: 2019-09-02
linktitle: Serverless authentication with Cognito
title: Serverless authentication with Cognito and Go
highlight: true
tags:
- go
- golang
- serverless
- aws
- security
- cognito
- lambda
categories:
- serverless
images:
  - "/img/serverless-cognito.png"
---

##### **Introduction**
In this article we will see how to use Terraform and Go to create a serverless API using API Gateway, Lambda, and Go, and we will also handle authentication with AWS Cognito, the repo with the files can be found [here](https://github.com/kainlite/serverless-cognito).

##### **Terraform**
In this example I used terraform 0.12, and I kind of liked the new changes, it feels more like coding and a more natural way to describe things, however I think there are more bugs than usual in this version, but I really like the new output for the plan, apply, etc, getting back to the article since there is a lot of code I will gradually update the post with more notes and content or maybe another post explaining another section, but the initial version will only show the cognito part and the code to make it work and how to test it.

##### Cognito
{{< gist kainlite 1e466c6ac28f9cfcf1513c105325e100 >}}
As we can see it's really simple to have a cognito user pool working, the most important part here is the `auto_verified_attributes` because that is what makes cognito to actually send an email or an sms with the confirmation code, the rest is self-describing, it creates a pool and a client, since what we need to be able to interact with out pool is the client that part is of considerable importance even that we have most things with default values. As you might have noticed we defined two `explicit_auth_flows` and that is to be able to interact with this user pool using user and password.

##### ACM
Next let's see how we manage the certificate creation using ACM.
{{< gist kainlite 21e47ec80a8c9c5cf84420a61ae44da9 >}}
Here basically we create the certificate using `aws_acm_certificate` and validate it automatically using the `DNS` method and the resource `aws_acm_certificate_validation`, the other resources in the file are just there because they are kind of associated but not necessarily need to be there.

##### Route53
Here we just create an alias record for the API Gateway and the validation record.
{{< gist kainlite 6601b5154528547f5724e498712a8b4b >}}

##### API Gateway
While this file might seem relatively simple, the API Gateway has many features and can get really complex really fast, basically what we are doing here is creating an API with a resource that accepts all method types and proxy that as it is to our lambda function.
{{< gist kainlite 455dfd82e2a23299dc2d22650a2c1cef >}}

##### Lambda
This file has the lambda function definition, the policy and the roles needed, basically the policy is to be able to log to CloudWatch and to inspect with X-Ray, then the log group to store the logs will set the retention period by default 7 days.
{{< gist kainlite f8d4db31c0b353d627df97418dd5dc87 >}}

##### Variables and locals
First the variables file with the default values
{{< gist kainlite 0b69599f35957612616dae4220207e37 >}}

And last the locals file, in this small snippet we are just making a map with a computed value and the values that can come from a variable which can be quite useful in many scenarios where you don't know all the information in advance or something is dynamically assigned:
{{< gist kainlite 348a4919f625452412beeed8e2a45200 >}}

##### Deployment scripts
There is a small bash script to make it easier to run the deployment, AKA as compiling the code, zipping it, and running terraform to update our function or whatever we changed.
{{< gist kainlite eafa48d2156b8a5bb2e5a458a928fab5 >}}

##### **Go**
The good thing is that everything is code, but we don't have to manage any server, we just consume services from AWS completely from code, isn't that amazing?, I apologize for the length of the file, but you will notice that it's very repetitive, in most functions we load the AWS configuration, we make a request and return a response, we're also using Gin as a router, which is pretty straight-forward and easy to use, we have only one authenticated path (`/user/profile`), and we also have another unauthenticated path which is a health check (`/app/health`), the other two paths (`/user` and `/user/validate`) are exclusively for the user creation process with cognito.
{{< gist kainlite 755f0c1b2381af46fb2f69f8865cabb9 >}}
All logs go to CloudWatch and you can also use X-Ray to diagnose issues.

##### **Testing it**
So we're going to hit the API to create, validate, and query the empty profile of the user from the terminal using curl.
{{< gist kainlite 71ba07ed304b527793ddd1f95c92d244 >}}
I have added most info in as comments in the snippet, note that I also used my test domain `skynetng.pw` with the subdomain `api` for all tests.

##### **Closing notes**
This post was heavily inspired by [this post](https://a.l3x.in/2018/07/25/lambda-api-custom-domain-tutorial.html) from Alexander, kudos to him for the great work!, this post expands on that and adds the certificate with ACM, it also handles a basic AWS Cognito configuration and the necessary go code to make it work, there are other ways to accomplish the same, but what I like about this approach is that you can have some endpoints or paths without authentication and you can use authentication, etc on-demand. This article is a bit different but I will try to re-shape it in the following weeks, and also cover more of the content displayed here, let me know if you have any comments or suggestions!

In some near future I will build upon this article in another article adding a few cool things, for example to allow an user to upload an image to an S3 bucket and fetch that with a friendly name using Cloudfront (In a secure manner, and only able to upload/update his/her profile picture, while being able to fetch anyone profile pic), the idea is to have a fully functional small API using AWS services and serverless facilities with common tasks that you can find in any functional website.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
