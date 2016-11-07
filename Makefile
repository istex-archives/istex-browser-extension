# istex-web-extension's Makefile

SHELL:=/bin/bash

# Generate XPI Install file
main:
	zip -r istex-web-extension.xpi * -x@zip-exclusion.lst

