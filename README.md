# Build and update live site
```bash
hugo -d ~/Webs/kainlite.github.io
c kainlite.github.io
gadd && gc -m "Message" && ggpush
```

If those fancy aliases looks like something you might like to have check my [dotfiles](https://github.com/kainlite/dotfiles) and [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) :)

This handy pre-push hook will push the changes automatically when pushing to this repo with the same commit message. Save as .git/hooks/pre-push and give it +x permissions to it.
```bash
#!/bin/bash

COMMIT_MESSAGE=`git log -n 1 --pretty=format:%s ${local_ref}`

hugo -d ~/Webs/kainlite.github.io
ANYTHING_CHANGED=`cd ~/Webs/kainlite.github.io && git diff --exit-code`
if [[ $? -gt 0 ]]; then
    cd ~/Webs/kainlite.github.io && git add . && git commit -m "${COMMIT_MESSAGE}" && git push origin master
fi
```
This way we don't have to do anything manually in the other repo but to commit the proper changes here.
