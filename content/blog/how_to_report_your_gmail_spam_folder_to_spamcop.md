---
author: "Gabriel Garrido"
date: 2019-12-31
linktitle: How to report your gmail spam folder to spamcop
title: How to report your gmail spam folder to spamcop
highlight: true
tags:
- development
- golang
- go
- linux
categories:
- linux
lua:
  image:
    url: "/img/spam.jpg"
---

##### **Introduction**
This post is a bit different from the other in the sense that it's a small "tool" I did to ease spam reporting to [SpamCop.net](https://www.spamcop.net/), this helps to reduce the true Spam from unknown sources, since for some reason I started to get like 40 emails per day (all went to spam), but it is still somewhat annoying, so I started reporting it to spamcop, but the process was kind of slow and I got tired of that quickly, so I created this "script" to make things easier. Basically what it does is list all messages in the spam folders fetches them and then forwards each one as an attachment to spamcop, then you get an email with a link to confirm the submission and that's it.

There are a few pre-requisites, like enabling the GMail API for your account, you can do that [here](https://developers.google.com/gmail/api/quickstart/go#step_1_turn_on_the), after that the first time you use the app you have to authorize it, you do this by pasting the URL that the app gives you in the browser, then clicking Allow, and then pasting the token that it gives you back in the terminal (this only needs to be done once), after that you just run the binary in a cronjob or maybe even as a lambda (but I haven't gone there yet), I usually check the spam folder remove what I don't think it's spam or whatever and then run the script to report everything else that it is clearly spam, it takes a few seconds and then I get the link to confirm all reports (one by one, sadly), this script is not perfect as sometimes spamcop cannot read properly the forwarded email, but I have checked exporting those as a file and I do see them all right, so that will be an investigation for another day, this only took like 2-4 hours, having 0 knowledge of the GMail API, etc.

Also you need to setup a spamcop account which you will be using to send your reports, you can do that [here](https://www.spamcop.net/anonsignup.shtml)

The source code can be found [here](https://github.com/kainlite/spamcop)

##### **Code**
I have added some comments along the code to make things easy to understand
{{< gist kainlite 557731e9b398e593fc6a176cd9f705e5 >}}

##### **Running it**
{{< gist kainlite 244d04580a8ca63e4bbecdcecd649840 >}}

### Additional notes
While this still needs some work hopefully will keep my account clean and probably help someone wondering about how to do the same.

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
