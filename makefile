md:
	rm docs/*
	cp markdown/01_introduction.md ./docs
	./bin/code2md src/maybe_v1.ts ./docs
	./bin/code2md src/parsing_intro.ts ./docs
	./bin/code2md src/tree.ts ./docs
	./bin/code2md src/expression_parser_version_1.ts ./docs
	./bin/code2md src/functor.ts ./docs
	./bin/code2md src/monads.ts ./docs
	./bin/code2md src/applicative.ts ./docs
	./bin/code2md src/expression_parser_version_2.ts ./docs
build: clean
	tsc

clean:
	rm -rf ./build/*