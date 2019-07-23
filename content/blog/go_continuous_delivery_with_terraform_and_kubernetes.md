---
author: "Gabriel Garrido"
date: 2019-05-05
linktitle: Go continuous delivery with Terraform and Kubernetes
title: Go continuous delivery with Terraform and Kubernetes
highlight: true
tags:
- travis-ci
- docker
- golang
- go
- linux
- continuous-integration
- continuous-delivery
- terraform
categories:
- continuous-integration
lua:
  image:
    url: "/img/travis-ci-docker.png"
---

##### **Introduction**
In this article we will continue where we left off the last time [Go continuous integration with Travis CI and Docker]({{< ref "/blog/go_continuous_integration_with_travis_ci_and_docker" >}}), the files used here can be found [HERE](https://github.com/kainlite/whatismyip-go/tree/continuos-delivery), and we will be creating our terraform cluster with a load balancer and generating our kubeconfig file based on the certs provided by terraform on travis and then finally creating a basic deployment and validate that everything works.

##### **DigitalOcean**
We need to create a token so terraform can create resources using DO API. Go to your account then in the menu on the left click API, then you should see something like this:
{{< figure src="/img/terraform-do-token-1.png" width="100%" >}}
Once there click generate token (give it a meaningful name to you), and make sure it can write.
{{< figure src="/img/terraform-do-token-2.png" width="100%" >}}

##### **Terraform**
As the next step it would be good to set the token for terraform, so let's examine all files and see what they are going to do, but first we're going to provide the secrets to our app via environment variables, and I've found quite useful to use `direnv` on many projects, so the content of the first file `.envrc` would look something like:
{{< gist kainlite 2da0abc285e227b966b492f8e7f3eddc >}}
and after that you will need to allow it's execution by running `direnv allow`.

The first terraform file that we are going to check is `provider.tf`:
{{< gist kainlite add2f8b31929468359e9222bce0855f1 >}}
As we're using environment variables we need to declare it and then set it in the provider, for now we only need the token.

Then the `kubernetes.tf` file:
{{< gist kainlite 11d6eb62a0b3c5f0e5978e6b43e4b166 >}}
This file will be the responsible of creating the kubernetes cluster, as it's our development cluster we only need one node.

Next the file `lb.tf`:
{{< gist kainlite 85185e39960765a189ee70b5c9489fea >}}
This one is particularly interesting because it will provide a point of access to our applications (port 80 on it's public IP address), and it also uses a basic health check.

And last but not least the `output.tf` file:
{{< gist kainlite 18205b3ba693be054e2ea22832f4ecef >}}
This file will print the kubernetes config file that we need to be able to use `kubectl`, and also the IP address of our load balancer.

So what do we do with all of this?, first you will need to run `terraform init` inside the terraform folder to download plugins and providers, once that is done you can run `terraform plan` to see what changes terraform wants to make or `terraform apply` to do the changes. How is that going to look?:
{{< gist kainlite d4a4c4f18be5022e2ed23e74879ff975 >}}
This will create our cluster in DigitalOcean, remember to destroy it after you're done using it with `terraform destroy`, if you don't use a plan you will be prompted for a confirmation when you do `terraform apply`, review and say `yes`.

##### **Travis**
We did some additions to our `.travis.yml` file, which are mostly to prepare `kubectl` and to also trigger a deployment if the build succeeded.
{{< gist kainlite 69cdd243a815b68c483bdc71e6bf9186 >}}
As shown in the screenshot we took the base64 encoded certificates and loaded them into travis as environment variables (KUBERNETES_CA, KUBERNETES_CLIENT_CA, KUBERNETES_CLIENT_KEY, KUBERNETES_ENDPOINT), then we decode that into files, create the configuration using kubectl and set it as active and then we apply the deployment with the newly rendered hash.

This is how it should look in travis:
{{< figure src="/img/terraform-do-environment-variables.png" width="100%" >}}

Let's take a look at the generated kubernetes configuration and what values you should take into account:
{{< gist kainlite ebd9e3c82d4aa0f1e43be53078a9b593 >}}
Never do that, don't share your configuration or anybody will be able to use your cluster, also be careful not to commit it to your repo, in this example it's no longer valid because after running the examples I destroyed the cluster with `terraform destroy`. Now there are four values of interest for us: certificate-authority-data: KUBERNETES_CA, client-certificate-data: KUBERNETES_CLIENT_CA, client-key-data: KUBERNETES_CLIENT_KEY and server: KUBERNETES_ENDPOINT, with these variables we can re-create our kubernetes configuration easily using kubectl, be aware that we're not decoding to save it in travis, we do that in the travis configuration file (`.travis.yml`).

##### **Kubernetes**
So after all that, we still need to have a deployment template to deploy our application, and it's a template because we need to replace the SHA of the current build in the manifest before committing it to the Kubernetes API, so let's check it `manifest.yml.template`:
{{< gist kainlite aa1d9181112582ef94b5602480f95bf9 >}}
Here we expose our service in the port 30000 as a NodePort, and deploy the current SHA (replaced during execution by travis)

##### **Testing everything**
Validate that the deployment went well by checking our kubernetes cluster:
{{< gist kainlite fa4e77e771c564bc14185afba4903a8c >}}

First we test the load balancer, and as we will see the ip is not right, it's the internal ip of the load balancer and not our public ip address.
{{< gist kainlite 4d9b99cd269d2eb346f60c308af054da >}}

But if we hit our service directly we can see the correct IP address, this could be improved but it's left as an exercise for the avid reader ◕_◕.
{{< gist kainlite cc2618efbf28bdb8c2a83d344a6dcff7 >}}

Finally let's check what we should see in travis:
{{< figure src="/img/terraform-do-travis-result-1.png" width="100%" >}}

As we can see everything went well and our deployment applied successfully in our cluster
{{< figure src="/img/terraform-do-travis-result-2.png" width="100%" >}}

##### **Closing notes**
I will be posting some articles about CI and CD and good practices that DevOps/SREs should have in mind, tips, tricks, and full deployment examples, this is the second part of a possible series of three articles (Next one should be about the same but using Jenkins) with a complete but basic example of CI first and then CD. This can of course change and any feedback would be greatly appreciated :).

In this example many things could be improved, for example we use a node port and there is no firewall so we can hit our app directly via nodeport or using the load balancer, we should add some firewall rules so only the load balancer is able to talk to the node port range (30000-32767).

Also be aware that for production this setup will not be sufficient but for a development environment would suffice initially.

Some useful links for [travis](https://docs.travis-ci.com/user/job-lifecycle/) and [terraform](https://www.terraform.io/docs/providers/do/r/kubernetes_cluster.html).

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
