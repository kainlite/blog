---
author: "Gabriel Garrido"
date: 2020-02-02
linktitle: Gitlab-CI Basics
title: Gitlab-CI Basics
highlight: true
tags:
- go
- golang
- kubernetes
- linux
- docker
- kubebuilder
- gitlab
- continuous-integration
- continuous-delivery
categories:
- kubernetes
lua:
  image:
    url: "/img/gitlab.png"
---

##### **Introduction**
In this article we will continue where we left off the [forward](https://github.com/kainlite/forward) project last time, in this article we will use [gitlab-ci](https://gitlab.com) to test, build and push the image of our operator to [dockerhub](https://hub.docker.com/repository/docker/kainlite/forward).

Gitlab offers a pretty complete solution, but we will only sync our repo from github and set a basic pipeline to test, build and push our docker image to the registry, note that I do not have any kind of affiliation with gitlab, but I like their platform. Also this article demonstrates that you can use github and gitlab in a straight forward manner using the free tier in both sides, we rely in the free shared runners to make our custom CI system.

If you want to check the previous article [go here]({{< ref "/blog/cloud_native_applications_with_kubebuilder_and_kind_aka_kubernetes_operators" >}}), that way you will know what the project is all about.

##### **Prerequisites**
* [A project in github in this case](https://github.com/kainlite/forward)
* [A gitlab.com account](https://gitlab.com/users/sign_up)
* [A dockerhub account](https://hub.docker.com/u/kainlite)

##### **Create the project**
Once you have your accounts configured, let's create a project, the page should look something like this
{{< figure src="/img/gitlab-1.png" width="100%" >}}
We want to create a repo or sync a repo in this case, so we select `Create a project` and continue

##### **Project type**
In this step we have a few options and since we have our code in Github and we want to work there, we only want to sync it, so we need to choose `CI/CD for external repo`
{{< figure src="/img/gitlab-2.png" width="100%" >}}
Note that if the repo is public you can fetch/clone using the repo URL, but since I want to check also private repos I went for the github token alternative. Once you hit github it will ask you for the token then it will show you the full list of repos in your account\

##### **Github Token**
I picked to use a personal token to fetch the repos to be able to grab private repos, etc, so you will need to go to your github account, `Settings->Developer settings` and then create a new token or [click here](https://github.com/settings/tokens)
{{< figure src="/img/gitlab-3.png" width="100%" >}}

Now you only need to give it access to repo, and hit save or create new personal token
{{< figure src="/img/gitlab-4.png" width="100%" >}}
Make sure you don't expose or publish that token in any way, otherwise someone could gain access to your account\

##### (Back to gitlab) **Select the repository to sync**
Here we need to select the repo that we want to sync and hit connect, it will automatically fetch everything periodically from github.
{{< figure src="/img/gitlab-5.png" width="100%" >}}\

##### **Dockerhub token**
Now we will need to create a token for dockerhub so we can push our image from the build runner, go to your dockerhub account and create a token
{{< figure src="/img/gitlab-6.png" width="100%" >}}
Basically you have to go to `Account settings->Security->New Access Token` or [click here](https://hub.docker.com/settings/security).

Then we need to save that token as `DOCKERHUB_TOKEN` in this case as an environment variable in the gitlab project, `Settings->CI/CD->Variables`
{{< figure src="/img/gitlab-7.png" width="100%" >}}
make sure masked is marked but not protected, protected is only used when you want to use that secret in specific branches\

##### **Gitlab-CI config**
After that we only need to add the code to the repo and that will trigger a build, the file needs to be called `.gitlab-ci.yml`
{{< gist kainlite  1cb1aeb54f12830f4bcef6f0df02a250 >}}
basically we just install everything we need run the tests if everything goes well, then the build and push process. There is a lot of room for improvement in that initial config, but for now we only care in having some sort of CI system\

Then we will see something like this in the `CI/CD->Pipelines` tab, after each commit it will trigger a test, build and push
{{< figure src="/img/gitlab-8.png" width="100%" >}}\

##### **Checking the results**
And we can validate that the images are in dockerhub
{{< figure src="/img/gitlab-9.png" width="100%" >}}\

##### **Useful links**
Some useful links:
* [Variables](https://docs.gitlab.com/ee/ci/variables/) and [Predefined variables](https://docs.gitlab.com/ee/ci/variables/predefined_variables.html)
* [Using docker images](https://docs.gitlab.com/ee/ci/docker/using_docker_images.html)
* [Build docker images](https://docs.gitlab.com/ee/ci/docker/using_docker_build.html)

##### **Closing notes**
I hope you enjoyed it and hope to see you on [twitter](https://twitter.com/kainlite) or [github](https://github.com/kainlite)!

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
