/** @type {import('prettier').Config} */
module.exports = {
	arrowParens: 'always',
	endOfLine: 'lf',
	printWidth: 150,
	semi: true,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'none',
	useTabs: true,
	overrides: [
		{
			files: '*.{yml,yaml}',
			options: {
				singleQuote: false,
				useTabs: false
			}
		}
	]
};
