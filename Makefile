TESTS = test/unit/*.js
REPORTER = spec
test: clean
	@npm install
	@./node_modules/pegjs/bin/pegjs peg/nquery.pegjs ./base/nquery.js 
	@./node_modules/mocha/bin/mocha  $(TESTS)

clean:

.PHONY: test
