all:
	rm -fr build/* && cp -fr src/{chrome.manifest,defaults,gpl-3.0.txt,install.rdf} build/ && mkdir build/chrome && cd src/chrome && zip -r ../../build/chrome/templateloader.jar content locale && cd .. && zip -r ../MultiTemplateLoader-0.1.xpi *
