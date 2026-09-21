const webpack = require("@nativescript/webpack");

module.exports = (env) => {
	webpack.init(env);

	// The barkoder-nativescript plugin ships raw .ts sources with iOS/Android
	// native typings that are only generated on a full native build, so ignore
	// type errors that originate inside node_modules. App code is still checked.
	webpack.chainWebpack((config) => {
		config.plugin("ForkTsCheckerWebpackPlugin").tap((args) => {
			args[0].issue = {
				...(args[0].issue || {}),
				exclude: [{ file: "**/node_modules/**" }],
			};
			return args;
		});
	});

	// Learn how to customize:
	// https://docs.nativescript.org/webpack

	return webpack.resolveConfig();
};
