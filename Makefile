all:
	@rm -f MultiTemplateLoader-*.xpi
	cd src && zip -r ../MultiTemplateLoader-0.1.9.1.xpi *
