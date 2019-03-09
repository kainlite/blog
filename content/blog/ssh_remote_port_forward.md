---
author: "Gabriel Garrido"
date: 2019-03-09
linktitle: SSH Remote Port Forward
title: SSH Remote Port Forward
highlight: true
tags:
- openssh
- tips-and-tricks
- linux
categories:
- linux
---

##### **Introduction**
SSH is a great tool not only to connect and interact with remote servers, in this article we will explore SSH Remote port forward and what it means, we also will explore [SSH Local Port Forward]({{< ref "/blog/ssh_local_port_forward" >}}) and [SSH Socks Proxy]({{< ref "/blog/ssh_socks_proxy" >}}) and how to use that functionality.

##### **Explanation**
Remote port forward basically let's you forward one port from your machine to a remote machine, for example you want to connect to a local service from a remote server but just temporarily, let's say you want to connect to a mysql instance on the default port (3306).

**The command**
{{< highlight bash >}}
ssh -Nn -R 3306:localhost:3306 user@example.com
{{< /highlight >}}

**The parameters and their meaning**
I extracted a portion of the meaning of parameter from the man page, but in a nutshell it means remote port forward without a shell.
{{< highlight text >}}
-N Do not execute a remote command. This is useful for just forwarding ports.
-n Redirects stdin from /dev/null (actually, prevents reading from stdin). This must be used when ssh is run in the background.
-R Specifies that connections to the given TCP port or Unix socket on the remote (server) host are to be forwarded to the local side.
{{< /highlight >}}

##### **Server configuration**
There are two configuration parameters that can change the behaviour of remote and local forwarded ports, those parameters are `GatewayPorts` and `AllowTcpForwarding`.

##### **GatewayPorts**
By default this option is `no` which means that only the remote computer will be able to connect to the forwarded port, you can set it to `yes` or `clientspecified` to allow other machines use that remote port-forward (handy and dangerous).

##### **AllowTcpForwarding**
By default this option is set to `yes`, you can restrict remote and local port forwarding by setting it to `no` or allow only local by setting it to `local`.

### **Closing notes**
As you can see this option can be really handy to bypass firewalls for example or have a temporary port forward, also if you want to make this automatic and not so temporary you can check autossh. You can use nc (netcat) if you don't want to install anything to test the connections and the tunnels (nc -l -p PORT) in the server side and (nc HOST PORT) in the client.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
