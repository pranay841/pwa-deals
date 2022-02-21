#!/bin/bash

DIR="/workspace/pwa-deals/@hbwsl"
if [ ! -d "$DIR" ]; then
    #removing module files from root
    folders=(.github src)
    files=(.gitignore .editorconfig .eslintrc.js babel.config.json jest.config.js package.json prettier.config.js yarn.lock README.md)

    for files in "${folders[@]}"; do
        rm -r -f "$files"
    done
    for file in "${files[@]}"; do
        rm -f "$file"
    done

# https://magento.github.io/pwa-studio/venia-pwa-concept/setup/


rm -rf /workspace/magento2gitpod/node_modules
rm -rf /workspace/magento2gitpod/.npm

export NVM_DIR=/workspace/pwa-deals/nvm
mkdir -p $NVM_DIR
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
. "$NVM_DIR/nvm.sh"
nvm install 16.14.0
nvm use 16.14.0
npm install yarn -g
npm install rimraf -g

cd /workspace/pwa-deals && sudo apt update && sudo apt -y install expect

chmod a+rwx /workspace/pwa-deals/initialize-theme.sh
chmod a+rwx /workspace/pwa-deals/install-theme.exp &&
/workspace/pwa-deals/install-theme.exp

cd /workspace/pwa-deals/dealsdev && cp -avr .* /workspace/pwa-deals;
cd /workspace/pwa-deals && rm -r -f dealsdev;
cd /workspace/pwa-deals

mkdir /workspace/pwa-deals/@hbwsl && cd /workspace/pwa-deals/@hbwsl

ORIGIN_VALUE=$(git config --get remote.origin.url)

git clone $ORIGIN_VALUE && mv pwa-deals deals
cd /workspace/pwa-deals && rm -rf .git
sed -i 's/_SERVER_PORT=0/_SERVER_PORT=10000/g' /workspace/pwa-deals/.env

yarn add axios file-saver sass sass-loader@^10.1.1 link:./@hbwsl/deals

WEBPACK_CONFIG_EXT="config.module.rules.push({test: /\\.s[ca]ss$/,use: ['style-loader',{loader: require.resolve('css-loader'),options: {importLoaders: 1,modules: true,modules : {localIdentName: '[name]__[local]__[hash:base64:3]',},},},'sass-loader']});"
sed  -i".bak" -e  "/return \[config\]/i $WEBPACK_CONFIG_EXT" /workspace/pwa-deals/webpack.config.js
yarn install && yarn run build && yarn run start
fi
