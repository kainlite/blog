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
lua:
  image:
    url: "/img/serverless-cognito.png"
---

##### **Introduction**
In this article we will see how to use Terraform and Go to create a serverless API using API Gateway, Lambda, and Go, and we will also handle authentication with AWS Cognito, the repo with the files can be found [here](https://github.com/kainlite/serverless-cognito).

##### **Terraform**
In this example I used terraform 0.12, and I kind of liked the new changes, it feels more like coding and a more natural way to describe things, however I think there are more bugs than usual in this version, but I really like the new output for the plan, apply, etc, getting back to the article since there is a lot of code I will gradually update the post with more notes and content or maybe another post explaining another section, but the initial version will only show the cognito part and the code to make it work and how to test it.
{{< gist kainlite 1e466c6ac28f9cfcf1513c105325e100 >}}
As we can see it's really simple to have a cognito user pool working, the most important part here is the `auto_verified_attributes` because that is what makes cognito to actually send an email or an sms with the confirmation code, the rest is self-describing, it creates a pool and a client, since what we need to be able to interact with out pool is the client that part is of considerable importance even that we have most things with default values.

##### **Go**
The good thing is that everything is code, but we don't have to manage any server, we just consume services from AWS completely from code, isn't that amazing?, I apologize for the length of the file, but you will notice that it's very repetitive, in most functions we load the AWS configuration, we make a request and return a response, we're also using Gin as a router, which is pretty straight-forward and easy to use, we have only one authenticated path (`/user/profile`), and we also have another unauthenticated path which is a health check (`/app/health`), the other two paths (`/user` and `/user/validate`) are exclusively for the user creation process with cognito.
{{< gist kainlite 755f0c1b2381af46fb2f69f8865cabb9 >}}
All logs go to Cloudwatch and you can also use X-Ray to diagnose issues.

##### **Testing it**
So we're going to hit the API to create, validate, and query the empty profile of the user from the terminal using curl.
{{< gist kainlite 71ba07ed304b527793ddd1f95c92d244 >}}
I have added most info in as comments in the snippet, note that I also used my test domain `skynetng.pw` with the subdomain `api` for all tests.

##### **Closing notes**
This post was heavily inspired by [this post](https://a.l3x.in/2018/07/25/lambda-api-custom-domain-tutorial.html) from Alexander, kudos to him for the great work!, this post expands on that and adds the certificate with ACM, it also handles a basic AWS Cognito configuration and the necessary go code to make it work, there are other ways to accomplish the same, but what I like about this approach is that you can have some endpoints or paths without authentication and you can use authentication, etc on-demand. This article is a bit different but I will try to re-shape it in the following weeks, and also cover more of the content displayed here, let me know if you have any comments or suggestions!

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
