require "bibtex"

# Liquid filter returning the raw BibTeX of an entry in the site bibliography, e.g.
#   {{ project.bib | bibtex_for | hideCustomBibtex }}
# Used by the project cards and popups, which live outside a {% bibliography %} loop.
module Jekyll
  module BibtexFor
    @@bibtex_for_cache = {}

    def bibtex_for(key)
      site = @context.registers[:site]
      scholar = site.config["scholar"] || {}
      path = File.join(site.source, scholar["source"] || "_bibliography", scholar["bibliography"] || "papers.bib")
      cache = (@@bibtex_for_cache ||= {})
      mtime = File.mtime(path).to_f
      unless cache[:mtime] == mtime
        cache[:mtime] = mtime
        cache[:bib] = BibTeX.parse(File.read(path, encoding: "UTF-8"))
      end
      entry = cache[:bib][key.to_s]
      raise ArgumentError, "bibtex_for: no entry '#{key}' in #{path}" unless entry
      quotes = scholar["bibtex_quotes"] || ["{", "}"]
      entry.to_s(quotes: quotes)
    end
  end
end

Liquid::Template.register_filter(Jekyll::BibtexFor)
