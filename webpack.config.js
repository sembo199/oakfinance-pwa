const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

// Optimize chunk splitting strategy
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      minSize: 30000,
      maxSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },

  // Enable Build Caching for Faster CI Runs
  cache: {
    type: "filesystem",
  },

  // Add Bundle Analyzer to Identify Large Dependencies
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
      reportFilename: "report.html",
      openAnalyzer: false,
    }),
  ],
};
