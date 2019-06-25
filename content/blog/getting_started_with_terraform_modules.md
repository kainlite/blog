---
author: "Gabriel Garrido"
date: 2019-06-24
linktitle: Getting started with terraform modules
title: Getting started with terraform modules
highlight: true
tags:
- terraform
- kubernetes
- gcp
categories:
- terraform
lua:
  image:
    url: "/img/terraform.png"
---

##### **Introduction**
In this article we will see a subtle introduction to terraform modules, how to pass data into the module, get something from the module and create a resource (GKE cluster), it's intended to be as simple as possible just to be aware of what a module is composed of, or how can you do your own modules, sometimes it makes sense to have modules to abstract implementations that you use over several projects, or things that are often repeated along the project. So let's see what it takes to create and use a module. The source code for this article can be found [here](https://github.com/kainlite/terraform-module-example). Note that in this example I'm using GCP since they give you $300 USD for a year to try their services and it looks pretty good so far, after sign-up you will need to go to IAM, then create a service account and after that export the the key (this is required for the terraform provider to talk to GCP).

##### **Composition of a module**
A module can be any folder with a `main.tf` file in it, yes, that is the only _required_ file for a module to be usable, but the recommendation is that you also put a `README.md` file with a description of the module if it's intended to be used by people if it's a sub-module it's not necessary, also you will need a file called `variables.tf` and other `outputs.tf` of course if it's a big module that cannot be splitted into sub-modules you can split those files for convenience or readability, variables should have descriptions so the tooling can show you what are they for, you can read more about the basics for a module [here](https://www.terraform.io/docs/modules/index.html).

Before moving on let's see the folder structure of our project:
{{< gist kainlite  4229babfdf16f9caaf16889246a5b53c >}}

##### **Okay enough talking, show me the code**
###### **The project**
Let's start with the `main.tf` that will call our module, notice that I added a few additional comments but it's pretty much straight forward, we set the provider, then we define some variables, call our module and print some output (output can also be used to pass data between modules).
{{< gist kainlite 63f7b16e104bd3d2c827e4d491cbd347 >}}

Then `terraform.tfvars` has some values to override the defaults that we defined:
{{< gist kainlite 2ff76f85396f70f5a5d0fd406fc91381 >}}

###### **The module**
Now into the module itself, this module will create a GKE cluster, and while it's not a good practice to have a module as a wrapper but for this example we will forget about that rule for a while, this is the `main.tf` file:
{{< gist kainlite 8a2db80dbcba38160e4c8f0112e55424 >}}

The `variables.tf` file:
{{< gist kainlite 183d577eef0b1967792b0e2e95e79e1e >}}

And finally the `outputs.tf` file:
{{< gist kainlite 3b30dcc163e97103e9503be86672bd39 >}}
Notice that we have a lot more outputs than the one we decided to print out, but you can play with that and experiment if you want :)

###### **Testing it**
First we need to initialize our project so terraform can put modules, provider files, etc in place, it's a good practice to version things and to move between versions that way everything can be tested and if something is not working as expected you can always rollback to the previous state.
{{< gist kainlite 346e84ef3577ef708625741a508afb2c >}}

Then we will just run it.
{{< gist kainlite e77dbdd482eb26cd54414324761900f4 >}}
If we check the output we will see that the name of the cluster matches the one from our variables and at the end we can see the output that the module produced.

##### **Closing notes**
As you can see, creating a module is pretty simple and with good planing and practice it can save you a lot of effort along big projects or while working on multiple projects, let me know your thoughts about it. Always remember to destroy the resources that you're not going to use with `terraform destroy`.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
