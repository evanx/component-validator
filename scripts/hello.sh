
c2validateComponent() {
  component=$1
  url=$2
  echo; echo $component
  npm install $url
  node_modules/.bin/babel node_modules/$component/index.js -o build/hello-component-class.js
  componentModule=$component npm start
}

c2validateComponent hello-component-class https://github.com/evanx/hello-component-class
c2validateComponent hello-component https://github.com/evanx/hello-component
