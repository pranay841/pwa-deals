#!/bin/bash

DIR="/workspace/pwa-deals/dealsdev"
if [ ! -d "$DIR" ]; then
    #removing module files from root
    folders=(.github src .git)
    files=(.gitignore .editorconfig .eslintrc.js babel.config.json jest.config.js package.json prettier.config.js yarn.lock README.md)

    for files in "${folders[@]}"; do
        rm -r -f "$files"
    done
    for file in "${files[@]}"; do
        rm "$file"
    done

# https://magento.github.io/pwa-studio/venia-pwa-concept/setup/
url="https://deals.humcommerce.com/";
export MAGENTO_BACKEND_URL="${MAGENTO_BACKEND_URL:-${url}}"
export CHECKOUT_BRAINTREE_TOKEN="${CHECKOUT_BRAINTREE_TOKEN:-sandbox_8yrzsvtm_s2bg8fs563crhqzk}"

rm -rf /workspace/magento2gitpod/node_modules
rm -rf /workspace/magento2gitpod/.npm
rm -rf /workspace/magento2gitpod/pwa

export NVM_DIR=/workspace/magento2gitpod/pwa/nvm
mkdir -p $NVM_DIR
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
npm install yarn -g
npm install rimraf -g

cd /workspace/pwa-deals
#!/bin/bash
# https://magento.github.io/pwa-studio/venia-pwa-concept/setup/
url=$(gp url | awk -F"//" {'print $2'}) && url+="/" && url="https://8002-"$url;
export MAGENTO_BACKEND_URL="${MAGENTO_BACKEND_URL:-${url}}"
export CHECKOUT_BRAINTREE_TOKEN="${CHECKOUT_BRAINTREE_TOKEN:-sandbox_8yrzsvtm_s2bg8fs563crhqzk}"

rm -rf /workspace/magento2gitpod/node_modules
rm -rf /workspace/magento2gitpod/.npm
rm -rf /workspace/magento2gitpod/pwa

export NVM_DIR=/workspace/magento2gitpod/pwa/nvm
mkdir -p $NVM_DIR
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
npm install yarn -g
npm install rimraf -g

cd /workspace/pwa-deals && sudo apt update && sudo apt -y install expect

chmod a+rwx /workspace/pwa-deals/initialize-theme.sh
chmod a+rwx /workspace/pwa-deals/install-theme.exp &&
/workspace/pwa-deals/install-theme.exp

cd /workspace/pwa-deals/dealsdev && cp -avr .* /workspace/pwa-deals;
cd /workspace/pwa-deals && rm -r -f dealsdev;
yarn buildpack create-custom-origin ./ && yarn watch

mkdir /workspace/pwa-deals/@hbwsl && cd /workspace/pwa-deals/@hbwsl

ORIGIN_VALUE=$(git config --get remote.origin.url)

git clone $ORIGIN_VALUE && mv pwa-deals deals
fi