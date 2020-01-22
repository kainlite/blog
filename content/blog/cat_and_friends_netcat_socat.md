---
author: "Gabriel Garrido"
date: 2020-01-20
linktitle: Cat and friends (Netcat and Socat)
title: Cat and friends (Netcat and Socat)
highlight: true
tags:
- networking
- linux
categories:
- linux
lua:
  image:
    url: "/img/linux.png"
---

#### **Introduction**
In this article we will see how to use `cat`, `netcat` and `socat` at least some basic examples and why do we have so many cats...

Also sorry for the awful recordings, but couldn't figure out why it looks so bad with tmux.

#### **cat**
Cat as you might have guessed or know already is to con-cat-enate things, when used in conjunction with the shell redirections it can do a lot of powerful things but it's often used when it's not needed due to that, let's see some examples.
<script src="https://asciinema.org/a/a48k8B7cUHXPsK0aJ3QNfL1zd.js" async data-preload="true" data-speed="2" data-size="small" data-cols="120" data-rows="20" id="asciicast-a48k8B7cUHXPsK0aJ3QNfL1zd" async></script>
So what happened there? Basically when you want to end the file or the input you send the keyword Ctrl+D, when typed at the start of a line on a terminal, signifies the end of the input. This is not a signal in the unix sense: when an application is reading from the terminal and the user presses Ctrl+D, the application is notified that the end of the file has been reached (just like if it was reading from a file and had passed the last byte). This can be used also to terminate ssh sessions or just log you out from a terminal.

If you want to copy and paste something there you go:
{{< gist kainlite  bb03d32945ca285572a17e974deffee9 >}}

While cat is overly simplified here, it can do a lot of interesting things and it is usually misused [see here](http://porkmail.org/era/unix/award.html)

More info:

- [Cat examples](https://www.tecmint.com/13-basic-cat-command-examples-in-linux/)
- [Bash redirections](https://www.gnu.org/savannah-checkouts/gnu/bash/manual/bash.html#Redirections)
- [Zsh redirections](http://zsh.sourceforge.net/Doc/Release/Redirection.html)


#### **netcat**
Netcat is a bit more interesting since it can use the network and it's really simple also, so it let us use network sockets without too much complication, let's see a couple of examples, first we spin up a server (listener), then connect from the other side and send some data, be aware that connections are bi-directional then Ctrl-C to finish the process. Then in the second example we spin up a server and wait for a compressed file to be sent from the client.
<script src="https://asciinema.org/a//aRoZYNLIr1EwCLYBpyhY5N2iC.js" async data-preload="true" data-speed="2" data-size="small" data-cols="125" data-rows="40" data-loop="true" id="asciicast-aRoZYNLIr1EwCLYBpyhY5N2iC" async></script>
There are many more things that you can do with netcat and is usually really helpful to debug networking issues or to do a quick copy of files over the network.

If you want to copy and paste something there you go:
{{< gist kainlite  0a37bfba1ae350695790b7f5c842df63 >}}

Netcat is pretty good at it's job and it's always a good tool to have at hand, but there are other more complex tasks with sockets and for that we have socat.

More info:

- [Many uses for netcat (with a cheatsheet)](https://www.varonis.com/blog/netcat-commands/)
- [Several examples](https://www.poftut.com/netcat-nc-command-tutorial-examples/)


#### **socat**
Socat is a command line based utility that establishes two bidirectional byte streams and transfers data between them. Because the streams can be constructed from a large set of different types of data sinks and sources (see address types), and because lots of address options may be applied to the streams, socat can be used for many different purposes. That bit was extracted from the man page, socat stands for SOcket CAT and it's a multipurpose relay, we will see a few examples to clarify on what that means and some cool stuff that you can use socat for, at first it might look a bit intimidating, but trust me it worth learning to use it.

Something to have in mind when using socat it's that it needs two addresses, sometimes you can skip them with a `-`. While socat has a gazillion more use cases than cat or netcat, I will just show you a few, but hand you a few links in case you are interested in learning more, what I find particularly useful it's the ability to do a port-forward in just one line.

<script src="https://asciinema.org/a/HUuq9N8wUqZFhSKPGkpMKKzzg.js" async data-preload="true" data-speed="2" data-size="small" data-cols="125" data-rows="40" data-loop="true" id="asciicast-HUuq9N8wUqZFhSKPGkpMKKzzg" async></script>
Basically with socat your imagination is the limit in what you can do.

If you want to copy and paste something there you go:
{{< gist kainlite 27d5f53a45f6da4a65f1a94fa4dfeda5 >}}

More info:

- [Socat Examples (great resource)](https://github.com/craSH/socat/blob/master/EXAMPLES)
- [More socat examples](https://www.poftut.com/linux-multipurpose-relay-socat-command-tutorial-with-examples/)
- [Linux unix TCP Port Forwarder](https://www.cyberciti.biz/faq/linux-unix-tcp-port-forwarding/)


##### **Closing notes**
Be sure to check the links if you want to learn more about each different tool and I hope you enjoyed it, see you on [twitter](https://twitter.com/kainlite) or [github](https://github.com/kainlite)!

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
