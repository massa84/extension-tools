#!/usr/bin/env node

var commander = require('commander');
var fs = require('fs');

var exec = require('./exec');
var gitVersion = require('./git-version');

function setVersionKey(manifestPath, newVersion) {
	var manifest = JSON.parse(fs.readFileSync(manifestPath));
	manifest.version = newVersion;
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null /* replacer */, 2) + '\n')
}

function gitBranch() {
	return exec('git', 'symbolic-ref', '--short', 'HEAD').then(function(result) {
		return result[0].trim();
	});
}

function main() {
	var manifestPath;
	commander
	  .description('Set the \'version\' field in a Chrome or Firefox extension manifest')
	  .usage('[options] <manifest path>')
	  .option('--require-branch [BRANCH]', 'Verify that the current Git branch is [BRANCH]')
	  .action(function(_manifestPath) {
		  manifestPath = _manifestPath;
	  });
	commander.parse(process.argv);

	if (!manifestPath) {
		throw new Error('Manifest path not specified');
	}

	gitBranch().then(function(branch) {
		if (commander.requireBranch && commander.requireBranch !== branch) {
			throw new Error('Current branch ' + branch + ' does not match ' + commander.requireBranch);
		}
		return gitVersion.gitVersion();
	}).then(function(version) {
		var buildVersion = gitVersion.buildVersionFromGitVersion(version);
		setVersionKey(manifestPath, buildVersion);
	}).done();
}

module.exports = {
	setVersionKey: setVersionKey
};

if (require.main === module) {
	main();
}

