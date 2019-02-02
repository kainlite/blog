---
author: "Gabriel Garrido"
date: 2019-02-02
linktitle: Serve your static website with S3 and CloudFront
title: Serve your static website with S3 and CloudFront
highlight: true
tags:
- elm
- development
- serverless
- aws
categories:
- serverless
lua:
  image:
    url: "/img/serve-s3-cloudfront.png"
---

##### **Introduction**
This article will be part of a series, the idea is to get a fully serverless site up and running with login functionality, maybe a profile page, and some random utility, but as we are just starting with it we will host our first draft of the page with a contact form, for the distribution of the files we will see how to configure CloudFront and for storing the files we will be using S3, S3 is an object storage service that offers industry leading scalability, data availability, security and performance, and CloudFront is a fast content delivery network (CDN). The site that we will be using were written using [elm](https://elm-lang.org/) and can be [found here](https://github.com/kainlite/aws-serverless-s3-elm-example).

##### **S3**
**First of all we need to create a bucket**
{{< highlight bash >}}
aws s3api create-bucket --bucket techsquad-serverless-site --region us-east-1
# OUTPUT:
# {
#     "Location": "/techsquad-serverless-site"
# }
{{< /highlight >}}
We could serve directly from S3 but that can be expensive in a site with lots of traffic (You can do it by [enabling web hosting in the bucket](https://docs.aws.amazon.com/cli/latest/reference/s3/website.html)).\

**For this setup to work we first need to create a cloud-front-origin-access-identity**
{{< highlight yaml >}}
aws cloudfront create-cloud-front-origin-access-identity --cloud-front-origin-access-identity-config CallerReference=techsquad-serverless-site-cloudfront-origin,Comment=techsquad-serverless-site-cloudfront-origin
{
    "Location": "https://cloudfront.amazonaws.com/2018-11-05/origin-access-identity/cloudfront/E3IJG9M5PO9BYE",
    "ETag": "E2XHDQQ0DDY9IJ",
    "CloudFrontOriginAccessIdentity": {
        "Id": "E3IJG9M5PO9BYE",
        "S3CanonicalUserId": "c951e48af14afcf935c2455a6d503150c80f20df93b27af9ed0928eb48feb67d1b933aa1adb7e1bf88a7aacccccccccc",
        "CloudFrontOriginAccessIdentityConfig": {
            "CallerReference": "techsquad-serverless-site-cloudfront-origin",
            "Comment": "techsquad-serverless-site-cloudfront-origin"
        }
    }
}
{{< /highlight >}}
Our origin access identity was successfully created, we need to grab the S3CanonicalUserId for our S3 bucket policy.

**Limit access to your bucket with the following policy (save as bucket-policy.json)**
{{< highlight yaml >}}
{
   "Version":"2012-10-17",
   "Id":"PolicyForCloudFrontPrivateContent",
   "Statement":[
        {
               "Sid":"techsquad-serverless-site-cloudfront-origin",
               "Effect":"Allow",
               "Principal":{"CanonicalUser":"c951e48af14afcf935c2455a6d503150c80f20df93b27af9ed0928eb48feb67d1b933aa1adb7e1bf88a7aacccccccccc"},
               "Action":"s3:GetObject",
               "Resource":"arn:aws:s3:::techsquad-serverless-site/*"
             }
      ]
}
{{< /highlight >}}
This policy will only allow CloudFront to fetch the files from the S3 bucket, because we want to avoid users or anyone actually from hitting the bucket directly.

**And then just attach that policy to the bucket**
{{< highlight bash >}}
aws s3api put-bucket-policy --bucket techsquad-serverless-site --policy file://bucket-policy.json
{{< /highlight >}}

**I'm using an old example I created and probably will continue building upon it, copy the files (the source files are in [this github repo](https://github.com/kainlite/aws-serverless-s3-elm-example))**
{{< highlight bash >}}
aws s3 sync . s3://techsquad-serverless-site/
{{< /highlight >}}
So far so good, We have our S3 bucket ready.

##### **CloudFront**
We will use this file to create our CF distribution (save it as distconfig.json or generate it with `aws cloudfront create-distribution --generate-cli-skeleton > /tmp/distconfig.json` and then replace the values: Id, DomainName, TargetOriginId, and the cname in Aliases.Items):
{{< highlight bash >}}
{
  "CallerReference": "techsquad-serverless-site-distribution",
  "Aliases": {
    "Quantity": 1,
    "Items": [
      "serverless.techsquad.rocks"
	 ]
   },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "techsquad-serverless-site-cloudfront",
        "DomainName": "techsquad-serverless-site.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/E3IJG9M5PO9BYE"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "techsquad-serverless-site-cloudfront",
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "none"
      }
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ViewerProtocolPolicy": "allow-all",
    "MinTTL": 3600
  },
  "CacheBehaviors": {
    "Quantity": 0
  },
  "Comment": "",
  "Logging": {
    "Enabled": false,
    "IncludeCookies": true,
    "Bucket": "",
    "Prefix": ""
  },
  "PriceClass": "PriceClass_All",
  "Enabled": true
}
{{< /highlight >}}
We will leave most values in their defaults, but if you want to know more or customize your deployment [check here](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/create-distribution.html) or type `aws cloudfront create-distribution help`.

**Let's finally create the CloudFront distribution for our site**
{{< highlight bash >}}
aws cloudfront create-distribution --distribution-config file://distconfig.json
# OUTPUT:
# {
#     "Location": "https://cloudfront.amazonaws.com/2018-11-05/distribution/E1M22XXNIJ5BLN",
#     "ETag": "EW1AZUQ33NKQ7",
#     "Distribution": {
#         "Id": "E1M22XXNIJ5BLN",
#         "ARN": "arn:aws:cloudfront::894527626897:distribution/E1M22XXNIJ5BLN",
#         "Status": "InProgress",
#         "LastModifiedTime": "2019-02-02T19:35:45.729Z",
#         "InProgressInvalidationBatches": 0,
#         "DomainName": "d3v3xtkl1l2ynj.cloudfront.net",
#         "ActiveTrustedSigners": {
#             "Enabled": false,
#             "Quantity": 0
#         },
#         "DistributionConfig": {
#             "CallerReference": "techsquad-serverless-site-distribution",
#             "Aliases": {
#                 "Quantity": 0
#             },
#             "DefaultRootObject": "index.html",
#             "Origins": {
#                 "Quantity": 1,
#                 "Items": [
#                     {
#                         "Id": "techsquad-serverless-site-cloudfront",
#                         "DomainName": "techsquad-serverless-site.s3.amazonaws.com",
#                         "OriginPath": "",
#                         "CustomHeaders": {
#                             "Quantity": 0
#                         },
#                         "S3OriginConfig": {
#                             "OriginAccessIdentity": "origin-access-identity/cloudfront/E3IJG9M5PO9BYE"
#                         }
#                     }
#                 ]
#             },
#             "OriginGroups": {
#                 "Quantity": 0,
#                 "Items": []
#             },
#             "DefaultCacheBehavior": {
#                 "TargetOriginId": "techsquad-serverless-site-cloudfront",
#                 "ForwardedValues": {
#                     "QueryString": true,
#                     "Cookies": {
#                         "Forward": "none"
#                     },
#                     "Headers": {
#                         "Quantity": 0
#                     },
#                     "QueryStringCacheKeys": {
#                         "Quantity": 0
#                     }
#                 },
#                 "TrustedSigners": {
#                     "Enabled": false,
#                     "Quantity": 0
#                 },
#                 "ViewerProtocolPolicy": "allow-all",
#                 "MinTTL": 3600,
#                 "AllowedMethods": {
#                     "Quantity": 2,
#                     "Items": [
#                         "HEAD",
#                         "GET"
#                     ],
#                     "CachedMethods": {
#                         "Quantity": 2,
#                         "Items": [
#                             "HEAD",
#                             "GET"
#                         ]
#                     }
#                 },
#                 "SmoothStreaming": false,
#                 "DefaultTTL": 86400,
#                 "MaxTTL": 31536000,
#                 "Compress": false,
#                 "LambdaFunctionAssociations": {
#                     "Quantity": 0
#                 },
#                 "FieldLevelEncryptionId": ""
#             },
#             "CacheBehaviors": {
#                 "Quantity": 0
#             },
#             "CustomErrorResponses": {
#                 "Quantity": 0
#             },
#             "Comment": "",
#             "Logging": {
#                 "Enabled": false,
#                 "IncludeCookies": false,
#                 "Bucket": "",
#                 "Prefix": ""
#             },
#             "PriceClass": "PriceClass_All",
#             "Enabled": true,
#             "ViewerCertificate": {
#                 "CloudFrontDefaultCertificate": true,
#                 "MinimumProtocolVersion": "TLSv1",
#                 "CertificateSource": "cloudfront"
#             },
#             "Restrictions": {
#                 "GeoRestriction": {
#                     "RestrictionType": "none",
#                     "Quantity": 0
#                 }
#             },
#             "WebACLId": "",
#             "HttpVersion": "http2",
#             "IsIPV6Enabled": true
#         }
#     }
# }
{{< /highlight >}}
Woah a lot of details in there, but what we might need later is the ETAG if we want to download and update our distribution, so have that handy, also we can see our CloudFront URL in there which is: d3v3xtkl1l2ynj.cloudfront.net in this case.

**It might take a few minutes to initialize the distribution, you can check the progress with**
{{< highlight bash >}}
aws cloudfront list-distributions | jq ".DistributionList.Items[0].Status"
# OUTPUT:
# "InProgress"
{{< /highlight >}}
Once it's ready the status will be: "Deployed", and now if we go to the CloudFront url you should see the site :). The S3 bucket will only let CloudFront access to the files so the only way to serve the site is through CloudFront.

##### **DNS**
**The only thing missing is the record in the DNS (I don't have this domain name in Route53, shame on me but a CNAME will do for now), so let's add it and verify it using dig.**
{{< highlight bash >}}
dig serverless.techsquad.rocks
# OUTPUT:
# dig CNAME serverless.techsquad.rocks
#
# ; <<>> DiG 9.13.5 <<>> CNAME serverless.techsquad.rocks
# ;; global options: +cmd
# ;; Got answer:
# ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 52651
# ;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1
#
# ;; OPT PSEUDOSECTION:
# ; EDNS: version: 0, flags:; udp: 1452
# ;; QUESTION SECTION:
# ;serverless.techsquad.rocks.    IN      CNAME
#
# ;; ANSWER SECTION:
# serverless.techsquad.rocks. 292 IN      CNAME   d3v3xtkl1l2ynj.cloudfront.net.
#
# ;; Query time: 20 msec
# ;; SERVER: 1.1.1.1#53(1.1.1.1)
# ;; WHEN: Sat Feb 02 17:47:11 -03 2019
# ;; MSG SIZE  rcvd: 98
{{< /highlight >}}
As we can see the record is already there so we can go to http://serverless.techsquad.rocks (note that this only works because we set that alias in the distribution), We could add SSL by creating a certificate using Amazon Certificate Manager, but we will leave that as an exercise or a future small article.

##### **Useful commands**
In case you need to get some information some useful commands:\

**This command will give us the Id of our distribution**
{{< highlight bash >}}
aws cloudfront list-distributions --output table --query 'DistributionList.Items[*].Id'
# OUTPUT:
# -------------------
# |ListDistributions|
# +-----------------+
# |  EFJVJEPWAPGU2  |
# +-----------------+
{{< /highlight >}}

**This one the ETag (needed to perform updates for example)**
{{< highlight bash >}}
aws cloudfront get-distribution-config --id EFJVJEPWAPGU2 | jq '. | .ETag'
# OUTPUT:
# "E2TPQRAUPJL2P3"
{{< /highlight >}}

**And this one will save the current config in /tmp so we can update it.**
{{< highlight bash >}}
aws cloudfront get-distribution-config --id EFJVJEPWAPGU2 | jq '. | .DistributionConfig' > /tmp/curent-distribution-E2TPQRAUPJL2P
{{< /highlight >}}

##### **Upcoming articles**
This article is the first one in this series of serverless articles, the idea is to build a fully functional website using only serverless technologies, the next post will cover the AWS Lambda function used to send the contact form, also all code from the site can be [found here](https://github.com/kainlite/aws-serverless-s3-elm-example).

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainjkjkjklite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
