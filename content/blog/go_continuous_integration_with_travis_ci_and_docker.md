---
author: "Gabriel Garrido"
date: 2019-04-29
linktitle: Go continuous integration with Travis CI and Docker
title: Go continuous integration with Travis CI and Docker
highlight: true
tags:
- travis-ci
- docker
- golang
- linux
- continuous-integration
categories:
- continuous-integration
lua:
  image:
    url: "/img/travis-ci-docker.png"
---

##### **Introduction**
In this article we will see how to create a simple continuous integration process using [Github](https://github.com), [Travis-CI](https://travis-ci.org) and [Docker HUB](https://cloud.docker.com), the files used here can be found [HERE](https://github.com/kainlite/whatismyip-go), in the next article we will continue with what we have here to provide continuous deployment possibly using Jenkins or maybe Travis, let me know which one you would prefer to see.

##### **First thing first**
##### App
We will review the docker file, the app code and the travis-ci file, so let's start with the app `main.go`:
{{< gist kainlite f7e0c3e40b02cc31a78f4eef491fa834 >}}
Let's quickly check what this code does, first we check for the port to use, then convert it to a number, register the handler for our HTTP function and listen for requests, this code should print our ip address as you would expect by the name.

Then the `main_test.go` code:
{{< gist kainlite 13391af166c77ffb10b940e5a9a1ac4d >}}
The test is fairly simple it just checks that the web server works by trying to fetch `/` and checking for an empty body and `200` status code.

##### Docker
Next the `Dockerfile`:
{{< gist kainlite 5db561f6f8808f1b5eaf091887416311 >}}
We set the working directory to please go, then fetch dependencies and install our binary, we also generate a test binary, expose the port that we want to use and set the user as nobody in case someone can exploit our app and jump into our container, then just set the command to execute on `docker run`.

##### Travis
And last but not least the `.travis.yml` file:
{{< gist kainlite 55c5fcd1fde0bfc148b8a9ee8a41fc5a >}}
We let travis know that we will be running some go code and also docker, then build the image, run the tests and then the app as initialization, after that we validate that the app works and lastly login to dockerhub and push the image, the important things to have in mind here is that we use variables for example the repo name, the commit SHA, and the docker username and password in a secure way, since travis-ci hides the values that we tell them to.

##### **Putting everything together**
So far we got the [repo](https://github.com/kainlite/whatismyip-go) going, the configuration for travis, the dockerfile, the app, but now we need to make use of it, so you will need to create a travis account for this to work then link your github account to it, then you will be able to sync your repositories and you should see something like this:
{{< figure src="/img/whatismyip-go-travis-list.png" width="100%" >}}
Once you have your account linked you will be able to sync and enable repositories to be built.

After enabling the repository you can configure some details like environment variables, here we will set the credentials for dockerhub.
{{< figure src="/img/whatismyip-go-travis-settings.png" width="100%" >}}

And now we will create the repository in dockerhub:
{{< figure src="/img/whatismyip-go-docker-repo.png" width="100%" >}}
After the repository is created we can trigger a build from travis or push a commit to the repo in order to trigger a build and to validate that everything works.

You should see something like this in travis if everything went well:
{{< figure src="/img/whatismyip-go-travis-log-1.png" width="100%" >}}
You can validate that everything went well by checking the commit SHA that triggered the build.

And dockerhub:
{{< figure src="/img/whatismyip-go-travis-log-2.png" width="100%" >}}
The same SHA will be used to tag the image.

##### **Closing notes**
I will be posting some articles about CI and CD and good practices that DevOps/SREs should have in mind, tips, tricks, and full deployment examples, this is the first part of a possible series of two or three articles with a complete but basic example of CI first and then CD. This can of course change and any feedback would be greatly appreciated :).

Some useful links for travis and [docker](https://docs.travis-ci.com/user/docker/) and the [environment variables list](https://docs.travis-ci.com/user/environment-variables/) that can be used.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
