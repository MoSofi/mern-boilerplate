module.exports = {
	entry: {
		main: "./react/main-app.js",
		style: './public/scss/style.scss'
	},
	output: {
		filename: "public/scripts/[name]-bundle.js"
	},

	// debug: true, // < debugging
	devtool: "#eval-source-map", // < debugging
	module: {
		loaders: [
			{
				exclude: /(node_modules|public|app_api|app_server|bin)/,
				loader: 'babel-loader',
				query: {
					presets: ['es2015', 'react', "stage-2"],
					plugins: ["transform-class-properties"]
				}
			},
			{
				test: /\.css$/,
				use: [ 'style-loader', 'css-loader' ]
			},
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'public/styles/[name].css',
                        }
                    },
                    {
                        loader: 'extract-loader'
                    },
                    {
                        loader: 'css-loader?-url'
                    },
                    {
                        loader: 'postcss-loader'
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
		]
	}
};