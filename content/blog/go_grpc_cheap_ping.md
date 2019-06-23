---
author: "Gabriel Garrido"
date: 2019-06-23
linktitle: Go gRPC Cheap Ping
title: Go gRPC Cheap Ping
highlight: true
tags:
- go
- grpc
categories:
- linux
lua:
  image:
    url: "/img/golang-grpc.png"
---

##### **Introduction**
In this article we will explore gRPC with a cheap ping application, basically we will do a ping and measure the time it takes for the message to go to the server and back before reporting it to the terminal. You can find the source code [here](https://github.com/kainlite/grpc-ping).

##### **Protobuf**
As you might already know gRPC serializes data using [protocol buffers](https://developers.google.com/protocol-buffers/), We are just going to create a [Unary RPC](https://grpc.io/docs/guides/concepts/) as follows.
{{< gist kainlite ad4f85164730c6c6fb2257329f7fc164 >}}
With this file in place we are defining a service that will be able to send a single `PingRequest` and get a single `PingResponse`, we have a `Data` field that goes back and forth in order to send some bytes over the wire (even that we don't really care about that, it could be important or crucial in a performance test).

##### **Generating the code**
In order to be able to use protobuf we need to generate the code for the app that we're writing in this case for golang the command would be this one:
{{< gist kainlite dac49c31ffaedac1d0cc1584a8cce306 >}}
This will give us a definition of the service and the required structs to carry the data that we have defined as messages.

##### **Client**
The client does most of the work here, as you can see you can supply 2 arguments one to point to another host:port and the second to send a string of your liking, then it measures the time it takes to send and receive the message back and prints it to the screen with a similar line to what the actual `ping` command looks in linux.
{{< gist kainlite 663a25de0321b85bde37e006c1621e60 >}}

##### **Server**
The server is a merely echo server since it will send back whatever you send to it and log it to the console, by default it will listen in port `50000`.
{{< gist kainlite 7c809672a86b6454f7080a88d87da977 >}}

##### **Testing it**
###### **Regular ping**
{{< gist kainlite 8f60f178d0e6796256647d0e5a5c4078 >}}

###### **Client**
This is what we would see in the terminal while testing it.
{{< gist kainlite 3abc2ac34d1390680fc9fb5787c1da02 >}}
As you can see the initial connection takes a bit more time but after that the roundtrip time is very consistent (of course our cheap ping doesn't cover errors, packet loss, etc).

###### **Server**
The server just echoes back and logs what received over the wire.
{{< gist kainlite edf6fc9b5f1c71e2eab054b5dbae3a24 >}}

##### **Closing notes**
As you can see gRPC is pretty fast and simplifies a lot everything that you need to do in order to have a highly efficient message system or communication between microservices for example, it's also easy to generate the boilerplate for whatever language you prefer and have a common interface that everyone has to agree on.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
