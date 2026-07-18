# Youness Mellak - Research Portfolio

This repository is a customized build of the original [al-folio](https://github.com/alshedivat/al-folio) Jekyll theme, organized in the style of Tachella's research website.

## Main content files

- `_pages/about.md` - biography and experience
- `_pages/publications.md` - publications page
- `_news/` - the two current conference announcements
- `_bibliography/papers.bib` - publication metadata and dynamic links
- `_data/socials.yml` - email and professional profiles
- `assets/img/` - profile image, institution logos, publication previews
- `assets/pdf/` - local paper PDFs
- `_sass/_custom.scss` - portfolio-specific styling

## Run locally

Install Ruby and Bundler, then run:

```bash
bundle install
bundle exec jekyll serve
```

Open `http://localhost:4000`.

## Publish with GitHub Pages

Push the repository to `Mellak/Mellak.github.io`, then select **GitHub Actions** in **Settings > Pages**. The included workflow builds and deploys the site.
