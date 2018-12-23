# Build
```bash
hugo
```

# Build put static content into a new branch
```bash
git checkout --orphan gh-pages
git rm --cached -r .
git add .
git commit -m "Some nice message"
git push origin $(git_current_branch)
```
