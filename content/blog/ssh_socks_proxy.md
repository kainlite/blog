---
author: "Gabriel Garrido"
date: 2019-03-10
linktitle: SSH Socks Proxy
title: SSH Socks Proxy
highlight: true
tags:
- openssh
- tips-and-tricks
- linux
categories:
- linux
draft: true
---

##### **Introduction**
SSH is a great tool not only to connect and interact with remote servers, in this article we will explore SSH Socks proxy and what it means, we also will explore [SSH Remote Port Forward]({{< ref "/blog/ssh_remote_port_forward" >}}) and [SSH Local Port Forward]({{< ref "/blog/ssh_local_port_forward" >}}) and how to use that functionality.

##### **Explanation**
SOCKS is an Internet protocol that exchanges network packets between a client and server through a proxy server (Extracted from Wikipedia). So basically it allows our remote server to become a VPNey likey thingy using SSH, so let's see the different options of how and when to use it. But we will need to tell the application to use that SOCKS proxy, for example our browser or curl.

**The command**
{{< highlight bash >}}
ssh -D 9999 -Nn ec2-user@54.210.37.203
{{< /highlight >}}

For example I started a EC2 instance for this example and this is the output from curl:
{{< highlight bash >}}
$ curl --socks4 localhost:9999 icanhazip.com
# OUTPUT:
# 54.210.37.203
{{< /highlight >}}

**The parameters and their meaning**
I extracted a portion of the meaning of parameter from the man page, but in a nutshell it means dynamic port forward without a shell.
{{< highlight text >}}
-N Do not execute a remote command. This is useful for just forwarding ports.
-n Redirects stdin from /dev/null (actually, prevents reading from stdin). This must be used when ssh is run in the background.
-D Specifies a local “dynamic” application-level port forwarding.  This works by allocating a socket to listen to port on the local side, optionally bound to the specified bind_address.
{{< /highlight >}}

### Closing notes
As you can see this option can be really handy to have a temporary VPN or proxy, also if you want to make this automatic and not so temporary you can check autossh or any real VPN solution like OpenVPN. You can use this kind of proxy in any App that supports SOCKS, most browsers do for example.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
