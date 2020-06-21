---
author: "Gabriel Garrido"
date: 2020-05-21
linktitle: Automatic terraform linting with reviewdog and tflint
title: Automatic terraform linting with reviewdog and tflint
highlight: true
tags:
- development
- github
- terraform
categories:
- serverless
images:
  - "/img/reviewdog.png"
---

##### **Introduction**
In this article we will test how to lint and get automatic checks in our github pull requests for our terraform code using [reviewdog](https://github.com/reviewdog/reviewdog) and the [tflint github action](https://github.com/reviewdog/action-tflint), this is particularly useful to prevent unwanted changes or buggy commits to be merged into your principal branch whatever that is. In order for this to work you just need to configure a Github action in your repo and that's it, you don't need to generate any token or do any extra step.

In order to make the example easier I have created this [repo](https://github.com/kainlite/reviewdog) with the basic configuration to make it work.

##### **Terraform**
First of all we need to get our terraform code, as you can see it's a simple ec2 instance in AWS, but the instance type doesn't exist, we will fix that in a bit.
{{< gist kainlite 46e52cccce0a9ef98c18429b77b1e0aa >}}

##### **Github Workflow**
Since we're using Github we can take advantage of [Actions](https://github.com/features/actions) in order to run a linter for our code and mark our PR if something is wrong.
{{< gist kainlite a584551ed1f974e9432f986c3fb6e73d >}}

##### **Example PR**
First we will run a PR with an issue to see it fail and how reporting works (To get here you can click in the checks tab in the PR and then the tflint step see [here](https://github.com/kainlite/reviewdog/pull/1/checks?check_run_id=793169790)).
{{< figure src="/img/reviewdog-1.png" width="100%" >}}

##### **One that actually works**
Since we already tested it and it failed as expected we can now fix it, and now that reviewdog and tflint are happy with our commit we can just merge it.
{{< figure src="/img/reviewdog-2.png" width="100%" >}}

##### **Closing notes**
For me this seems particularly useful because it can catch a lot of errors that sometimes are hard for the eye to catch, specially when we are talking of typos, it's also a good practice to lint your code so there you go, I hope you give this a shot and have in mind that reviewdog can review a lot of different languages, I just picked terraform because it's what I'm using the most lately.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
