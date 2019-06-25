---
author: "Gabriel Garrido"
date: 2019-04-27
linktitle: Creating a lambda function with terraform
title: Creating a lambda function with terraform
highlight: true
tags:
- development
- serverless
- aws
- terraform
categories:
- serverless
lua:
  image:
    url: "/img/terraform-lambda.png"
---

##### **Introduction**
Here we will see how to use terraform to manage lambda functions, it will be a simple hello world in node.js, available as a [gist here](https://gist.github.com/smithclay/e026b10980214cbe95600b82f67b4958), note that I did not create this example but it's really close to the official documentation but shorter, you can see another example with [python here](https://github.com/terraform-providers/terraform-provider-aws/tree/master/examples/lambda).

Before you start make sure you already have your account configured for [awscli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) and [terraform](https://learn.hashicorp.com/terraform/getting-started/install.html) installed.

##### **Configuration files**
First of all we need to get our terraform file or files (in a normal case scenario, but since this is a hello world it is easier to have everything in the same file), I have added some comments of what each part does as you can see.
{{< gist kainlite 67b5e84684ae6cca6c0f0847352df55f >}}

##### **The code itself**
Then we need the code that we need or want to run there.
{{< gist kainlite e52a9a9e63f7de88f11090add8668dd1 >}}

##### **Initialize terraform**
First of all we will need to initialize terraform like in the gist below, this will download the necessary plugins that we used in the code, otherwise it won't be able to run.
{{< gist kainlite cca6fe034015ee2ce205baf6b68750c3 >}}

##### **Apply the changes**
The next step would be to apply the changes, you can also plan to an outfile and then apply from that file, but also apply works, this command will take care of doing everything that we defined, it will archive the code, the IAM role and the function itself.
{{< gist kainlite 128f522071e66f2a33799241a79ebd1a >}}

##### **Running the function**
Then the last step would be to run our function to see if it actually works, in this case we're using the awscli but you can use the AWS console as well, the result will be the same.
{{< gist kainlite ea98dcf28b0fe1df31c662e5051bb5b5 >}}

##### **Clean up**
Remember to clean up before leaving.
{{< gist kainlite 83be5bcc8e237cc30d7aee17667a5171 >}}

I don't know about you, but I'm going to keep using the [serverless framework](https://serverless.com/) for now, but it's good to see that we have alternatives and with some effort can give us the same functionality.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
