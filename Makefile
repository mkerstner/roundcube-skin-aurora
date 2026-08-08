# Aurora skin build.
#
# Aurora extends Elastic and compiles its own CSS from Elastic's LESS sources
# plus Aurora's token/component layers. Bootstrap must be present in the parent
# Elastic skin (bin/install-jsdeps.sh in the repo root).

build: css js

css:
	npx lessc --clean-css="--s1 --advanced" styles/styles.less > styles/styles.min.css
	npx lessc --clean-css="--s1 --advanced" styles/print.less > styles/print.min.css
	npx lessc --clean-css="--s1 --advanced" styles/embed.less > styles/embed.min.css

# Self-hosted web-component bundle (Shoelace). Resolves @shoelace-style/shoelace
# from the repo-root node_modules.
js:
	npx esbuild src/webcomponents.js --bundle --format=esm --minify --outfile=deps/shoelace/aurora-shoelace.min.js
