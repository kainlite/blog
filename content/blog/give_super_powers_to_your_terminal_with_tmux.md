---
author: "Gabriel Garrido"
date: 2019-01-23
linktitle: Give super powers to your terminal with tmux
title: Give super powers to your terminal with tmux
highlight: true
tags:
- urxvt
- vim
- linux
categories:
- linux
lua:
  image:
    url: "/img/terminal.png"
---

### **Introduction**
In this article I want to introduce you to `tmux`, you might have used `screen` in the past or heard about it, what tmux and screen are is terminal multiplexers, what does that mean? That you can have many windows/tabs and splits/panes in just one terminal window, this can really make things easier when using it as a development environment for example, you can detach from the terminal and leave things running indefinitely, or share your terminal with a colleague over ssh, for the examples I will be explaining bits of my configuration and how do I use it. The full configuration can be found [here](https://github.com/kainlite/dotfiles/blob/master/.tmux.conf). I'm using ZSH as shell and Vim as text editor.

### **Tmux**
I also use tmux to maintain sessions, for example I can only have one terminal window open because with the help from ZSH it will attach automatically to a session thanks to [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) and the plugin tmux, I use tabs aka windows a lot, sometimes I also use splits aka as panes.

Now you have some basic understanding of what tmux does and how does it name its things, let's examine some bits of the config and how to use it.

##### **Attach/detach from a session**
In order to create a session and attach to it you need to execute `tmux new -s my-session`, then to detach from it: `CTRL-a d` and to re-attach `tmux a -t my-session`, then kill it `tmux kill-session -t my-session` or logout from all windows.

##### **Prefix**
I don't use the default prefix that is: `CTRL-b`, I use `CTRL-a` like in screen.
{{< highlight bash >}}
# Use ctrl-a instead of ctrl-b
set -g prefix C-a
unbind C-b
bind C-a send-prefix
{{< /highlight >}}

##### **Example**
You can print the numbers of the panes with `CTRL-a q`, and you can navigate windows and panes as a list with `CTRL-a w`.
{{< figure src="/img/tmux-windows-panes.png" width="100%" >}}

I usually like to have 3 panes, something like this:
{{< figure src="/img/tmux-sample-usage.png" width="100%" >}}
I can edit the code or whatever in the pane 0, run commands if I need to in the pane 1, and have the webserver or code compiler, etc in the pane 2. This is very handy because I can write and test things at the same time without leaving the keyboard, or look at 2 different projects/files/etc side by side.

With `tmux ls` we can list active sessions, also tmux has a command mode (`CTRL-a :`) like Vim, where you can issue some commands or change settings on the fly, for example instead of executing `tmux ls`, you can get the same information doing `CTRL-a :` and then `ls<CR>`.

##### **Defaults**
Some helpful settings, for example start windows at 1 instead of 0, renumber on exit also makes it easier with windows.
{{< highlight bash >}}
# Start window numbers at 1 to match keyboard order with tmux window order
set -g base-index 1

# Scrollback buffer n lines
set -g history-limit 10000

# Renumber tabs on exit
set-option -g renumber-windows on

# Use vi keybindings in copy and choice modes
set-window-option -g mode-keys vi

# Enable mouse, enables you to scroll in the tmux history buffer.
set -g mouse on
{{< /highlight >}}

##### **Movement**
I move between windows with `CTRL+h` and `CTRL+l`, and between panes with `CTRL-a [hjkl]`.
{{< highlight bash >}}
# Move between windows
bind-key -n C-h prev
bind-key -n C-l next

# Move between panes
unbind h
bind h select-pane -L
unbind j
bind j select-pane -D
unbind k
bind k select-pane -U
unbind l
bind l select-pane -R
{{< /highlight >}}

##### **Configuration**
A handy trick if you are testing the configuration is to reload it from the file with `CTRL-a r`
{{< highlight bash >}}
# Force a reload of the config file
unbind r
bind r source-file ~/.tmux.conf \; display "Reloaded!"
{{< /highlight >}}

##### **Panes**
Everything is nice and shiny, but how do I open a pane or a new window?
{{< highlight bash >}}
# Horizontal and vertical splits
unbind |
bind | split-window -h
unbind -
bind - split-window
{{< /highlight >}}
Easy, `CTRL-a |` will give you a vertical pane, and `CTRL-a -` will give you an horizontal pane.
You an also re-order the panes with `CTRL-a SPACE`

You can also re-order windows with `SHIFT-Left Arrow` and `SHIFT-Right Arrow`.
{{< highlight bash >}}
# Swap windows
bind-key -n S-Left swap-window -t -1
bind-key -n S-Right swap-window -t +1
{{< /highlight >}}

##### **Status bar**
The status bar and the colors, it's fairly simple but I like it.
{{< highlight bash >}}
# Status bar has a dim gray background
set-option -g status-bg colour234
set-option -g status-fg colour0
# Left shows the session name, in blue
set-option -g status-left-bg default
set-option -g status-left-fg colour74
# Right is some CPU stats, so terminal green
set-option -g status-right-bg default
set-option -g status-right-fg colour71
# Windows are medium gray; current window is white
set-window-option -g window-status-fg colour244
set-window-option -g window-status-current-fg '#ffffff'
set-window-option -g window-status-current-bg '#000000'
# Beeped windows get a blinding orange background
set-window-option -g window-status-bell-fg '#000000'
set-window-option -g window-status-bell-bg '#d78700'
set-window-option -g window-status-bell-attr none
# Trim window titles to a reasonable length
set-window-option -g window-status-format '#[fg=yellow] #F#I#[default] #W '
set-window-option -g window-status-current-format '#[bg=yellow] #I#[bg=yellow] #W '
{{< /highlight >}}

##### **Copy/paste**
{{< figure src="/img/tmux-vi-mode.png" width="100%" >}}
Tmux also supports the vi-copy mode, you can enter this mode with `CTRL-a ESC`, then pressing `v` for normal selection or `V` for line selection you can mark and copy with `Y` (by default is `ENTER` aka `<CR>`).

And as you can imagine you can paste with `CTRL-a p`, this is really handy when copying from one pane to another or from one window to another, in Vim I recommend you `:set paste!` before pasting into it, so it doesn't try to format, etc.

It also copies to the clipboard buffer, using xsel.
{{< highlight bash >}}
# Make copy mode more vim like
bind Escape copy-mode
unbind p
bind p paste-buffer
bind-key -T edit-mode-vi Up send-keys -X history-up
bind-key -T edit-mode-vi Down send-keys -X history-down
unbind-key -T copy-mode-vi Space     ;   bind-key -T copy-mode-vi v send-keys -X begin-selection

unbind-key -T copy-mode-vi Enter     ;   bind-key -T copy-mode-vi y send-keys -X copy-pipe-and-cancel "xsel -i --clipboard"
bind-key -T copy-mode-vi Enter send-keys -X copy-pipe-and-cancel "xsel -i --clipboard"

unbind-key -T copy-mode-vi C-v       ;   bind-key -T copy-mode-vi C-v send-keys -X rectangle-toggle
unbind-key -T copy-mode-vi [         ;   bind-key -T copy-mode-vi [ send-keys -X begin-selection
unbind-key -T copy-mode-vi ]         ;   bind-key -T copy-mode-vi ] send-keys -X copy-selection
{{< /highlight >}}

If you want to learn more about tmux a good place to start is the [Arch Linux wiki](https://wiki.archlinux.org/index.php/tmux).

##### **notes**
Sometimes you can have issues with the keys `HOME` and `END`, this can help with that.
{{< highlight bash >}}
# Home / End patch
bind -n End send-key C-e
bind -n Home send-key C-a
{{< /highlight >}}

### Errata
If you spot any error or have any suggestion, please send me a message so it gets fixed.

Also, you can check the source code and changes in the [generated code](https://github.com/kainlite/kainlite.github.io) and the [sources here](https://github.com/kainlite/blog)
